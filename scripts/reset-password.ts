import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Dev utility: set a user's password directly, for accounts created through normal
 * signup whose password has been forgotten.
 *
 *   bun run scripts/reset-password.ts <email> <new-password>
 *
 * Goes through Better Auth's own hasher via `auth.$context` rather than writing the
 * `accounts` row by hand — the stored format (algorithm, salt, encoding) is Better Auth's
 * business, and hand-rolling it produces a row that silently fails every login.
 *
 * LOCAL USE ONLY. This bypasses the email-verification reset flow entirely, so it must
 * never be exposed as an endpoint or run against production.
 */
async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error("Usage: bun run scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters (Better Auth's default minimum).");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.error(`❌ No user with email ${email}`);
    process.exit(1);
  }

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(newPassword);

  // A user can have several linked accounts (OAuth, etc.); only the credential one
  // carries a password.
  const credential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });

  if (credential) {
    await prisma.account.update({ where: { id: credential.id }, data: { password: hash } });
    console.log(`✅ Password updated for ${user.email}`);
  } else {
    // Signed up via a provider that never created a credential row — add one so email +
    // password login starts working for this account.
    await ctx.internalAdapter.createAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hash,
    });
    console.log(`✅ Credential account created for ${user.email} — email/password login now enabled`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Password reset failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
