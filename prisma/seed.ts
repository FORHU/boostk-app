import { authClient } from "@/lib/auth-client";
import { prisma } from "./db";

const users = [
  {name: "Verified User",email: "verified@example.com",emailVerified: true,},
  {name: "Unverified User",email: "unverified@example.com",emailVerified: false,},
];


const seed = async () => {
  console.log("🌱 Starting seed...");

  const userIds: string[] = [];

  for (const user of users) {
    // Check if user exists first to avoid duplicates
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      userIds.push(existingUser.id);
      continue;
    }

    // Create new user
    const newUser = await authClient.signUp.email({
        email: user.email,
        password: "Password123!",
        name: user.name,
    });

    if (newUser.error) {
      console.error("❌ Seed failed", newUser.error);
      throw newUser.error;
    }

    if (newUser.data.user) {
        // Update emailVerified manually
        const updatedUser = await prisma.user.update({
            where: { id: newUser.data.user.id },
            data: { emailVerified: user.emailVerified }
        });
        userIds.push(updatedUser.id);
    }
  }

  console.log("✅ Seeding finished successfully.");
};

seed()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
