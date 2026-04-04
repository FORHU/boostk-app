import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/settings")({
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <h1>Settings - {organizationId}</h1>
      <div>
        <div>Welcome to Organization Settings Page</div>
      </div>
    </div>
  );
}
