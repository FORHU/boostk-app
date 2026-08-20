import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

interface ProjectData {
  organizations: { name: string; slug: string } | { name: string; slug: string }[];
  projects:
    | { name: string; slug?: string; description?: string }
    | { name: string; slug?: string; description?: string }[];
}

export default async function projectSeeder(data: ProjectData) {
  const { organizations, projects } = data;

  console.log("🏢 Seeding projects...");

  const orgSlugs = Array.isArray(organizations)
    ? organizations.map((o) => o.slug)
    : [organizations.slug];

  const dbOrgs = await prisma.organization.findMany({
    where: { slug: { in: orgSlugs } },
  });

  if (dbOrgs.length === 0) {
    console.error("❌ No organizations found. Seed organizations before projects.");
    return;
  }

  const projectsArray = Array.isArray(projects) ? projects : [projects];

  for (let i = 0; i < projectsArray.length; i++) {
    const project = projectsArray[i];
    const organization = dbOrgs[i % dbOrgs.length];

    const slug = project.slug || generateSlug(project.name);

    try {
      await prisma.project.upsert({
        where: { slug: slug },
        update: {
          name: project.name,
          description: project.description || null,
          organizationId: organization.id,
        },
        create: {
          name: project.name,
          slug: slug,
          description: project.description || null,
          organizationId: organization.id,
        },
      });
      console.log(`✅ Upsert project: ${project.name} (${slug}) in ${organization.name}`);
    } catch (error: any) {
      console.error(`❌ Error seeding ${project.name}:`, error.message);
    }
  }
}