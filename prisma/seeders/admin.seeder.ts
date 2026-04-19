import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { GenderType } from "prisma/generated/enums";

export const admins = [
  { email: "owner@example.com", name: "System Owner", role: "owner" },
];

export default async function adminSeeder() {
  const password = "Password123!";

  console.log("👤 Seeding system owner...");

  for (const userData of admins) {
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
