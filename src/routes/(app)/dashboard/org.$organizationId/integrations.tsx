import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/integrations")({
  component: OrganizationIntegrationsPage,
});

function OrganizationIntegrationsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Integrations - {organizationId}</h1>
      <div>
        <div>Welcome to Organization Integrations Page</div>
      </div>
    </div>
  );
}
