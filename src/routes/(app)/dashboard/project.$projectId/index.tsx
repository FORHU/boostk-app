import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useRouteContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project Page: {project.name}</h1>
      <div className="mb-6">
        <a href={`http://localhost:3000/support/${project.id}/chat-widget`} target="_blank" rel="noopener noreferrer">
          Chat Widget
        </a>
      </div>
    </div>
  );
}
