import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import OrganizationBottomNav from "@/components/layout/organization-bottom-nav";
import ProjectSidebar from "@/components/layout/project-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { REDIRECT_REASON } from "@/enums/enums";
import { useViewport } from "@/hooks/use-viewport";
import { getProjectFn } from "@/modules/project/project.functions";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId")({
  beforeLoad: async ({ params }) => {
    const { project, role, memberId } = await getProjectFn({ data: { projectId: params.projectId } });
    if (!project) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    return { project, role, memberId };
  },
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { project } = Route.useRouteContext();
  const { isMobile } = useViewport();

  return (
    <div className="flex flex-1 min-h-0 relative">
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
        <ProjectSidebar projectId={project.id} />
        <SidebarInset>
          <div className={`flex-1 overflow-auto ${isMobile ? "pb-24" : ""}`}>
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <OrganizationBottomNav organizationId={project.organizationId} />
    </div>
  );
}
