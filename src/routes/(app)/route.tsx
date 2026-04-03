import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/app-sidebar";
import AppTopbar from "@/components/layout/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
      <div className="flex-1 min-h-0 relative">
        {/* sets the height of the sidebar to be the height of the viewport minus the height of the topbar */}
        <SidebarProvider style={{ "--sidebar-offset": "2.75rem" } as React.CSSProperties}>
          <AppSidebar />
          <SidebarInset>
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
