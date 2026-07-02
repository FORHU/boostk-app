import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

// Read the current org's settings. Admin-only (server-side enforcement).
export const getSettingsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    return context.organization;
  });

// Persist org settings changes. Admin-only (server-side enforcement).
export const updateOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    organizationId: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    logo: z.string().optional().nullable(),
  }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context, data }) => {
    return prisma.organization.update({
      where: { id: context.organization.id },
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
      },
    });
  });

export const settingQueries = {
  setting: ["setting"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...settingQueries.setting, organizationId],
      queryFn: () => getSettingsFn({ data: { organizationId } }),
    }),
}

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/settings")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organizationId } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: organization, refetch } = useSuspenseQuery(
    settingQueries.allByOrgId(organizationId)
  );

  // Fallback initials
  const fallbackInitials = organization?.name?.substring(0, 2).toUpperCase() || "OR";

 // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await updateOrganizationFn({
      data: {
        organizationId,
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        logo: formData.get("logo") as string, // Currently treating logo as a text URL input
      }
    });

    setIsEditing(false);
    refetch(); // Refresh the data to show updates
  };

  return (
    <div className="mt-6 ml-6">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mr-10">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input 
                  name="name" 
                  defaultValue={organization?.name} 
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input 
                  name="slug" 
                  defaultValue={organization?.slug} 
                  className="w-full border rounded-md p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Logo URL</label>
                <input 
                  name="logo" 
                  defaultValue={organization?.logo || ""} 
                  placeholder="https://example.com/logo.png"
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm bg-secondary rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md"
                >
                  Save Changes
                </button>
              </div>
        </form>
      ) : (
        <>
          {/* ----- READ-ONLY MODE ----- */}
          <h1 className="mb-6 text-2xl font-bold ">Settings</h1>
          <div className="grid grid-cols-2">
            <Avatar className="size-50 mb-10">
              <AvatarImage src={organization?.logo || undefined} alt={`${organization?.name} logo`} />
              <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
            </Avatar>

            <div className="ml-auto mr-20">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm border rounded- hover:bg-muted transition-colors">
                Edit Settings
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white isolate mr-10">
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-2">
              <div className="px-6 py-4 text-sm font-semibold">Name</div>
              <div className="px-6 py-4 text-sm text-muted-foreground">
                {organization?.name}
              </div>
            </div>
            <div className="grid grid-cols-2">
              <div className="px-6 py-4 text-sm font-semibold">Slug</div>
              <div className="px-6 py-4 text-sm text-muted-foreground">
                {organization?.slug}
              </div>
            </div>

          </div>
        </div>
        </>
      )}
    </div>
  );
}
