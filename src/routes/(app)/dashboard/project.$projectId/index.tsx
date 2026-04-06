import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

function ProjectPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project Page</h1>
      <div className="mb-6">
        <p>Project details for testing RabbitMQ to SSE.</p>
        <a href="http://localhost:3000/support/cmnj4egge0006islp0091r4yh/chat-widget" target="_blank" rel="noopener noreferrer">
          Chat Widget
        </a>
      </div>
    </div>
  );
}
