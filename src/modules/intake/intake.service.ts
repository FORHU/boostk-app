import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { publishToPlatformStaff, publishToProjectAgents } from "@/modules/notification/notification.publish";
import { createTicket } from "@/modules/ticket/ticket.service";
import { generateTicketReferenceNumber } from "@/modules/ticket/ticket.utils";
import { INTAKE_COOKIE_MAX_AGE, INTAKE_COOKIE_NAME, INTAKE_COOKIE_PATH, INTAKE_PROJECT_SLUG } from "./intake.constants";
import type {
  CloseIntakeTicketInput,
  GetTriageQueueInput,
  RouteIntakeTicketInput,
  StartIntakeChatInput,
} from "./intake.schema";

// ---------------------------------------------------------------------------
// Intake project resolution
// ---------------------------------------------------------------------------

/**
 * The seeded intake project's id, cached for the lifetime of the process.
 *
 * Untriaged chats need *a* project because `Customer.projectId` and
 * `Ticket.projectId` are both required — making them nullable would have meant
 * revisiting every query, guard and socket room in the app. Parking intake in a
 * real project keeps all of that working untouched.
 */
let cachedIntakeProjectId: string | null = null;

export const resolveIntakeProjectId = async (): Promise<string> => {
  if (cachedIntakeProjectId) return cachedIntakeProjectId;

  const project = await prisma.project.findUnique({
    where: { slug: INTAKE_PROJECT_SLUG },
    select: { id: true },
  });

  if (!project) {
    throw new Error(
      `Intake project "${INTAKE_PROJECT_SLUG}" is missing. Run \`bun prisma db seed\` to create it before enabling global chat.`,
    );
  }

  cachedIntakeProjectId = project.id;
  return project.id;
};

/** True when a ticket belongs to the intake queue rather than a real customer project. */
export const isIntakeProject = async (projectId: string) => projectId === (await resolveIntakeProjectId());

// ---------------------------------------------------------------------------
// Visitor session — cookie is intentionally NOT shared with the project widget
// ---------------------------------------------------------------------------

export const setIntakeCookie = (referenceNumber: string) =>
  setCookie(INTAKE_COOKIE_NAME, referenceNumber, {
    maxAge: INTAKE_COOKIE_MAX_AGE,
    path: INTAKE_COOKIE_PATH,
  });

export const clearIntakeCookie = () => {
  setCookie(INTAKE_COOKIE_NAME, "", { maxAge: 0, path: INTAKE_COOKIE_PATH });
};

/**
 * Resolve the visitor's current conversation from their cookie — deliberately WITHOUT
 * a projectId filter.
 *
 * This is the key difference from `getTicketSession`. Once triage routes a chat, the
 * visitor's live ticket moves to the receiving org's project, and the cookie is
 * repointed to it. A project-scoped lookup would fail to find that ticket and wipe the
 * cookie, dropping the visitor mid-conversation. Here the reference number itself is
 * the credential, exactly as it already is for the widget.
 */
const intakeTicketInclude = {
  customer: true,
  project: { select: { id: true, name: true, logo: true } },
  routedTicket: { select: { referenceNumber: true } },
} as const;

export const getIntakeSession = async () => {
  const referenceNumber = getCookie(INTAKE_COOKIE_NAME);
  if (!referenceNumber) return null;

  const ticket = await prisma.ticket.findUnique({
    where: { referenceNumber },
    include: intakeTicketInclude,
  });

  if (!ticket) {
    clearIntakeCookie();
    return null;
  }

  // Follow a completed handoff.
  //
  // Triage runs in a BOOSTK staff member's request, so it cannot write this visitor's
  // cookie — `setCookie` would land on the staff browser instead. The visitor therefore
  // catches up here, on their own next request: the intake ticket names its replacement,
  // and the cookie is re-pointed at it. This also covers a visitor who simply closes the
  // tab and comes back days later, with no socket event involved.
  //
  // Exactly one hop is possible: the routed ticket lives in a client project, and only
  // tickets inside the intake project can be routed.
  if (ticket.routedTicket) {
    const routed = await prisma.ticket.findUnique({
      where: { referenceNumber: ticket.routedTicket.referenceNumber },
      include: intakeTicketInclude,
    });

    if (routed) {
      setIntakeCookie(routed.referenceNumber);
      return routed;
    }
  }

  return ticket;
};

/**
 * Open a new global conversation. Creates the customer and ticket inside the intake
 * project and notifies BOOSTK staff — not org agents, since no org owns this yet.
 */
export const startIntakeSession = async (data: StartIntakeChatInput) => {
  const intakeProjectId = await resolveIntakeProjectId();

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      // The intake form's "what is this about" is kept on metadata so triage can read
      // it without opening the thread. Same field the widget uses for its `?ref=` label.
      metadata: data.subject,
      projectId: intakeProjectId,
    },
  });

  const ticket = await createTicket({
    status: TicketStatus.OPEN,
    priority: TicketPriority.LOW,
    projectId: intakeProjectId,
    customerId: customer.id,
  });

  setIntakeCookie(ticket.referenceNumber);

  await publishToPlatformStaff({
    event: EventType.TICKET_CREATED,
    data: {
      ticketId: ticket.id,
      referenceNumber: ticket.referenceNumber,
      projectId: intakeProjectId,
      projectName: "Global intake",
      customerName: customer.name,
      customerEmail: customer.email,
      isIntake: true,
      createdAt: ticket.createdAt.toISOString(),
    },
  });

  return { customer, ticket };
};

// ---------------------------------------------------------------------------
// Triage
// ---------------------------------------------------------------------------

/**
 * Route an intake conversation to an organization + project.
 *
 * Creates a NEW ticket in the target project rather than re-parenting the intake one.
 * `Customer` is project-scoped, so a matching customer row is created alongside it, and
 * the intake transcript is copied across so the receiving agent sees the full history
 * instead of a conversation that starts mid-sentence.
 *
 * The whole thing runs in a transaction: a half-routed chat — visible to the org but
 * still sitting in the triage queue, or vice versa — would be worse than a failed route.
 */
export const routeIntakeTicket = async ({
  intakeTicketId,
  organizationId,
  projectId,
  triagedById,
}: RouteIntakeTicketInput & { triagedById: string }) => {
  const intakeProjectId = await resolveIntakeProjectId();

  const [intakeTicket, targetProject] = await Promise.all([
    prisma.ticket.findFirst({
      where: { id: intakeTicketId, projectId: intakeProjectId },
      include: {
        customer: true,
        // Pinned: an inline literal widens to `string` and collapses the `include`
        // payload type back to plain scalars.
        ticketMessages: { orderBy: { createdAt: "asc" as const } },
      },
    }),
    prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true, name: true },
    }),
  ]);

  if (!intakeTicket) throw new Error("Intake conversation not found.");
  if (intakeTicket.routedAt) throw new Error("This conversation has already been routed.");
  if (!targetProject) throw new Error("Target project does not belong to the selected organization.");

  const routed = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name: intakeTicket.customer.name,
        email: intakeTicket.customer.email,
        phone: intakeTicket.customer.phone,
        metadata: intakeTicket.customer.metadata,
        // Carried over or agent replies silently stop being translated for this
        // visitor — language is detected during intake, not on the routed ticket.
        language: intakeTicket.customer.language,
        projectId: targetProject.id,
      },
    });

    // `createTicket` can't be reused here: it writes through the top-level client, so
    // its ticket would survive even if the rest of this transaction rolled back.
    // `generateUniqueReferenceNumber` runs the same retry loop on the transaction client.
    const newTicket = await tx.ticket.create({
      data: {
        referenceNumber: await generateUniqueReferenceNumber(tx),
        status: TicketStatus.OPEN,
        priority: intakeTicket.priority,
        projectId: targetProject.id,
        customerId: customer.id,
        intakeTicketId: intakeTicket.id,
      },
    });

    if (intakeTicket.ticketMessages.length > 0) {
      await tx.ticketMessage.createMany({
        data: intakeTicket.ticketMessages.map((message) => ({
          content: message.content,
          contentType: message.contentType,
          translatedContent: message.translatedContent,
          sourceLang: message.sourceLang,
          targetLang: message.targetLang,
          ticketId: newTicket.id,
          // Customer-authored messages are re-pointed at the new customer row; agent
          // messages keep their original author.
          customerId: message.customerId ? customer.id : null,
          userId: message.userId,
          createdAt: message.createdAt,
        })),
      });
    }

    await tx.ticket.update({
      where: { id: intakeTicket.id },
      data: { status: TicketStatus.CLOSED, routedAt: new Date(), triagedById },
    });

    return { newTicket, customer };
  });

  // NOTE: the visitor's cookie is deliberately NOT written here. This runs inside a
  // BOOSTK staff member's request, so `setCookie` would attach to *their* browser and
  // hijack their own session. The visitor re-points itself in `getIntakeSession` via the
  // `routedTicket` link, prompted by the TICKET_ROUTED event on the intake channel.

  await publishToProjectAgents({
    projectId: targetProject.id,
    event: EventType.TICKET_CREATED,
    data: {
      ticketId: routed.newTicket.id,
      referenceNumber: routed.newTicket.referenceNumber,
      projectId: targetProject.id,
      projectName: targetProject.name,
      customerName: routed.customer.name,
      customerEmail: routed.customer.email,
      routedFromIntake: true,
      createdAt: routed.newTicket.createdAt.toISOString(),
    },
  });

  return routed.newTicket;
};

/** Close an intake conversation that belongs to no organization (spam, or simply no fit). */
export const closeIntakeTicket = async ({
  intakeTicketId,
  reason,
  triagedById,
}: CloseIntakeTicketInput & { triagedById: string }) => {
  const intakeProjectId = await resolveIntakeProjectId();

  const intakeTicket = await prisma.ticket.findFirst({
    where: { id: intakeTicketId, projectId: intakeProjectId },
    select: { id: true, routedAt: true },
  });

  if (!intakeTicket) throw new Error("Intake conversation not found.");
  if (intakeTicket.routedAt) throw new Error("This conversation has already been routed.");

  return prisma.ticket.update({
    where: { id: intakeTicket.id },
    data: {
      status: TicketStatus.CLOSED,
      triagedById,
      triageNote: reason,
      // `routedAt` stays null: closed-without-routing is a distinct outcome from routed,
      // and leaving it null keeps the triage queue's "routed" filter meaningful.
    },
    select: { id: true, status: true, triageNote: true },
  });
};

// ---------------------------------------------------------------------------
// Triage reads
// ---------------------------------------------------------------------------

/**
 * The untriaged queue: open conversations sitting in the intake project. Routed and
 * closed chats drop out because triage sets them to CLOSED.
 */
export const getTriageQueue = async ({ search, take, cursor }: GetTriageQueueInput) => {
  const intakeProjectId = await resolveIntakeProjectId();

  // Every argument is supplied unconditionally, passing `undefined` where a filter does
  // not apply. Conditional spreads (`...(search ? {…} : {})`) turn the argument into a
  // union, and Prisma's payload inference collapses `include` back to plain scalars when
  // it sees one — the same failure mode as an unpinned `orderBy` literal.
  const customerFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const tickets = await prisma.ticket.findMany({
    where: {
      projectId: intakeProjectId,
      status: TicketStatus.OPEN,
      customer: customerFilter,
    },
    orderBy: { createdAt: "asc" as const }, // oldest first — the queue is worked front to back
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true, language: true, metadata: true },
      },
      ticketMessages: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { id: true, content: true, contentType: true, createdAt: true },
      },
      _count: { select: { ticketMessages: true } },
    },
  });

  const hasMore = tickets.length > take;
  const page = hasMore ? tickets.slice(0, take) : tickets;

  return {
    items: page.map((ticket) => ({
      id: ticket.id,
      referenceNumber: ticket.referenceNumber,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      customer: ticket.customer,
      latestMessage: ticket.ticketMessages[0] ?? null,
      messageCount: ticket._count.ticketMessages,
    })),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
};

/** Full transcript of one intake conversation for the triage detail panel. */
export const getTriageThread = async (intakeTicketId: string) => {
  const intakeProjectId = await resolveIntakeProjectId();

  return prisma.ticket.findFirst({
    where: { id: intakeTicketId, projectId: intakeProjectId },
    include: {
      customer: true,
      ticketMessages: {
        orderBy: { createdAt: "asc" as const },
        include: { attachment: true },
      },
      routedTicket: {
        select: { id: true, referenceNumber: true, project: { select: { id: true, name: true } } },
      },
    },
  });
};

/**
 * Every organization and its projects, for the routing picker. Platform staff route
 * across all tenants by definition, so this is deliberately unscoped — the
 * `requirePlatformStaffMiddleware` on the calling server fn is what makes it safe.
 */
export const getTriageTargets = async () =>
  prisma.organization.findMany({
    // Pinned: unpinned literals widen to `string` and collapse the nested `projects`
    // selection out of the result type.
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      name: true,
      slug: true,
      projects: {
        orderBy: { name: "asc" as const },
        select: { id: true, name: true, slug: true },
      },
    },
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_REFERENCE_ATTEMPTS = 5;

/**
 * Transaction-safe reference-number generation. Mirrors ticket.service's retry loop but
 * runs on the transaction client, so the uniqueness probe also sees rows written earlier
 * in the same transaction.
 */
// Derived from the live client rather than `Prisma.TransactionClient`: `prisma` is
// `$extends(withAccelerate())`, so its transaction client is an extended type the stock
// alias does not match.
type IntakeTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function generateUniqueReferenceNumber(tx: IntakeTransactionClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    const referenceNumber = generateTicketReferenceNumber();
    const existing = await tx.ticket.findUnique({ where: { referenceNumber }, select: { id: true } });
    if (!existing) return referenceNumber;
  }

  throw new Error("Failed to generate a unique ticket reference number");
}
