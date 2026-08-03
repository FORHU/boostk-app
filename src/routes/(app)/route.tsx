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
  const { status, notifications, unreadCount, markAllRead } = useNotifications({
    userId: authSession.user.id,
  });

  console.log("[AppLayout] Status:", status);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar
        connectionStatus={status}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
      />
      <Outlet />
    </div>
  );
}
