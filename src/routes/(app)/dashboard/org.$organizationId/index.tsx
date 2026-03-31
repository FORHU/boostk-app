import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/")({
  component: OrganizationPage,
});

function OrganizationPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Projects - {organizationId}</h1>
      <div>
        <div>Search filter</div>
        <div>Invite members</div>
      </div>
      <div>Table of projects in this organization</div>
    </div>
  );
}
