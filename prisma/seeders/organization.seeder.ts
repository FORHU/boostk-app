import { prisma } from "@/lib/prisma";

export async function seedOrganizations() {
  const free = await prisma.subscriptionPlan.findUnique({
    where: { name: "FREE" },
  });

  const pro = await prisma.subscriptionPlan.findUnique({
    where: { name: "PRO" },
  });

  const enterprise = await prisma.subscriptionPlan.findUnique({
    where: { name: "ENTERPRISE" },
  });

  if (!free || !pro || !enterprise) {
    throw new Error("Plans not found, please seed plans first");
  }

  const organizations = [
    {
      name: "BoostK",
      slug: "boostk",
      planId: enterprise.id,
    },
    {
      name: "Forhu",
      slug: "forhu",
      planId: pro.id,
    },
    {
      name: "Test Org",
      slug: "test-org",
      planId: free.id,
    },
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: org,
      create: org,
    });

    console.log(`✅ Upserted organization: ${org.name}`);
  }
}
