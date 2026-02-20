import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
