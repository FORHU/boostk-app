import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { GenderType } from "prisma/generated/enums";

export const seedUsersList = [
  { email: "admin1@example.com", name: "System Admin 1", role: "admin" },
  { email: "admin2@example.com", name: "System Admin 2", role: "admin" },
  { email: "member1@example.com", name: "System Member 1", role: "member" },
  { email: "member2@example.com", name: "System Member 2", role: "member" },
  { email: "agent1@example.com", name: "System Agent 1", role: "agent" },
  { email: "agent2@example.com", name: "System Agent 2", role: "agent" },
  { email: "agent3@example.com", name: "System Agent 3", role: "agent" },
];

export default async function userSeeder() {
  const password = "Password123!";

  console.log("👤 Seeding core platform users...");

  for (const userData of seedUsersList) {
    try {
      await ensureUser(userData, password);
    } catch (error: any) {
      console.error(`❌ Error processing ${userData.email}:`, error.message);
    }
  }
}

const assignRandomGender = () => Math.random() < 0.5 ? GenderType.MALE : GenderType.FEMALE;

async function ensureUser(userData: { email: string; name: string; role: string }, password: string) {
  let user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: password,
        name: userData.name,
        gender: assignRandomGender(),
      },
    });

    user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          // global role logic if applicable elsewhere, but skip for basic user 
        },
      });
      console.log(`✅ Created user: ${userData.email}`);
    }
  } else {
    console.log(`ℹ️  User exists: ${userData.email}`);
  }

  return user;
}
