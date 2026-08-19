import type { Member, User } from "prisma/generated/client";
import { z } from "zod";

export const GetOrgMembersSchema = z.object({
  organizationId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(8),
  role: z.enum(["admin", "agent", "member"]).optional(),
  search: z.string().max(200).optional(),
});

export type GetOrgMembersInput = z.infer<typeof GetOrgMembersSchema>;

export type OrgMembersPage = {
  members: Array<Member & { user: User }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
