import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  component: OrganizationsPage,
});

function OrganizationsPage() {
  return (
    <div>
      <h1>Your Organization</h1>
      <div>
        <div>search filter</div>
        <div>create organization</div>
      </div>
      <div>list of organization</div>
    </div>
  );
}
