import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AppTopbar from "@/components/layout/app-topbar";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return { authSession: context.authSession };
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar />
      <Outlet />
    </div>
  );
}
