import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { auth } from "@/lib/auth";

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
});

export const createUser = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    return await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });
  });
