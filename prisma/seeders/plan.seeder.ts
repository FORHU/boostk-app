import { prisma } from "@/lib/prisma";

export default async function planSeeder() {
  console.log("📦 Seeding subscription plans...");

  const plans = [
    {
      name: "Free",
      description: "Free plan with limited scopes",
      scopes: ["project:read", "ticket:read", "test:free"],
    },
    {
      name: "Basic",
      description: "Basic plan with limited scopes",
      scopes: ["project:read", "ticket:read", "test:free", "test:basic"],
    },
    {
      name: "Premium",
      description: "Standard plan with essential scopes",
      scopes: ["project:read", "project:create", "project:update", "ticket:read", "ticket:create", "test:free", "test:basic", "test:premium"],
    },
    {
      name: "Enterprise",
      description: "Full access to all scopes",
      scopes: [
        "project:read", "project:create", "project:update", "project:delete",
        "ticket:read", "ticket:create", "ticket:update", "ticket:delete",
        "organization:manage",
        "test:free", "test:basic", "test:premium", "test:enterprise"
      ],
    },
  ];

  for (const plan of plans) {
    try {
      await prisma.subscriptionPlan.upsert({
        where: { name: plan.name },
        update: {
          scopes: plan.scopes,
          description: plan.description,
        },
        create: {
          name: plan.name,
          scopes: plan.scopes,
          description: plan.description,
        },
      });
      console.log(`✅ Upserted plan: ${plan.name}`);
    } catch (error: any) {
      console.error(`❌ Error seeding plan ${plan.name}:`, error.message);
    }
  }
}
