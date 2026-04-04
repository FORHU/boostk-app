import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/teams")({
  component: OrganizationTeamsPage,
});

function OrganizationTeamsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Teams - {organizationId}</h1>
      <div>
        <div>Welcome to Organization Teams Page</div>
      </div>
    </div>
  );
}
