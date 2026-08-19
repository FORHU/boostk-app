import { prisma } from "@/lib/prisma";
import { PLATFORM_ROLE } from "@/modules/auth/roles";
import { INTAKE_ORG_SLUG, INTAKE_PROJECT_SLUG } from "@/modules/intake/intake.constants";

/**
 * Seeds the infrastructure the global chat depends on. Unlike the sample-data seeders
 * beside it, this one is NOT demo data — the public /chat route throws without it, so it
 * must run in every environment including production. Everything here is an upsert, so
 * re-running it is safe.
 *
 * Grant the first BOOSTK staff by setting PLATFORM_STAFF_EMAILS to a comma-separated
 * list; without at least one, the triage inbox is unreachable and intake conversations
 * pile up unseen. Only existing users are promoted — this never creates accounts.
 */
export default async function intakeSeeder() {
  console.log("📥 Seeding global intake org and project...");

  const organization = await prisma.organization.upsert({
    where: { slug: INTAKE_ORG_SLUG },
    update: {},
    create: { name: "BOOSTK", slug: INTAKE_ORG_SLUG },
  });

  await prisma.project.upsert({
    where: { slug: INTAKE_PROJECT_SLUG },
    update: {},
    create: {
      name: "Global Intake",
      slug: INTAKE_PROJECT_SLUG,
      description: "Untriaged conversations from the public global chat. Routed to a client project by BOOSTK staff.",
      organizationId: organization.id,
    },
  });

  console.log(`✅ Intake project ready: ${INTAKE_ORG_SLUG}/${INTAKE_PROJECT_SLUG}`);

  const staffEmails = (process.env.PLATFORM_STAFF_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (staffEmails.length === 0) {
    console.warn(
      "⚠️  No PLATFORM_STAFF_EMAILS set — nobody can open /dashboard/triage yet. Set it and re-run, or update users.platformRole by hand.",
    );
    return;
  }

  const { count } = await prisma.user.updateMany({
    where: { email: { in: staffEmails } },
    data: { platformRole: PLATFORM_ROLE.STAFF },
  });

  console.log(`✅ Promoted ${count}/${staffEmails.length} user(s) to platform staff.`);
  if (count < staffEmails.length) {
    console.warn("⚠️  Some emails matched no user — they must sign up first, then re-run the seed.");
  }
}
