import { prisma } from "@/lib/prisma";
import userSeeder from "./seeds/user.seeder";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    await userSeeder();

    console.log("✅ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
