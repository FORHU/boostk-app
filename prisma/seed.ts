import { prisma } from "@/lib/prisma";
import userSeeder from "./seeds/user.seeder";
import organizationSeeder from "./seeds/organization.seeder";

const sampleDataForhu = {
  organizations: { name: "Forhu", slug: "forhu" },
  users: [
    { email: "forhu-admin@example.com", name: "Forhu Admin", role: "admin" },
    { email: "forhu-agent@example.com", name: "Forhu Agent", role: "agent" },
    { email: "forhu-user1@example.com", name: "Forhu User1", role: "user" },
    { email: "forhu-user2@example.com", name: "Forhu User2", role: "user" },
    { email: "forhu-user3@example.com", name: "Forhu User3", role: "user" },
  ],
};

const sampleData = {
  organizations: { name: "Organization 1", slug: "organization-1" },
  users: [
    { email: "organization1-admin@example.com", name: "Organization 1 Admin", role: "admin" },
    { email: "organization1-agent@example.com", name: "Organization 1 Agent", role: "agent" },
    { email: "organization1-user1@example.com", name: "Organization 1 User1", role: "user" },
    { email: "organization1-user2@example.com", name: "Organization 1 User2", role: "user" },
    { email: "organization1-user3@example.com", name: "Organization 1 User3", role: "user" },
  ],
};

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    await organizationSeeder(sampleDataForhu);
    await userSeeder(sampleDataForhu);

    await organizationSeeder(sampleData);
    await userSeeder(sampleData);

    console.log("✅ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
