import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AppTopbar from "@/components/layout/app-topbar";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return { authSession: context.authSession };
  },
  component: AppLayout,
});

function AppLayout() {
  const { authSession } = Route.useRouteContext();
  const { status, lastMessage } = useNotifications(authSession.user.id);

  console.log("[AppLayout] Status:", status);
  console.log("[AppLayout] Last Message:", lastMessage);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar />
      <Outlet />
    </div>
  );
}
