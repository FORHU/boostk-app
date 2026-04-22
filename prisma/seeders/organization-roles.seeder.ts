import { prisma } from "@/lib/prisma";

export async function boostKRolesSeeder() {
  const boostkOrg = await prisma.organization.findUnique({
    where: { slug: "boostk" },
  });

  if (!boostkOrg) {
    throw new Error("Boostk organization not found, please seed organizations first");
  }

  // get all role templates
  const roleTemplates = await prisma.organizationRoleTemplate.findMany();

  const organizationRoles = roleTemplates.map((roleTemplate) => {
    return {
      organizationId: boostkOrg.id,
      role: roleTemplate.name,
      permission: roleTemplate.permission,
      isDefaultRole: true,
    };
  });

  await prisma.organizationRole.createMany({
    data: organizationRoles,
  });
}

export async function forhuRolesSeeder() {
  const forhuOrg = await prisma.organization.findUnique({
    where: { slug: "forhu" },
  });

  if (!forhuOrg) {
    throw new Error("Forhu organization not found, please seed organizations first");
  }

  // get all role templates except system roles
  const roleTemplates = await prisma.organizationRoleTemplate.findMany({
    where: {
      isSystemRole: false,
    },
  });

  const organizationRoles = roleTemplates.map((roleTemplate) => {
    return {
      organizationId: forhuOrg.id,
      role: roleTemplate.name,
      permission: roleTemplate.permission,
      isDefaultRole: true,
    };
  });

  await prisma.organizationRole.createMany({
    data: organizationRoles,
  });
}

export async function testOrgRolesSeeder() {
  const testOrg = await prisma.organization.findUnique({
    where: { slug: "test-org" },
  });

  if (!testOrg) {
    throw new Error("Test organization not found, please seed organizations first");
  }

  // get all role templates except system roles
  const roleTemplates = await prisma.organizationRoleTemplate.findMany({
    where: {
      isSystemRole: false,
    },
  });

  const organizationRoles = roleTemplates.map((roleTemplate) => {
    return {
      organizationId: testOrg.id,
      role: roleTemplate.name,
      permission: roleTemplate.permission,
      isDefaultRole: true,
    };
  });

  await prisma.organizationRole.createMany({
    data: organizationRoles,
  });
}
