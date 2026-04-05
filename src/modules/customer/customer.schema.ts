import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  metadata: z.string().optional(),
  projectId: z.string(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
