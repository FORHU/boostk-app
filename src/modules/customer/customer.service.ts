import { prisma } from "@/lib/prisma";
import type { CreateCustomerInput } from "@/modules/customer/customer.schema";

export const createCustomer = async (data: CreateCustomerInput) => {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      metadata: data.metadata,
      projectId: data.projectId,
    },
  });

  return customer;
};
