import { prisma } from "@/lib/prisma";

export default async function roleTemplateSeeder() {
  console.log("🛡️ Seeding organization role templates...");

  const templates = [
    {
      roleName: "owner",
      description: "Organization Owner (Full Access)",
      permission: JSON.stringify([{ action: "*", resource: "*" }]),
    },
    {
      roleName: "admin",
      description: "Organization Admin",
      permission: JSON.stringify([{ action: "read", resource: "project" }, { action: "create", resource: "project" }, { action: "update", resource: "project" }]), // simplistic dummy permission
    },
    {
      roleName: "member",
      description: "Organization Member",
      permission: JSON.stringify([{ action: "read", resource: "project" }]),
    },
    {
      roleName: "agent",
      description: "Customer Support Agent",
      permission: JSON.stringify([{ action: "manage", resource: "ticket" }]),
    },
  ];

  for (const t of templates) {
    try {
      await prisma.organizationRoleTemplate.upsert({
        where: { roleName: t.roleName },
        update: {
          description: t.description,
          permission: t.permission,
        },
        create: {
          roleName: t.roleName,
          description: t.description,
          permission: t.permission,
        },
      });
      console.log(`✅ Upserted role template: ${t.roleName}`);
    } catch (error: any) {
      console.error(`❌ Error seeding role template ${t.roleName}:`, error.message);
    }
  }
}
