import { prisma } from "@/lib/prisma";

import { seedUsers } from "./seeders/user.seeder";
import { seedOrganizations } from "./seeders/organization.seeder";
import { plansSeeder } from "./seeders/plan.seeder";
import { boostKRolesSeeder, forhuRolesSeeder, testOrgRolesSeeder } from "./seeders/organization-roles.seeder";
import roleTemplateSeeder from "./seeders/organization-role-template.seeder";
import { boostkMemberSeeder, forhuMemberSeeder, testOrgMemberSeeder } from "./seeders/organization-members.seeder";
import organizationRoleTemplateSeeder from "./seeders/organization-role-template.seeder";
import { boostKProjectsSeeder, forhuProjectsSeeder, testOrgProjectsSeeder } from "./seeders/project.seeder";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    await roleTemplateSeeder();
    await plansSeeder();
    
    await seedUsers();

    await seedOrganizations();
    await organizationRoleTemplateSeeder();
    
    await boostKRolesSeeder();
    await boostkMemberSeeder();
    await boostKProjectsSeeder();

    await forhuRolesSeeder();
    await forhuMemberSeeder();
    await forhuProjectsSeeder();

    await testOrgRolesSeeder();
    await testOrgMemberSeeder();
    await testOrgProjectsSeeder();

    console.log("✅ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
