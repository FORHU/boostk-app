import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/billing")({
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
