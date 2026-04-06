import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UserSeederData {
  organizations: { name: string; slug: string } | { name: string; slug: string }[];
  users: { email: string; name: string; role: string }[];
}

export default async function userSeeder(data: UserSeederData) {
  const { organizations, users } = data;
  const password = "Password123!";

  console.log("👤 Seeding users and linking to organizations...");

  const orgSlugs = Array.isArray(organizations)
    ? organizations.map((o) => o.slug)
    : [organizations.slug];

  const dbOrgs = await prisma.organization.findMany({
    where: { slug: { in: orgSlugs } },
  });

  if (dbOrgs.length === 0) {
    console.error("❌ No organizations found. Seed organizations before users.");
    return;
  }

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const organization = dbOrgs[i % dbOrgs.length];

    try {
      const user = await ensureUser(userData, password);

      if (user) {
        await linkUserToOrg(user.id, organization.id, userData.role, organization.name);
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${userData.email}:`, error.message);
    }
  }
}

/**
 * ACTION: Checks if user exists, creates them via Auth if not, and verifies email.
 */
async function ensureUser(userData: { email: string; name: string }, password: string) {
  let user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: password,
        name: userData.name,
      },
    });

    user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      console.log(`✅ Created user: ${userData.email}`);
    }
  } else {
    console.log(`ℹ️  User exists: ${userData.email}`);
  }

  return user;
}

/**
 * ACTION: Creates a membership record if it doesn't already exist.
 */
async function linkUserToOrg(userId: string, orgId: string, role: string, orgName: string) {
  const existingMember = await prisma.member.findFirst({
    where: {
      userId: userId,
      organizationId: orgId,
    },
  });

  if (!existingMember) {
    await prisma.member.create({
      data: {
        userId: userId,
        organizationId: orgId,
        role: role || "member",
      },
    });
    console.log(`🔗 Linked to ${orgName} as ${role}`);
  } else {
    await prisma.member.update({
      where: { id: existingMember.id },
      data: { role: role || "member" },
    });
    console.log(`🔄 Updated role in ${orgName}`);
  }
}
