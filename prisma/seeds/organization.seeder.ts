import { prisma } from "@/lib/prisma";

interface OrganizationData {
  organizations: { name: string; slug: string } | { name: string; slug: string }[];
}

export default async function organizationSeeder(data: OrganizationData) {
  console.log("🏢 Seeding organizations...");

  const orgsArray = Array.isArray(data.organizations) 
    ? data.organizations 
    : [data.organizations];

  for (const org of orgsArray) {
    try {
      await prisma.organization.upsert({
        where: { slug: org.slug },
        update: { name: org.name },
        create: {
          name: org.name,
          slug: org.slug,
        },
      });
      console.log(`✅ Upsert organization: ${org.name}`);
    } catch (error: any) {
      console.error(`❌ Error seeding ${org.name}:`, error.message);
    }
  }
}