import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { ticket: { create: vi.fn() } },
}));

vi.mock("./ticket.utils", () => ({
  generateTicketReferenceNumber: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createTicket } from "./ticket.service";
import { generateTicketReferenceNumber } from "./ticket.utils";

const baseData = {
  status: TicketStatus.OPEN,
  priority: TicketPriority.LOW,
  projectId: "project-1",
  customerId: "customer-1",
};

const ticket = {
  id: "ticket-1",
  referenceNumber: "TK-AAAAAA",
  status: TicketStatus.OPEN,
  priority: TicketPriority.LOW,
  projectId: "project-1",
  customerId: "customer-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const uniqueConstraintError = (target: string[]) => ({ code: "P2002", meta: { target } });

describe("createTicket", () => {
  const createMock = vi.mocked(prisma.ticket.create);
  const refMock = vi.mocked(generateTicketReferenceNumber);

  beforeEach(() => {
    vi.resetAllMocks();
    for (const ref of ["TK-AAAAAA", "TK-BBBBBB", "TK-CCCCCC", "TK-DDDDDD", "TK-EEEEEE", "TK-FFFFFF"]) {
      refMock.mockReturnValueOnce(ref);
    }
    createMock.mockResolvedValue(ticket);
  });

  it("creates a ticket with the generated reference on the first attempt", async () => {
    const result = await createTicket(baseData);

    expect(result).toEqual(ticket);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0].data.referenceNumber).toBe("TK-AAAAAA");
    expect(createMock.mock.calls[0][0].data).toMatchObject(baseData);
  });

  it("retries with a fresh reference when the insert hits the referenceNumber unique constraint", async () => {
    createMock.mockRejectedValueOnce(uniqueConstraintError(["referenceNumber"])).mockResolvedValueOnce(ticket);

    const result = await createTicket(baseData);

    expect(result).toEqual(ticket);
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock.mock.calls[0][0].data.referenceNumber).toBe("TK-AAAAAA");
    expect(createMock.mock.calls[1][0].data.referenceNumber).toBe("TK-BBBBBB");
  });

  it("gives up after the bounded number of attempts instead of recursing", async () => {
    createMock.mockRejectedValue(uniqueConstraintError(["referenceNumber"]));

    await expect(createTicket(baseData)).rejects.toThrow("Failed to generate a unique ticket reference number");
    expect(createMock).toHaveBeenCalledTimes(5);
  });

  it("rethrows non-unique-constraint errors without retrying", async () => {
    const dbError = Object.assign(new Error("database is down"), { code: "P5000" });
    createMock.mockRejectedValueOnce(dbError);

    await expect(createTicket(baseData)).rejects.toThrow("database is down");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("rethrows a unique-constraint error on a different target without retrying", async () => {
    createMock.mockRejectedValueOnce(uniqueConstraintError(["id"]));

    await expect(createTicket(baseData)).rejects.toThrow();
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
