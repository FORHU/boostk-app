import { createFileRoute, Outlet, redirect, useMatch } from "@tanstack/react-router";
import AppTopbar from "@/components/layout/app-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
      <SidebarProvider
        className="flex-col h-full"
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3rem",
            "--sidebar-offset": "0px",
          } as React.CSSProperties
        }
      >
        <div className="flex flex-col h-full">
          <AppTopbar
            connectionStatus={status}
            notifications={visibleNotifications}
            unreadCount={visibleUnreadCount}
            markAsRead={markAsRead}
          />
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  );
}
