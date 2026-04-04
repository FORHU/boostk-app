import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/tickets")({
  component: ProjectTicketsPage,
});

function ProjectTicketsPage() {
  const { projectId } = Route.useParams();
  return (
    <div>
      <h1>Tickets - {projectId}</h1>
      <div>
        <div>Welcome to Project Tickets Page</div>
      </div>
    </div>
  );
}
