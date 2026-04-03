import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: ({ context }) => {
    if (context.authSession) throw redirect({ to: "/" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
