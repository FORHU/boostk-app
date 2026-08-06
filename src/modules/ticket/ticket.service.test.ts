import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createCustomer } from "../customer/customer.service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ticket: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    member: { findFirst: vi.fn() },
    project: { findUnique: vi.fn() },
  },
}));

vi.mock("./ticket.utils", () => ({
  generateTicketReferenceNumber: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("../customer/customer.service", () => ({
  createCustomer: vi.fn(),
}));

import {
  assignTicket,
  createTicket,
  createTicketSession,
  getTicketSession,
  TICKET_COOKIE_MAX_AGE,
  TICKET_COOKIE_NAME,
  TICKET_COOKIE_PATH,
} from "./ticket.service";
import { generateTicketReferenceNumber } from "./ticket.utils";

const baseData = {
  status: TicketStatus.OPEN,
  priority: TicketPriority.LOW,
  projectId: "project-1",
  customerId: "customer-1",
};

const customerInput = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  metadata: "",
  projectId: "project-1",
};

const ticket = {
  id: "ticket-1",
  referenceNumber: "TK-AAAAAA",
  status: TicketStatus.OPEN,
  priority: TicketPriority.LOW,
  projectId: "project-1",
  customerId: "customer-1",
  assignedAgentId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const customer = {
  id: "customer-1",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  metadata: "",
  language: null,
  projectId: "project-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const ticketWithCustomer = { ...ticket, customer };

const project = {
  id: "project-1",
  name: "Project 1",
  description: null,
  logo: null,
  slug: "project-1",
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

describe("getTicketSession", () => {
  const getCookieMock = vi.mocked(getCookie);
  const setCookieMock = vi.mocked(setCookie);
  const findFirstMock = vi.mocked(prisma.ticket.findFirst);

  beforeEach(() => {
    vi.resetAllMocks();
    getCookieMock.mockReturnValue("TK-AAAAAA");
    findFirstMock.mockResolvedValue(ticketWithCustomer);
  });

  it("returns null without querying when no cookie is set", async () => {
    getCookieMock.mockReturnValue(undefined);

    const result = await getTicketSession("project-1");

    expect(result).toBeNull();
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns the project-scoped ticket when the cookie matches", async () => {
    const result = await getTicketSession("project-1");

    expect(result).toEqual(ticketWithCustomer);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { referenceNumber: "TK-AAAAAA", projectId: "project-1" },
      include: { customer: true },
    });
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it("clears the stale cookie and returns null when no ticket matches", async () => {
    findFirstMock.mockResolvedValue(null);

    const result = await getTicketSession("project-1");

    expect(result).toBeNull();
    expect(setCookieMock).toHaveBeenCalledWith(TICKET_COOKIE_NAME, "", {
      maxAge: 0,
      path: TICKET_COOKIE_PATH,
    });
  });
});

describe("createTicketSession", () => {
  const findUniqueMock = vi.mocked(prisma.project.findUnique);
  const createCustomerMock = vi.mocked(createCustomer);
  const createMock = vi.mocked(prisma.ticket.create);
  const refMock = vi.mocked(generateTicketReferenceNumber);
  const setCookieMock = vi.mocked(setCookie);

  beforeEach(() => {
    vi.resetAllMocks();
    findUniqueMock.mockResolvedValue(project);
    createCustomerMock.mockResolvedValue(customer);
    refMock.mockReturnValueOnce("TK-AAAAAA");
    createMock.mockResolvedValue(ticket);
  });

  it("throws when the project does not exist without creating a customer or ticket", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(createTicketSession(customerInput)).rejects.toThrow("Project not found");
    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a customer and an OPEN/LOW ticket, then sets the ticket cookie", async () => {
    const result = await createTicketSession(customerInput);

    expect(createCustomerMock).toHaveBeenCalledWith(customerInput);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        projectId: "project-1",
        customerId: "customer-1",
        referenceNumber: "TK-AAAAAA",
      },
    });
    expect(setCookieMock).toHaveBeenCalledWith(TICKET_COOKIE_NAME, "TK-AAAAAA", {
      maxAge: TICKET_COOKIE_MAX_AGE,
      path: TICKET_COOKIE_PATH,
    });
    expect(result).toEqual({ customer, ticket });
  });
});

describe("assignTicket", () => {
  const memberFindFirstMock = vi.mocked(prisma.member.findFirst);
  const updateMock = vi.mocked(prisma.ticket.update);

  const agentMember = {
    id: "member-agent-1",
    organizationId: "org-1",
    userId: "user-agent-1",
    role: "agent",
  };

  const baseInput = {
    projectId: "project-1",
    ticketId: "ticket-1",
    assignedAgentId: "member-agent-1",
  };

  const updatedTicket = {
    id: "ticket-1",
    referenceNumber: "TK-AAAAAA",
    status: TicketStatus.OPEN,
    priority: TicketPriority.LOW,
    projectId: "project-1",
    customerId: "customer-1",
    assignedAgentId: "member-agent-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    memberFindFirstMock.mockResolvedValue(agentMember);
    updateMock.mockResolvedValue(updatedTicket);
  });

  it("assigns the ticket when the assignee is an agent in the project's org", async () => {
    const result = await assignTicket(baseInput);

    expect(result).toEqual(updatedTicket);
    expect(memberFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "member-agent-1",
        organization: { projects: { some: { id: "project-1" } } },
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "ticket-1", projectId: "project-1" },
      data: { assignedAgentId: "member-agent-1" },
    });
  });

  it("rejects an assignee who is not a member of the project's org", async () => {
    memberFindFirstMock.mockResolvedValue(null);

    await expect(assignTicket(baseInput)).rejects.toThrow("Assignee is not a member of this project's organization.");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an assignee whose role is below agent (e.g. member)", async () => {
    memberFindFirstMock.mockResolvedValue({ ...agentMember, role: "member" });

    await expect(assignTicket(baseInput)).rejects.toThrow("Assignee must have the agent role or higher.");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("accepts an admin assignee", async () => {
    memberFindFirstMock.mockResolvedValue({ ...agentMember, role: "admin" });

    const result = await assignTicket(baseInput);

    expect(result).toEqual(updatedTicket);
    expect(updateMock).toHaveBeenCalled();
  });

  it("unassigns the ticket when assignedAgentId is null without a membership check", async () => {
    updateMock.mockResolvedValue({ ...updatedTicket, assignedAgentId: null });

    const result = await assignTicket({ ...baseInput, assignedAgentId: null });

    expect(result).toEqual({ ...updatedTicket, assignedAgentId: null });
    expect(memberFindFirstMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "ticket-1", projectId: "project-1" },
      data: { assignedAgentId: null },
    });
  });
});
