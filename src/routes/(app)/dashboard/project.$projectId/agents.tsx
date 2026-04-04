import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/agents")({
  component: OrganizationUsagePage,
});

function OrganizationUsagePage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Usage - {organizationId}</h1>
      <div>
        <div>Welcome to Organization Usage Page</div>
      </div>
    </div>
  );
}
