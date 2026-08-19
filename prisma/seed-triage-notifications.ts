import { prisma } from "@/lib/prisma";

/**
 * Seed script: creates fake intake conversations with unread customer messages
 * so the triage notification bell has something to show.
 *
 *   bun run prisma/seed-triage-notifications.ts
 *
 * Safe to re-run — skips conversations that already exist (by customer email).
 */
const CONVERSATIONS = [
  {
    customerName: "Maria Santos",
    customerEmail: "maria.santos@example.com",
    subject: "I need help resetting my password for the booking portal",
    followUp: "It keeps saying my email is not registered but I've been using it for months.",
  },
  {
    customerName: "James Chen",
    customerEmail: "james.chen@example.com",
    subject: "Can you add a feature to export reports as PDF?",
    followUp: "We rely on PDF reports for our monthly reviews, this would save us a lot of time.",
  },
  {
    customerName: "Aisha Patel",
    customerEmail: "aisha.patel@example.com",
    subject: "My payment was charged twice for the same subscription",
    followUp: "I noticed two identical charges on my bank statement from yesterday. Order #SUB-8842.",
  },
  {
    customerName: "Oliver Berg",
    customerEmail: "oliver.berg@example.com",
    subject: "Is there an API available for integrating with our internal tools?",
    followUp: "We want to sync ticket data with our Jira instance automatically.",
  },
  {
    customerName: "Sofia Reyes",
    customerEmail: "sofia.reyes@example.com",
    subject: "The mobile app keeps crashing on Android 14",
    followUp: "It crashes specifically when I try to upload a photo in the chat. Happens every time.",
  },
];

function generateRef(): string {
  const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let ref = "TK-";
  for (let i = 0; i < 6; i++) {
    ref += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return ref;
}

async function main() {
  console.log("🧪 Seeding triage notification conversations...");

  const project = await prisma.project.findUnique({
    where: { slug: "boostk-intake" },
    select: { id: true },
  });

  if (!project) {
    console.error("❌ Intake project not found. Run `bun run prisma db seed` first.");
    process.exit(1);
  }

  let created = 0;

  for (const conv of CONVERSATIONS) {
    const existing = await prisma.customer.findFirst({
      where: { email: conv.customerEmail, projectId: project.id },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⏭️  ${conv.customerName} already exists, skipping.`);
      continue;
    }

    const customer = await prisma.customer.create({
      data: {
        name: conv.customerName,
        email: conv.customerEmail,
        projectId: project.id,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        referenceNumber: generateRef(),
        status: "OPEN",
        priority: "LOW",
        projectId: project.id,
        customerId: customer.id,
      },
    });

    const now = new Date();

    await prisma.ticketMessage.create({
      data: {
        content: conv.subject,
        contentType: "TEXT",
        ticketId: ticket.id,
        customerId: customer.id,
        createdAt: new Date(now.getTime() - 5 * 60_000),
      },
    });

    await prisma.ticketMessage.create({
      data: {
        content: conv.followUp,
        contentType: "TEXT",
        ticketId: ticket.id,
        customerId: customer.id,
        createdAt: new Date(now.getTime() - 3 * 60_000),
      },
    });

    created++;
    console.log(`  ✅ Created conversation for ${conv.customerName} (${ticket.referenceNumber})`);
  }

  console.log(`\n🎉 Done — created ${created} conversation(s) with unread messages.`);
  console.log("   The triage notification bell should show them on next page load.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
