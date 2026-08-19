import { createFileRoute, Outlet, redirect, useMatch } from "@tanstack/react-router";
import AppTopbar from "@/components/layout/app-topbar";
import { NotificationProvider } from "@/contexts/notification-context";
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
  const { status, notifications, markAsRead } = useSocket({
    userId: authSession.user.id,
  });

  const triageMatch = useMatch({
    from: "/(app)/dashboard/triage",
    shouldThrow: false,
  });

  const isOnTriage = !!triageMatch;

  const visibleNotifications = isOnTriage
    ? notifications.filter((n) => n.data?.isIntake === true)
    : notifications.filter((n) => !n.data?.isIntake);
  const visibleUnreadCount = visibleNotifications.filter((n) => !n.read).length;

  return (
    <NotificationProvider value={{ markAsRead }}>
      <div className="flex flex-col h-screen overflow-hidden">
        <AppTopbar
          connectionStatus={status}
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
        />
        <Outlet />
      </div>
    </NotificationProvider>
  );
}
