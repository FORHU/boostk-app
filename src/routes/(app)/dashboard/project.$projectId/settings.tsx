import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/settings")({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { projectId } = Route.useParams();
  return (
    <div>
      <h1>Settings - {projectId}</h1>
      <div>
        <div>Welcome to Project Settings Page</div>
      </div>
    </div>
  );
}
