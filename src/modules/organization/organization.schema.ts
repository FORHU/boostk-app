import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
