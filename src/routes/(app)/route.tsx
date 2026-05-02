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
    <div className="flex flex-col min-h-screen">
      <AppTopbar />
      <div className="h-[calc(100vh-3rem)]">
        <Outlet />
      </div>
    </div>
  );
}
