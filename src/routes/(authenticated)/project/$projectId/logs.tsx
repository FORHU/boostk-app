import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)/project/$projectId/logs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Logs Page!</div>;
}
