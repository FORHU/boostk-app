// import type { User } from "better-auth";
// import { prisma } from "prisma/db";
// import type { CreateProjectInput } from "../project/project.schema";
// import type { CreateOrganizationInput } from "./organization.schema";

// export const OrganizationService = {
//   async create(data: CreateOrganizationInput, user: User) {
//     const org = await prisma.organization.create({ data });

//     await prisma.user.update({
//       where: { id: user.id },
//       data: { organization: { connect: { id: org.id } } },
//     });

//     return org;
//   },

//   async getAll() {
//     return await prisma.organization.findMany();
//   },

//   // Get projects belonging to a specific Org
//   async getProjects(organizationId: string) {
//     const org = await prisma.organization.findUnique({
//       where: { id: organizationId },
//     });

//     if (!org) return null;

//     return await prisma.project.findMany({
//       where: { orgId: organizationId },
//     });
//   },

//   // Create a project linked to this Org
//   async createProject(organizationId: string, data: CreateProjectInput) {
//     return await prisma.$transaction(async (tx) => {
//       const project = await tx.project.create({
//         data: {
//           ...data,
//           apiKey: "",
//           organization: { connect: { id: organizationId } },
//         },
//       });

//       return await tx.project.update({
//         where: { id: project.id },
//         data: {
//           apiKey: `ch-api-${project.id}`,
//         },
//       });
//     });
//   },
// };
