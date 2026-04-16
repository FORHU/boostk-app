import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
  organizationId: z.string().min(1, "Org ID is required"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const getProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});
export type GetProjectInput = z.infer<typeof getProjectSchema>;
