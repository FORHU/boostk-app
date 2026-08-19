import { prisma } from "@/lib/prisma";

// Disposable pagination-test seed for the Members list.
// Run:  bun run prisma/seed-members.ts [org-slug]
// Clean only its rows:  bun run prisma/seed-members.ts --clean
// Delete this file when done testing.

const MEMBER_COUNT = 40;

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

// Distribute roles: 5 admin, 10 agent, 25 member — mirrors a realistic org mix.
const ROLES = [
  ...Array.from({ length: 5 }, () => "admin"),
  ...Array.from({ length: 10 }, () => "agent"),
  ...Array.from({ length: 25 }, () => "member"),
];

const SEED_EMAIL_PREFIX = "pagination-seed-member-";

async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes("--clean");

  if (clean) {
    // Deleting users cascades to members via onDelete: Cascade.
    const removed = await prisma.user.deleteMany({
      where: { email: { startsWith: SEED_EMAIL_PREFIX } },
    });
    console.log(`🧹 Removed ${removed.count} seed users (their members cascade).`);
    return;
  }

  const slug = args.find((a) => !a.startsWith("--"));
  const org = slug
    ? await prisma.organization.findUnique({ where: { slug } })
    : await prisma.organization.findFirst();

  if (!org) {
    throw new Error(
      `Organization${slug ? ` with slug "${slug}"` : ""} not found. Run the main seed first.`,
    );
  }
  console.log(`🎯 Seeding members into org "${org.name}" (${org.id})`);

  const existing = await prisma.user.count({
    where: { email: { startsWith: SEED_EMAIL_PREFIX } },
  });
  if (existing > 0) {
    console.log(`⚠️  Found ${existing} prior seed users — deleting and reseeding.`);
    await prisma.user.deleteMany({
      where: { email: { startsWith: SEED_EMAIL_PREFIX } },
    });
  }

  let memberCount = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < MEMBER_COUNT; i++) {
      const name = `${FIRST_NAMES[i]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
      const createdDaysAgo = i * 2;

      const user = await tx.user.create({
        data: {
          email: `${SEED_EMAIL_PREFIX}${i}@example.com`,
          name,
          emailVerified: true,
          createdAt: new Date(Date.now() - createdDaysAgo * 86400_000),
        },
      });

      await tx.member.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: ROLES[i],
          createdAt: new Date(Date.now() - createdDaysAgo * 86400_000),
        },
      });
      memberCount++;
    }
  });

  console.log(`✅ Seeded ${memberCount} members (${ROLES.filter((r) => r === "admin").length} admin, ${ROLES.filter((r) => r === "agent").length} agent, ${ROLES.filter((r) => r === "member").length} member).`);
  console.log(`Open: /dashboard/organizations/${org.slug ?? org.id}/teams`);
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
