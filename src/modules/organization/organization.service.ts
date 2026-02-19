import { prisma } from "prisma/db";
import type { CreateOrganizationInput } from "./organization.model";

export const OrganizationService = {
  async create(data: CreateOrganizationInput) {
    return await prisma.organization.create({
      data: {
        name: data.name,
      },
    });
  },

  async getAll() {
    return await prisma.organization.findMany();
  },
};
