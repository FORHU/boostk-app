import { prisma } from "@/lib/prisma";

export const getAuthDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // get roles
  // get permission

  return user;
};

export const getGlobalPermission = async (globalRoles: string[]) => {
  const permission = await prisma.globalRole.findMany({
    where: {
      name: { in: globalRoles },
    },
  });
  return permission;
};
