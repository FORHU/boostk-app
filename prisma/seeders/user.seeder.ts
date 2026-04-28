import { GenderType } from "prisma/generated/client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const generateRandomGender = () => {
  return Math.random() < 0.5 ? GenderType.MALE : GenderType.FEMALE;
};

const DEFAULT_PASSWORD = "password123!";

const users: SeedUser[] = [
  {
    email: "super-admin@boostk.com",
    name: "Super Admin",
    role: "admin",
  },
  {
    email: "support@boostk.com",
    name: "Support User",
    role: "admin",
  },
  {
    email: "admin@forhu.com",
    name: "Forhu Admin",
    role: "user",
  },
  {
    email: "staff-1@forhu.com",
    name: "Forhu Staff 1",
    role: "user",
  },
  {
    email: "staff-2@forhu.com",
    name: "Forhu Staff 2",
    role: "user",
  },
  {
    email: "agent-1@forhu.com",
    name: "Forhu Agent 1",
    role: "user",
  },
  {
    email: "agent-2@forhu.com",
    name: "Forhu Agent 2",
    role: "user",
  },
  {
    email: "agent-3@forhu.com",
    name: "Forhu Agent 3",
    role: "user",
  },
  {
    email: "test-admin@testorg.com",
    name: "Test Admin",
    role: "user",
  },
];

type SeedUser = {
  email: string;
  name: string;
  role: string;
};

async function ensureUser(userData: SeedUser, password: string) {
  let user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: password,
        name: userData.name,
        gender: generateRandomGender(),
      },
    });

    // 2. Fetch the newly created user to update extra fields
    user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          role: userData.role, // Ensure the role gets applied to the database
        },
      });
      console.log(`✅ Created user: ${userData.email}`);
    }
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: userData.role,
      },
    });
    console.log(`ℹ️  User exists: ${userData.email}`);
  }

  return user;
}

export async function seedUsers() {
  for (const user of users) {
    await ensureUser(user, DEFAULT_PASSWORD);
  }
}
