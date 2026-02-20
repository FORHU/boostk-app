import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return {
      authSession: context.authSession,
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      {/* TODO: Create nav here */}
      <nav>
        <Link to="/organization">Organization</Link>
      </nav>
      <Outlet />
    </>
  );
}
