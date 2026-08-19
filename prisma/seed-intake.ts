import { prisma } from "@/lib/prisma";
import intakeSeeder from "./seeds/intake.seeder";

/**
 * Production-safe seed entry point: the global intake org/project ONLY.
 *
 * `prisma/seed.ts` — what `prisma db seed` runs — also creates demo tenants (Forhu,
 * Organization 1 and ten @example.com users). That is fine locally and very much not
 * fine on a live database, so deployment runs THIS file instead:
 *
 *   bun run prisma/seed-intake.ts
 *
 * Everything it does is an upsert, so it is safe to run on every deploy.
 * Set PLATFORM_STAFF_EMAILS to grant the BOOSTK team access to /dashboard/triage.
 */
async function main() {
  try {
    await intakeSeeder();
  } catch (error) {
    console.error("❌ Intake seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
