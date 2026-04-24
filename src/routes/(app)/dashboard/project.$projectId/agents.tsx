import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/agents")({
  component: OrganizationUsagePage,
});

function OrganizationUsagePage() {
  const { projectId } = Route.useParams();
  return (
    <div>
      <h1>Usage - {projectId}</h1>
      <div>
        <div>Welcome to Project Agents Page</div>
      </div>
    </div>
  );
}
