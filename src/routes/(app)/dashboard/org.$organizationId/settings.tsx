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

  

  return (
    <div className="mt-6 ml-6">
      {/* ----- READ-ONLY MODE ----- */}
      <div className="grid grid-cols-2">
        <Avatar className="size-50 ">
          <AvatarImage src={organization?.logo || undefined} alt={`${organization?.name} logo`} />
          <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
        </Avatar>

        <div className="ml-auto mr-20">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm border rounded- hover:bg-primary">
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
      </div>
  );
}
