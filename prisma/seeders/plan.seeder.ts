import { prisma } from "@/lib/prisma";

export async function plansSeeder() {
  const plans = [
    {
      name: "FREE",
      description: "Starter plan",
      scopes: ["projects:1"],
    },
    {
      name: "PRO",
      description: "Professional plan",
      scopes: ["projects:3"],
    },
    {
      name: "ENTERPRISE",
      description: "Unlimited access",
      scopes: ["projects:*"],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });

    console.log(`✅ Upserted plan: ${plan.name}`);
  }
}
