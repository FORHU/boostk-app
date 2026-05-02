import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/(admin)/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <p>YOU ARE ADMIN</p>
    </div>
  );
}
