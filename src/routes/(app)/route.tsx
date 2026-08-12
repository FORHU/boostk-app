import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AppTopbar from "@/components/layout/app-topbar";
import { useSocket } from "@/hooks/use-socket";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return { authSession: context.authSession };
  },
  component: AppLayout,
});

function AppLayout() {
  const { authSession } = Route.useRouteContext();
  const { status, notifications, unreadCount, markAsRead } = useSocket({
    userId: authSession.user.id,
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar
        connectionStatus={status}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
      />
      <Outlet />
    </div>
  );
}
