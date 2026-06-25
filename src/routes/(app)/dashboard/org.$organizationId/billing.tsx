import { createFileRoute, redirect } from "@tanstack/react-router";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/billing")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationBillingPage,
});

function OrganizationBillingPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Billing - {organizationId}</h1>
      <div>
        <div>Welcome to Organization Billing Page</div>
      </div>
    </div>
  );
}
