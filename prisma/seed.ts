import { prisma } from "@/lib/prisma";
import userSeeder from "./seeders/user.seeder";
import organizationSeeder from "./seeders/organization.seeder";
import projectSeeder from "./seeders/project.seeder";
import planSeeder from "./seeders/plan.seeder";
import roleTemplateSeeder from "./seeders/role-template.seeder";
import adminSeeder from "./seeders/admin.seeder";

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
