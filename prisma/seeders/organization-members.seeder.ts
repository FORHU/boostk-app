import { prisma } from "@/lib/prisma";

export async function boostkMemberSeeder() {
  const boostkOrg = await prisma.organization.findUnique({
    where: { slug: "boostk" },
  });

  if (!boostkOrg) {
    throw new Error("Boostk organization not found, please seed organizations first");
  }

  // Define users and their target roles
  const boostkUsersConfig = [
    { email: "super-admin@boostk.com", role: "Super Admin" },
    { email: "support@boostk.com", role: "Support" },
  ];

  for (const config of boostkUsersConfig) {
    const user = await prisma.user.findUnique({
      where: { email: config.email },
    });

    if (!user) {
      console.warn(`⚠️ User ${config.email} not found, skipping member seeding.`);
      continue;
    }

    const orgRole = await prisma.organizationRole.findFirst({
      where: {
        organizationId: boostkOrg.id,
        role: config.role,
      },
    });

    if (!orgRole) {
      console.warn(`⚠️ Role ${config.role} not found for Boostk org, skipping member seeding for ${user.email}.`);
      continue;
    }

    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: boostkOrg.id,
        },
      },
      update: {
        role: config.role,
        customRoleId: orgRole.id,
      },
      create: {
        userId: user.id,
        organizationId: boostkOrg.id,
        role: config.role,
        customRoleId: orgRole.id,
      },
    });

    console.log(`✅ Seeded member: ${user.email} as ${config.role} in Boostk`);
  }
}

export async function forhuMemberSeeder() {
  const forhuOrg = await prisma.organization.findUnique({
    where: { slug: "forhu" },
  });

  if (!forhuOrg) {
    throw new Error("Forhu organization not found, please seed organizations first");
  }

  const forhuUsersConfig = [
    { email: "admin@forhu.com", role: "Admin" },
    { email: "staff-1@forhu.com", role: "Staff" },
    { email: "staff-2@forhu.com", role: "Staff" },
    { email: "agent-1@forhu.com", role: "Agent" },
    { email: "agent-2@forhu.com", role: "Agent" },
    { email: "agent-3@forhu.com", role: "Agent" },
  ];

  for (const config of forhuUsersConfig) {
    const user = await prisma.user.findUnique({
      where: { email: config.email },
    });

    if (!user) {
      console.warn(`⚠️ User ${config.email} not found, skipping member seeding.`);
      continue;
    }

    const orgRole = await prisma.organizationRole.findFirst({
      where: {
        organizationId: forhuOrg.id,
        role: config.role,
      },
    });

    if (!orgRole) {
      console.warn(`⚠️ Role ${config.role} not found for Forhu org, skipping member seeding for ${user.email}.`);
      continue;
    }

    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: forhuOrg.id,
        },
      },
      update: {
        role: config.role,
        customRoleId: orgRole.id,
      },
      create: {
        userId: user.id,
        organizationId: forhuOrg.id,
        role: config.role,
        customRoleId: orgRole.id,
      },
    });

    console.log(`✅ Seeded member: ${user.email} as ${config.role} in Forhu`);
  }
}

export async function testOrgMemberSeeder() {
  const testOrg = await prisma.organization.findUnique({
    where: { slug: "test-org" },
  });

  if (!testOrg) {
    throw new Error("Test organization not found, please seed organizations first");
  }

  const testOrgUsersConfig = [{ email: "test-admin@testorg.com", role: "Admin" }];

  for (const config of testOrgUsersConfig) {
    const user = await prisma.user.findUnique({
      where: { email: config.email },
    });

    if (!user) {
      console.warn(`⚠️ User ${config.email} not found, skipping member seeding.`);
      continue;
    }

    const orgRole = await prisma.organizationRole.findFirst({
      where: {
        organizationId: testOrg.id,
        role: config.role,
      },
    });

    if (!orgRole) {
      console.warn(`⚠️ Role ${config.role} not found for Test org, skipping member seeding for ${user.email}.`);
      continue;
    }

    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: testOrg.id,
        },
      },
      update: {
        role: config.role,
        customRoleId: orgRole.id,
      },
      create: {
        userId: user.id,
        organizationId: testOrg.id,
        role: config.role,
        customRoleId: orgRole.id,
      },
    });

    console.log(`✅ Seeded member: ${user.email} as ${config.role} in Test Org`);
  }
}
