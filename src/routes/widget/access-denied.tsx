import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/widget/access-denied")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Access Denied</div>;
}
