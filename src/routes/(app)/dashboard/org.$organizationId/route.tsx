import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { REDIRECT_REASON } from "@/enums/enums";
import { getOrganizationFn } from "@/modules/organization/organization.functions";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId")({
  beforeLoad: async ({ params }) => {
    const organization = await getOrganizationFn({ data: { organizationId: params.organizationId } });
    if (!organization) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    return { organization };
  },
  component: OrganizationLayout,
});

function OrganizationLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
