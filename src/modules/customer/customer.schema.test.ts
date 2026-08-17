import { describe, expect, it } from "vitest";
import { CreateCustomerSchema, GetCustomerThreadSchema, GetProjectCustomersSchema } from "./customer.schema";

const validCustomer = { name: "Jun", email: "jun@example.com", projectId: "proj_1" };

describe("CreateCustomerSchema", () => {
  it("accepts the minimum a visitor has to supply", () => {
    expect(CreateCustomerSchema.safeParse(validCustomer).success).toBe(true);
  });

  it("requires a name, an email and a project", () => {
    expect(CreateCustomerSchema.safeParse({ ...validCustomer, name: "" }).success).toBe(false);
    expect(CreateCustomerSchema.safeParse({ ...validCustomer, email: undefined }).success).toBe(false);
    expect(CreateCustomerSchema.safeParse({ ...validCustomer, projectId: undefined }).success).toBe(false);
  });

  it("rejects malformed email addresses", () => {
    for (const email of ["jun", "jun@", "@example.com", "jun example.com", ""]) {
      expect(CreateCustomerSchema.safeParse({ ...validCustomer, email }).success).toBe(false);
    }
  });

  it("treats phone and metadata as optional", () => {
    expect(CreateCustomerSchema.safeParse({ ...validCustomer, phone: "+639171234567" }).success).toBe(true);
    expect(CreateCustomerSchema.safeParse({ ...validCustomer, metadata: "from the pricing page" }).success).toBe(true);
  });
});

describe("GetProjectCustomersSchema", () => {
  it("defaults to the first page when the caller omits pagination", () => {
    const parsed = GetProjectCustomersSchema.parse({ projectId: "proj_1" });

    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(8);
  });

  // The cap is what stops a caller pulling an entire tenant's customer list in one call.
  it("holds the page size between 1 and 50", () => {
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", pageSize: 50 }).success).toBe(true);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", pageSize: 51 }).success).toBe(false);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", pageSize: 0 }).success).toBe(false);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", pageSize: 2.5 }).success).toBe(false);
  });

  // `page` feeds `skip: (page - 1) * pageSize` in customer.functions.ts, so a zero or
  // negative page would compute a negative offset and Prisma would throw at query time.
  it("requires a whole page number of at least 1", () => {
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", page: 1 }).success).toBe(true);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", page: 0 }).success).toBe(false);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", page: -1 }).success).toBe(false);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", page: 1.5 }).success).toBe(false);
  });

  it("bounds the search term so it cannot be used as an oversized payload", () => {
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", search: "x".repeat(200) }).success).toBe(true);
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p", search: "x".repeat(201) }).success).toBe(false);
  });

  it("treats search and pagination as optional", () => {
    expect(GetProjectCustomersSchema.safeParse({ projectId: "p" }).success).toBe(true);
  });
});

describe("GetCustomerThreadSchema", () => {
  // Both ids are required: the project is the tenancy boundary the handler scopes on, so
  // a customer id alone must never be enough to open a thread.
  it("requires both the project and the customer", () => {
    expect(GetCustomerThreadSchema.safeParse({ projectId: "p", customerId: "c" }).success).toBe(true);
    expect(GetCustomerThreadSchema.safeParse({ customerId: "c" }).success).toBe(false);
    expect(GetCustomerThreadSchema.safeParse({ projectId: "p" }).success).toBe(false);
  });
});
