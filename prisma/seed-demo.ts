import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTAKE_PROJECT_SLUG } from "@/modules/intake/intake.constants";
import { generateTicketReferenceNumber } from "@/modules/ticket/ticket.utils";
import { TicketMessageContentType, TicketPriority, TicketStatus } from "prisma/generated/enums";

/**
 * Demo-data seeder — run manually, NEVER part of `bun prisma db seed`:
 *
 *   bun run db:seed:demo
 *
 * Production deploys only run migrations + the intake seeder, so fake conversations
 * never leak into a real environment. Everything here is guarded (users by email,
 * customers by email+project), so re-running tops up rather than duplicates.
 *
 * Seeds:
 *   - 5 team members split across Organization 1 and Forhu (password123!)
 *   - 4 open global-intake conversations for /dashboard/triage
 *   - 6 project tickets across project-1..3 (open/closed, priorities, assignments,
 *     agent replies, one CSAT-rated)
 */

const PASSWORD = "password123!";
const STAFF_EMAIL = "godmode@boostk.com";

interface TeamMemberSeed {
  email: string;
  name: string;
  orgSlug: string;
  role: string;
}

const TEAM_MEMBERS: TeamMemberSeed[] = [
  { email: "org1-team-admin@boostk.com", name: "Org1 Team Admin", orgSlug: "organization-1", role: "admin" },
  { email: "org1-team-agent1@boostk.com", name: "Org1 Team Agent One", orgSlug: "organization-1", role: "agent" },
  { email: "org1-team-agent2@boostk.com", name: "Org1 Team Agent Two", orgSlug: "organization-1", role: "agent" },
  { email: "forhu-team-agent1@boostk.com", name: "Forhu Team Agent One", orgSlug: "forhu", role: "agent" },
  { email: "forhu-team-member1@boostk.com", name: "Forhu Team Member One", orgSlug: "forhu", role: "member" },
];

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

async function ensureUser(email: string, name: string): Promise<{ id: string } | null> {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log(`ℹ️  User exists: ${email}`);
    return existing;
  }

  await auth.api.signUpEmail({ body: { email, password: PASSWORD, name } });
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
    select: { id: true },
  });
  console.log(`✅ Created user: ${email}`);
  return user;
}

async function linkMember(userId: string, orgSlug: string, role: string) {
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true, name: true } });
  if (!org) {
    console.error(`❌ Organization "${orgSlug}" not found — run \`bun prisma db seed\` first.`);
    return;
  }

  const existing = await prisma.member.findFirst({ where: { userId, organizationId: org.id } });
  if (existing) {
    await prisma.member.update({ where: { id: existing.id }, data: { role } });
    console.log(`🔄 ${org.name}: role set to ${role}`);
    return;
  }

  await prisma.member.create({ data: { userId, organizationId: org.id, role } });
  console.log(`🔗 Joined ${org.name} as ${role}`);
}

/** Customer rows are project-scoped and have no unique constraint — guard by email+project. */
async function ensureCustomer(input: {
  email: string;
  name: string;
  phone?: string;
  metadata?: string;
  projectId: string;
}): Promise<string | null> {
  const existing = await prisma.customer.findFirst({
    where: { email: input.email, projectId: input.projectId },
    select: { id: true },
  });
  if (existing) return null;

  const customer = await prisma.customer.create({ data: { ...input } });
  return customer.id;
}

interface MessageSeed {
  /** "customer" messages carry customerId; "agent" messages carry userId. */
  from: "customer" | "agent";
  content: string;
  /** Minutes before now — staggered so threads read naturally oldest-first. */
  atMinutesAgo: number;
}

// Resolved lazily: the staff reply on an intake thread is authored by the triage account.
let STAFF_REPLY_USER_ID: string | null = null;

async function createThread(input: {
  projectId: string;
  customerId: string;
  status: (typeof TicketStatus)[keyof typeof TicketStatus];
  priority?: (typeof TicketPriority)[keyof typeof TicketPriority];
  assignedAgentUserId?: string | null;
  satisfactionScore?: number;
  openedMinutesAgo: number;
  messages: MessageSeed[];
}) {
  // An agent/staff message without a resolvable author would land as an orphan row
  // (neither customer nor user) — drop it rather than seed something the UI misrenders.
  const messages = input.messages.filter(
    (m) => m.from === "customer" || (input.assignedAgentUserId ?? STAFF_REPLY_USER_ID) != null,
  );

  const ticket = await prisma.ticket.create({
    data: {
      referenceNumber: generateTicketReferenceNumber(),
      status: input.status,
      priority: input.priority ?? TicketPriority.LOW,
      projectId: input.projectId,
      customerId: input.customerId,
      ...(input.assignedAgentUserId
        ? {
            assignedAgentId: (
              (await prisma.member.findFirst({
                where: { userId: input.assignedAgentUserId, organization: { projects: { some: { id: input.projectId } } } },
                select: { id: true },
              }))?.id ?? null
            ),
          }
        : {}),
      ...(input.satisfactionScore != null ? { satisfactionScore: input.satisfactionScore } : {}),
      createdAt: minutesAgo(input.openedMinutesAgo),
      updatedAt: minutesAgo(Math.max(0, input.openedMinutesAgo - messages.length)),
    },
  });

  await prisma.ticketMessage.createMany({
    data: messages.map((m) => ({
      content: m.content,
      contentType: TicketMessageContentType.TEXT,
      ticketId: ticket.id,
      createdAt: minutesAgo(m.atMinutesAgo),
      updatedAt: minutesAgo(m.atMinutesAgo),
      ...(m.from === "customer"
        ? { customerId: input.customerId }
        : { userId: input.assignedAgentUserId ?? STAFF_REPLY_USER_ID }),
    })),
  });

  return ticket;
}

async function main() {
  console.log("🌱 Seeding demo data...");

  // --- triage account id (for the staff reply on an intake thread) ---
  const staff = await prisma.user.findUnique({ where: { email: STAFF_EMAIL }, select: { id: true } });
  STAFF_REPLY_USER_ID = staff?.id ?? null;
  if (!STAFF_REPLY_USER_ID) {
    console.warn(`⚠️  ${STAFF_EMAIL} not found — staff replies will be skipped.`);
  }

  // --- 1. team members -------------------------------------------------------
  console.log("\n👥 Seeding team members...");
  for (const member of TEAM_MEMBERS) {
    const user = await ensureUser(member.email, member.name);
    if (user) await linkMember(user.id, member.orgSlug, member.role);
  }

  // --- 2. sample triage chats (global intake) ---------------------------------
  console.log("\n📥 Seeding sample triage chats...");
  const intakeProject = await prisma.project.findUnique({
    where: { slug: INTAKE_PROJECT_SLUG },
    select: { id: true },
  });
  if (!intakeProject) {
    console.error(`❌ Intake project "${INTAKE_PROJECT_SLUG}" missing — run \`bun prisma db seed\` first.`);
  } else {
    const intakeChats = [
      {
        customer: { name: "Minjun Park", email: "minjun.park@hanbitour.kr", phone: "+82-10-5551-0134", metadata: "Hotel booking API integration" },
        priority: TicketPriority.MEDIUM,
        openedMinutesAgo: 240,
        messages: [
          { from: "customer" as const, content: "안녕하세요! We run a mid-size travel agency in Seoul and want to embed your hotel booking engine into our website.", atMinutesAgo: 240 },
          { from: "customer" as const, content: "Do you support Korean-language widgets and can we bill in KRW?", atMinutesAgo: 232 },
          { from: "agent" as const, content: "Hi Minjun! Yes — the widget auto-detects visitor language, and our APAC desk handles KRW invoicing. I'll connect you with our integrations team.", atMinutesAgo: 180 },
          { from: "customer" as const, content: "Great. What is the typical timeline for a pilot?", atMinutesAgo: 175 },
        ],
      },
      {
        customer: { name: "Yuki Tanaka", email: "yuki.tanaka@sakura-trade.jp", phone: "+81-90-1234-5678", metadata: "Expanding e-commerce to Philippines" },
        priority: TicketPriority.HIGH,
        openedMinutesAgo: 150,
        messages: [
          { from: "customer" as const, content: "こんにちは。We sell handmade ceramics and want to enter the Philippine market before the holiday season.", atMinutesAgo: 150 },
          { from: "customer" as const, content: "We need help with logistics partners and a local payment gateway. Where do we start?", atMinutesAgo: 148 },
        ],
      },
      {
        customer: { name: "Sarah Kim", email: "sarah.kim@daehwa-mfg.com", phone: "+82-2-555-0199", metadata: "Sourcing English-speaking QA staff" },
        priority: TicketPriority.LOW,
        openedMinutesAgo: 600,
        messages: [
          { from: "customer" as const, content: "Hello, our factory exports to US retailers and we fail their English documentation audits.", atMinutesAgo: 600 },
          { from: "customer" as const, content: "Can BOOSTK provide Manila-based QA writers who understand technical specs?", atMinutesAgo: 598 },
          { from: "customer" as const, content: "Also curious about pricing for a team of three.", atMinutesAgo: 540 },
        ],
      },
      {
        customer: { name: "Hiroshi Sato", email: "h.sato@fukuoka-apps.jp", metadata: "Mobile app localization" },
        priority: TicketPriority.LOW,
        openedMinutesAgo: 45,
        messages: [
          { from: "customer" as const, content: "We have a fitness app with 200k JP users. Considering SEA launch — how does your localization service work?", atMinutesAgo: 45 },
        ],
      },
    ];

    for (const chat of intakeChats) {
      const customerId = await ensureCustomer({ ...chat.customer, projectId: intakeProject.id });
      if (!customerId) {
        console.log(`ℹ️  Intake chat exists: ${chat.customer.email}`);
        continue;
      }
      const ticket = await createThread({
        projectId: intakeProject.id,
        customerId,
        status: TicketStatus.OPEN,
        priority: chat.priority,
        openedMinutesAgo: chat.openedMinutesAgo,
        messages: chat.messages,
      });
      console.log(`✅ Intake chat ${ticket.referenceNumber} — ${chat.customer.name} (${chat.messages.length} msgs)`);
    }
  }

  // --- 3. project tickets responding to seeded customers ----------------------
  console.log("\n🎫 Seeding project tickets...");
  const projects = await prisma.project.findMany({
    where: { slug: { in: ["project-1", "project-2", "project-3"] } },
    select: { id: true, slug: true },
  });

  const agent1 = await prisma.user.findUnique({ where: { email: "org1-team-agent1@boostk.com" }, select: { id: true } });
  const agent2 = await prisma.user.findUnique({ where: { email: "org1-team-agent2@boostk.com" }, select: { id: true } });

  const ticketSeeds = [
    {
      projectSlug: "project-1",
      customer: { name: "Daniel Cruz", email: "daniel.cruz@example.com", phone: "+63-917-100-2233", metadata: "ref: facebook-ads" },
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      agentUserId: agent1?.id ?? null,
      openedMinutesAgo: 120,
      messages: [
        { from: "customer" as const, content: "Hi, my order #8123 arrived damaged. The box was crushed.", atMinutesAgo: 120 },
        { from: "agent" as const, content: "Sorry about that, Daniel! Could you attach a photo of the damage so I can file the replacement right away?", atMinutesAgo: 110 },
        { from: "customer" as const, content: "Just sent it through the attachment button. Thanks for the quick reply!", atMinutesAgo: 105 },
      ],
    },
    {
      projectSlug: "project-1",
      customer: { name: "Grace Lim", email: "grace.lim@example.com", metadata: "ref: newsletter" },
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      agentUserId: agent1?.id ?? null,
      satisfactionScore: 5,
      openedMinutesAgo: 60 * 26,
      messages: [
        { from: "customer" as const, content: "How do I reset my password? The email never arrives.", atMinutesAgo: 60 * 26 },
        { from: "agent" as const, content: "I've whitelisted your domain and triggered a fresh reset link — please check spam just in case.", atMinutesAgo: 60 * 25 },
        { from: "customer" as const, content: "Worked perfectly, thank you!", atMinutesAgo: 60 * 24 },
      ],
    },
    {
      projectSlug: "project-2",
      customer: { name: "Marco Reyes", email: "marco.reyes@example.com", phone: "+63-918-222-3344", metadata: "ref: checkout" },
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      agentUserId: agent2?.id ?? null,
      openedMinutesAgo: 30,
      messages: [
        { from: "customer" as const, content: "Checkout charges my card twice when I pay with GCash then switch to card. This is urgent, flash sale ends tonight!", atMinutesAgo: 30 },
      ],
    },
    {
      projectSlug: "project-2",
      customer: { name: "Ana Villanueva", email: "ana.villanueva@example.com", metadata: "ref: instagram" },
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      agentUserId: null,
      openedMinutesAgo: 300,
      messages: [
        { from: "customer" as const, content: "Do you ship to Cebu province, and how long does delivery usually take?", atMinutesAgo: 300 },
      ],
    },
    {
      projectSlug: "project-3",
      customer: { name: "Kenji Watanabe", email: "kenji.watanabe@example.com", phone: "+81-80-4444-7788", metadata: "ref: google-ads" },
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      agentUserId: agent2?.id ?? null,
      openedMinutesAgo: 90,
      messages: [
        { from: "customer" as const, content: "The flight search returns no results for Fukuoka–Cebu in March. Is the route sold out or broken?", atMinutesAgo: 90 },
        { from: "agent" as const, content: "Let me check the inventory feed for that route — one moment.", atMinutesAgo: 80 },
      ],
    },
    {
      projectSlug: "project-3",
      customer: { name: "Liza Santos", email: "liza.santos@example.com", metadata: "ref: referral" },
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      agentUserId: agent1?.id ?? null,
      openedMinutesAgo: 60 * 50,
      messages: [
        { from: "customer" as const, content: "Can I change the name on a booked ticket to my sister's?", atMinutesAgo: 60 * 50 },
        { from: "agent" as const, content: "Name changes are free up to 48h before departure — I've updated it and resent the confirmation.", atMinutesAgo: 60 * 49 },
      ],
    },
  ];

  for (const seed of ticketSeeds) {
    const project = projects.find((p) => p.slug === seed.projectSlug);
    if (!project) {
      console.warn(`⚠️  Project "${seed.projectSlug}" not found — skipping this ticket.`);
      continue;
    }

    const customerId = await ensureCustomer({ ...seed.customer, projectId: project.id });
    if (!customerId) {
      console.log(`ℹ️  Ticket exists: ${seed.customer.email} in ${seed.projectSlug}`);
      continue;
    }

    const ticket = await createThread({
      projectId: project.id,
      customerId,
      status: seed.status,
      priority: seed.priority,
      assignedAgentUserId: seed.agentUserId,
      satisfactionScore: seed.satisfactionScore,
      openedMinutesAgo: seed.openedMinutesAgo,
      messages: seed.messages,
    });
    console.log(`✅ ${seed.projectSlug} ticket ${ticket.referenceNumber} — ${seed.status} / ${seed.priority}`);
  }

  console.log("\n✅ Demo seeding completed.");
}

main()
  .catch((error) => {
    console.error("❌ Demo seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
