import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_ROLE } from "@/modules/auth/roles";

/**
 * Create (or promote) a BOOSTK platform staff account -- the person who answers the
 * global chat from /dashboard/triage.
 *
 *   bun run scripts/create-platform-staff.ts <email> [password] [name]
 *
 * The password may instead be passed as STAFF_PASSWORD, which keeps it out of shell
 * history and out of `docker inspect` on the deployed host. Prefer that in production.
 *
 * Why this exists alongside `prisma/seed-intake.ts`: that seeder only promotes accounts
 * that ALREADY exist, because it runs on every deploy and must never invent logins. On a
 * fresh production database nobody has signed up yet, so there is nothing to promote --
 * this closes that gap for the first staff member.
 *
 * Production-safe and idempotent:
 *   - user missing  -> created through Better Auth's own signup, then promoted
 *   - user exists   -> promoted only; the existing password is never touched
 *
 * Account creation goes through `auth.api.signUpEmail` rather than writing `users` and
 * `accounts` by hand, for the same reason `reset-password.ts` uses Better Auth's hasher:
 * the stored credential format is Better Auth's business, and a hand-built row fails
 * every login silently.
 */
async function main() {
  const [email, passwordArg, nameArg] = process.argv.slice(2);
  const password = process.env.STAFF_PASSWORD ?? passwordArg;

  if (!email) {
    console.error("Usage: bun run scripts/create-platform-staff.ts <email> [password] [name]");
    console.error("       (or set STAFF_PASSWORD instead of passing it as an argument)");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, platformRole: true },
  });

  if (!existing) {
    if (!password) {
      console.error(`❌ No account for ${normalizedEmail}, so a password is required to create one.`);
      console.error("   Pass it as the 2nd argument or set STAFF_PASSWORD.");
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("❌ Password must be at least 8 characters (Better Auth's default minimum).");
      process.exit(1);
    }

    await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password,
        // Better Auth requires a name; fall back to the local part of the address.
        name: nameArg?.trim() || normalizedEmail.split("@")[0],
      },
    });

    // There is no mail delivery configured, so nobody can act on a verification email.
    // Leaving this false would block sign-in the moment verification is switched on.
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: true },
    });

    console.log(`✅ Created account ${normalizedEmail}`);
  } else {
    console.log(`ℹ️  Account ${normalizedEmail} already exists — password left unchanged.`);
    if (password) console.log("   (the password argument was ignored; this script never overwrites one)");
  }

  const user = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { platformRole: PLATFORM_ROLE.STAFF },
    select: { email: true, platformRole: true },
  });

  console.log(`✅ ${user.email} is now platform staff (platformRole=${user.platformRole})`);
  console.log("   Sign in and open /dashboard/triage — no logout needed, the role is read per-request.");
  console.log(`   Add ${user.email} to PLATFORM_STAFF_EMAILS so future deploys keep the grant.`);
}

main()
  .catch((error) => {
    console.error("❌ Failed to create platform staff:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
