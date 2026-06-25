import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; 

// 1. Fetching Function (Updated to use prisma directly just in case context doesn't have everything)
export const getSettingsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ data }) => {
    return prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
  });

// 2. NEW: Update Function to save changes
export const updateOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    organizationId: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    logo: z.string().optional().nullable(),
  }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ data }) => {
    return prisma.organization.update({
      where: { id: data.organizationId },
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
      queryKey: [...settingQueries.setting, "setting", organizationId],
      queryFn: () => getSettingsFn({ data: { organizationId } }),
    }),
}

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/settings")({
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
          <div className="grid grid-cols-2">
            <Avatar className="size-50 ">
              <AvatarImage src={organization?.logo || undefined} alt={`${organization?.name} logo`} />
              <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
            </Avatar>

            <div className="ml-auto mr-20">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm border rounded- hover:bg-muted-foreground">
                Edit Settings
              </button>
            </div>
            <p className="mt-5">Id: {organizationId}</p>
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold mt-5">Name:</h2>
            <p className="text-muted-foreground border-b border-border pb-2 mr-10">
              {organization?.name}
            </p>

            <p className="font-bold mt-5">Slug:</p>
            <p className="text-muted-foreground border-b border-border pb-2 mr-10">
              {organization?.slug}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
