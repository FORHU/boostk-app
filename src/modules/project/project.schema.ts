import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
  organizationId: z.string(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
