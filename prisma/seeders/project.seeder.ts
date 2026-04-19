import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

const genericProjects = [
  { name: "Alpha Project", description: "Primary frontend development" },
  { name: "Beta Project", description: "Backend APIs and Data" },
  { name: "Gamma Project", description: "Growth Strategy and Ops" }
];

export default async function projectSeeder() {
  console.log("🏢 Seeding projects...");

  const organizations = await prisma.organization.findMany();

  if (organizations.length === 0) {
    console.error("❌ No organizations found. Seed organizations before projects.");
    return;
  }

  for (const organization of organizations) {
    for (const project of genericProjects) {
      const slug = generateSlug(`${organization.slug}-${project.name}`);

      try {
        await prisma.project.upsert({
          where: { slug: slug },
          update: {
            name: project.name,
            description: project.description,
            organizationId: organization.id,
          },
          create: {
            name: project.name,
            slug: slug,
            description: project.description,
            organizationId: organization.id,
          },
        });
        console.log(`✅ Upsert project: ${project.name} in ${organization.name}`);
      } catch (error: any) {
        console.error(`❌ Error seeding ${project.name}:`, error.message);
      }
    }
  }
}