import { ProjectStatus } from "prisma/generated/enums";
import { prisma } from "@/lib/prisma";

export async function boostKProjectsSeeder() {
  const boostkOrg = await prisma.organization.findUnique({
    where: { slug: "boostk" },
  });

  if (!boostkOrg) {
    throw new Error("Boostk organization not found, please seed organizations first");
  }

  const projects = [
    {
      name: "BoostK Support",
      slug: "boostk-support",
      description: "Primary support project for BoostK",
      status: ProjectStatus.ACTIVE,
      organizationId: boostkOrg.id,
    },
    {
      name: "BoostK Internal",
      slug: "boostk-internal",
      description: "Internal development and testing project",
      status: ProjectStatus.INACTIVE,
      organizationId: boostkOrg.id,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    });
    console.log(`✅ Upserted project: ${project.name} (${project.status}) for BoostK`);
  }
}

export async function forhuProjectsSeeder() {
  const forhuOrg = await prisma.organization.findUnique({
    where: { slug: "forhu" },
  });

  if (!forhuOrg) {
    throw new Error("Forhu organization not found, please seed organizations first");
  }

  const projects = [
    {
      name: "Forhu Main",
      slug: "forhu-main",
      description: "Main project for Forhu operations",
      status: ProjectStatus.ACTIVE,
      organizationId: forhuOrg.id,
    },
    {
      name: "Forhu Legacy",
      slug: "forhu-legacy",
      description: "Archived project for historical data",
      status: ProjectStatus.ARCHIVED,
      organizationId: forhuOrg.id,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    });
    console.log(`✅ Upserted project: ${project.name} (${project.status}) for Forhu`);
  }
}

export async function testOrgProjectsSeeder() {
  const testOrg = await prisma.organization.findUnique({
    where: { slug: "test-org" },
  });

  if (!testOrg) {
    throw new Error("Test organization not found, please seed organizations first");
  }

  const projects = [
    {
      name: "Test Project Active",
      slug: "test-project-active",
      description: "Active project for testing purposes",
      status: ProjectStatus.ACTIVE,
      organizationId: testOrg.id,
    },
    {
      name: "Test Project Inactive",
      slug: "test-project-inactive",
      description: "Inactive project for testing purposes",
      status: ProjectStatus.INACTIVE,
      organizationId: testOrg.id,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    });
    console.log(`✅ Upserted project: ${project.name} (${project.status}) for Test Org`);
  }
}
