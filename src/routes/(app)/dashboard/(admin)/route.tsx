import { createFileRoute, Outlet } from "@tanstack/react-router";
import AdminSidebar from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/(app)/dashboard/(admin)")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex-1 min-h-0 relative">
      {/* sets the custom properties for the sidebar */}
      <SidebarProvider
        style={
          {
            "--sidebar-width": "13rem",
            "--sidebar-width-icon": "3rem",
            "--sidebar-offset": "2.75rem",
          } as React.CSSProperties
        }
      >
        <AdminSidebar />
        <SidebarInset>
          <div className="flex-1 min-h-[calc(100vh-44px)] overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
