import { prisma } from "@/lib/prisma";

export default async function organizationRoleTemplateSeeder() {
  console.log("🛡️ Seeding organization role templates...");

  const templates = [
    {
      name: "Super Admin",
      description: "Super Admin role",
      permission: "",
      isSystemRole: true,
    },
    {
      name: "Support",
      description: "Support role",
      permission: "",
      isSystemRole: true,
    },
    {
      name: "Admin",
      description: "Admin role",
      permission: "",
      isSystemRole: false,
    },
    {
      name: "Staff",
      description: "Staff role",
      permission: "",
      isSystemRole: false,
    },
    {
      name: "Agent",
      description: "Agent role",
      permission: "",
      isSystemRole: false,
    },
  ];

  for (const t of templates) {
    try {
      await prisma.organizationRoleTemplate.upsert({
        where: { name: t.name },
        update: {
          description: t.description,
          permission: t.permission,
          isSystemRole: t.isSystemRole,
        },
        create: {
          name: t.name,
          description: t.description,
          permission: t.permission,
          isSystemRole: t.isSystemRole,
        },
      });
      console.log(`✅ Upserted role template: ${t.name}`);
    } catch (error) {
      console.error(`❌ Error seeding role template ${t.name}:`, error);
    }
  }
}
