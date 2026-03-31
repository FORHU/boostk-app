import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

function ProjectPage() {
  return (
    <div>
      <h1>Project Page</h1>
      <div>
        <p>Project details</p>
      </div>
    </div>
  );
}
