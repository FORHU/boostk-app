import { prisma } from "@/lib/prisma";

// Disposable pagination-test seed for the Customers inbox.
// Run:  bun run prisma/seed-customers.ts [project-slug]
// Clean only its rows:  bun run prisma/seed-customers.ts --clean
// Delete this file when done testing.

const CUSTOMER_COUNT = 40;

const FIRST_NAMES = [
  "Alex", "Mina", "Sofia", "Jin", "Hana", "Leo", "Nina", "Omar", "Ava", "Yuki",
  "Noah", "Ivy", "Kai", "Zoe", "Eli", "Rosa", "Liam", "Maya", "Aria", "Diego",
  "Luna", "Hugo", "Eva", "Chen", "Nora", "Sam", "Ida", "Marco", "Lena", "Tom",
  "June", "Ray", "Amy", "Kofi", "Aya", "Ben", "Lily", "Max", "Ravi", "Tara",
];
const LAST_NAMES = [
  "Rivera", "Park", "Kim", "Nguyen", "Tanaka", "Silva", "Garcia", "Okafor",
  "Chen", "Novak", "Rossi", "Haddad", "Muller", "Andersen", "Patel", "Ng",
  "Kowalski", "Johansson", "Dubois", "Costa",
];
const SOURCES = ["homepage", "ios", "whatsapp"] as const;
const LANGUAGES = ["Korean", "Spanish", "Japanese"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const TOPICS = [
  "my order hasn't shipped yet",
  "I can't reset my password",
  "my subscription was charged twice",
  "the app keeps crashing on launch",
  "I never received the confirmation email",
];

const SEED_EMAIL_PREFIX = "pagination-seed-";
const randomSuffix = () => Math.random().toString(36).slice(2, 8);

async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes("--clean");
  const slug = args.find((a) => !a.startsWith("--")) ?? "boostk";

  if (clean) {
    const removed = await prisma.customer.deleteMany({
      where: { email: { startsWith: SEED_EMAIL_PREFIX } },
    });
    console.log(`🧹 Removed ${removed.count} seed customers (their tickets/messages cascade).`);
    return;
  }

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    throw new Error(`Project with slug "${slug}" not found. Seeded slugs: boostk, chumme, cheapest-go, project-1..3.`);
  }
  console.log(`🎯 Seeding customers into project "${project.name}" (${project.id})`);

  const existing = await prisma.customer.count({
    where: { projectId: project.id, email: { startsWith: SEED_EMAIL_PREFIX } },
  });
  if (existing > 0) {
    console.log(`⚠️  Found ${existing} prior seed customers — deleting and reseeding.`);
    await prisma.customer.deleteMany({
      where: { projectId: project.id, email: { startsWith: SEED_EMAIL_PREFIX } },
    });
  }

  let ticketCount = 0;
  let messageCount = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < CUSTOMER_COUNT; i++) {
      const name = `${FIRST_NAMES[i]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
      const createdDaysAgo = i * 2;

      const customer = await tx.customer.create({
        data: {
          name,
          email: `${SEED_EMAIL_PREFIX}${i}@example.com`,
          metadata: i % 2 === 0 ? SOURCES[i % SOURCES.length] : null,
          language: i % 8 === 0 ? LANGUAGES[(i / 8) % LANGUAGES.length] : null,
          projectId: project.id,
          createdAt: new Date(Date.now() - createdDaysAgo * 86400_000),
        },
      });

      // Every other customer gets a ticket so the sidebar has mixed rows.
      if (i % 2 !== 0) continue;

      const ticket = await tx.ticket.create({
        data: {
          referenceNumber: `PAGSEED-${String(i).padStart(3, "0")}-${randomSuffix()}`,
          status: i % 3 === 0 ? "CLOSED" : "OPEN",
          priority: PRIORITIES[i % PRIORITIES.length],
          projectId: project.id,
          customerId: customer.id,
          createdAt: new Date(Date.now() - createdDaysAgo * 86400_000),
          updatedAt: new Date(Date.now() - createdDaysAgo * 86400_000 + 3600_000),
        },
      });
      ticketCount++;

      const messageCountForTicket = 2 + (i % 4);
      for (let j = 0; j < messageCountForTicket; j++) {
        await tx.ticketMessage.create({
          data: {
            content: j === 0 ? `Hi, ${TOPICS[i % TOPICS.length]}.` : `And also ${TOPICS[(i + j + 1) % TOPICS.length]}.`,
            contentType: "TEXT",
            ticketId: ticket.id,
            customerId: customer.id,
            createdAt: new Date(Date.now() - createdDaysAgo * 86400_000 + (j + 1) * 3_600_000),
          },
        });
        messageCount++;
      }

      // One FILE message with an Attachment row: checks the bubble's filename/size
      // metadata fix in the customers inbox (the link itself won't resolve).
      if (i === 4) {
        const bytes = new Uint8Array([37, 80, 68, 70, 1, 2, 3, 4]);
        const attachment = await tx.attachment.create({
          data: {
            filename: "receipt.pdf",
            mimeType: "application/pdf",
            size: bytes.length,
            bytes,
            ticketId: ticket.id,
          },
        });
        await tx.ticketMessage.create({
          data: {
            content: `/api/attachments/${attachment.id}`,
            contentType: "FILE",
            ticketId: ticket.id,
            customerId: customer.id,
            attachmentId: attachment.id,
            createdAt: new Date(Date.now() - createdDaysAgo * 86400_000 + messageCountForTicket * 3_600_000),
          },
        });
        messageCount++;
      }
    }
  });

  console.log(`✅ Seeded ${CUSTOMER_COUNT} customers, ${ticketCount} tickets, ${messageCount} messages.`);
  console.log(`Open: /dashboard/project/${project.slug}/customers`);
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
