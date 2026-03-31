import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function userSeeder() {
  const password = "password123!";
  const users = [
    { email: "admin@example.com", name: "Admin" },
    { email: "user@example.com", name: "User" },
    { email: "agent@example.com", name: "Agent" },
  ];

  console.log("👤 Seeding default users...");

  for (const user of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        console.warn(`[-] User ${user.email} already exists, skipping.`);
        continue;
      }

      await auth.api.signUpEmail({
        body: {
          email: user.email,
          password: password,
          name: user.name,
        },
      });

      // Auto-verify email for seeded users
      await prisma.user.update({
        where: { email: user.email },
        data: { emailVerified: true },
      });

      console.log(`✅ Created user: ${user.email}`);
    } catch (error: any) {
      console.error(`❌ Error creating ${user.email}:`, error);
    }
  }
}