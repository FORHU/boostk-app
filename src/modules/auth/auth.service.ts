import { prisma } from "@/lib/prisma";

export const getGlobalPermission = async (globalRoles: string[]) => {
  const permission = await prisma.globalRole.findMany({
    where: {
      name: { in: globalRoles },
    },
  });
  return permission;
};
