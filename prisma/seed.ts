import { prisma } from "@/lib/prisma";
import userSeeder from "./seeds/user.seeder";
import organizationSeeder from "./seeds/organization.seeder";
import projectSeeder from "./seeds/project.seeder";

const sampleDataForhu = {
  organizations: { name: "Forhu", slug: "forhu" },
  users: [
    { email: "forhu-admin@example.com", name: "Forhu Admin", role: "admin" },
    { email: "forhu-agent@example.com", name: "Forhu Agent", role: "agent" },
    { email: "forhu-user1@example.com", name: "Forhu User1", role: "member" },
    { email: "forhu-user2@example.com", name: "Forhu User2", role: "member" },
    { email: "forhu-user3@example.com", name: "Forhu User3", role: "member" },
  ],
  projects: [
    { name: "Boostk", slug: "boostk", description: "Human and AI collaboration platform" },
    { name: "Chumme", slug: "chumme", description: "Social Media for fan groups and influencer" },
    { name: "Cheapest Go", slug: "cheapest-go", description: "Hotel and Flight Booking" },
  ],
};

const sampleData = {
  organizations: { name: "Organization 1", slug: "organization-1" },
  users: [
    { email: "organization1-admin@example.com", name: "Organization 1 Admin", role: "admin" },
    { email: "organization1-agent@example.com", name: "Organization 1 Agent", role: "agent" },
    { email: "organization1-user1@example.com", name: "Organization 1 User1", role: "member" },
    { email: "organization1-user2@example.com", name: "Organization 1 User2", role: "member" },
    { email: "organization1-user3@example.com", name: "Organization 1 User3", role: "member" },
  ],
  projects: [
    { name: "Project 1", slug: "project-1", description: "Project 1" },
    { name: "Project 2", slug: "project-2", description: "Project 2" },
    { name: "Project 3", slug: "project-3", description: "Project 3" },
  ],
};

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // TODO: Seed super admin

    await organizationSeeder(sampleDataForhu);
    await userSeeder(sampleDataForhu);
    await projectSeeder(sampleDataForhu);

    await organizationSeeder(sampleData);
    await userSeeder(sampleData);
    await projectSeeder(sampleData);

    console.log("✅ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
