import { prisma } from "@/lib/prisma";
import userSeeder from "./seeds/user.seeder";
import organizationSeeder from "./seeds/organization.seeder";
import projectSeeder from "./seeds/project.seeder";
import planSeeder from "./seeds/plan.seeder";
import roleTemplateSeeder from "./seeds/role-template.seeder";
import adminSeeder from "./seeds/admin.seeder";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    await planSeeder();
    await roleTemplateSeeder();

    await adminSeeder();
    await userSeeder();
    await organizationSeeder();
    await projectSeeder();

    console.log("✅ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
