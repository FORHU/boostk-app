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
        <div>Search filter</div>
        <div>Invite members</div>
      </div>
      <div>Table of users in this organization</div>
    </div>
  );
}
