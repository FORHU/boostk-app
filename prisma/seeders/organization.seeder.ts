import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { OrganizationStatus } from "prisma/generated/enums";
import { seedUsersList } from "./user.seeder";

export default async function organizationSeeder() {
  console.log("🏢 Seeding organizations and linking users...");

  const allPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "asc" }
  });

  if (allPlans.length === 0) {
    console.error("❌ No subscription plans found. Seed plans before organizations.");
    return;
  }

  const templates = await prisma.organizationRoleTemplate.findMany();

  for (let i = 0; i < seedUsersList.length; i++) {
    const userData = seedUsersList[i];
    const plan = allPlans[i % allPlans.length];
    
    try {
      // Find the user in the database
      const user = await prisma.user.findUnique({ where: { email: userData.email } });
      if (!user) {
        console.error(`❌ User ${userData.email} not found. Skipping organization creation.`);
        continue;
      }

      const orgName = `${userData.name}'s Organization`;
      const orgSlug = `${userData.email.split("@")[0]}-org`;

      const createdOrg = await prisma.organization.upsert({
        where: { slug: orgSlug },
        update: { 
          name: orgName,
          planId: plan.id,
          status: OrganizationStatus.ACTIVE
        },
        create: {
          name: orgName,
          slug: orgSlug,
          planId: plan.id,
          status: OrganizationStatus.ACTIVE
        },
      });
      console.log(`✅ Upsert organization: ${orgName} (${plan.name} Plan)`);

      // Seed organization roles from templates
      for (const t of templates) {
        let orgRole = await prisma.organizationRole.findFirst({
          where: {
            organizationId: createdOrg.id,
            role: t.roleName
          }
        });

        if (!orgRole) {
          orgRole = await prisma.organizationRole.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: createdOrg.id,
              role: t.roleName,
              permission: t.permission,
              isDefaultRole: true
            }
          });
        }
      }

      // Link the current user as the Organization Admin (admin role)
      let adminRole = await prisma.organizationRole.findFirst({
        where: { organizationId: createdOrg.id, role: "admin" }
      });

      if (!adminRole) {
        console.warn(`⚠️  Admin role template not found for ${orgName}. Linking as first available role.`);
        adminRole = await prisma.organizationRole.findFirst({ where: { organizationId: createdOrg.id } });
      }

      if (adminRole) {
        const existingMember = await prisma.member.findFirst({
          where: { userId: user.id, organizationId: createdOrg.id }
        });

        if (!existingMember) {
           await prisma.member.create({
             data: {
               userId: user.id,
               organizationId: createdOrg.id,
               roleId: adminRole.id,
             }
           });
           console.log(`🔗 Linked ${user.name} to ${orgName} as ${adminRole.role}`);
        } else {
           await prisma.member.update({
             where: { id: existingMember.id },
             data: { roleId: adminRole.id }
           });
        }
      }
      
    } catch (error: any) {
      console.error(`❌ Error seeding organization for ${userData.email}:`, error.message);
    }
  }
}