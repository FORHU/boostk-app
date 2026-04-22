import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/(admin)/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/dashboard/(admin)/users"!</div>;
}
