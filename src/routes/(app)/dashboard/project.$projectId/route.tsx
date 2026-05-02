import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import ProjectSidebar from "@/components/layout/project-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { REDIRECT_REASON } from "@/enums/enums";
import { getProjectFn } from "@/modules/project/project.functions";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId")({
  beforeLoad: async ({ params }) => {
    const project = await getProjectFn({ data: { projectId: params.projectId } });
    if (!project) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    return { project };
  },
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { project } = Route.useRouteContext();

  return (
    <div className="flex-1 flex min-h-0 relative">
      {/* sets the custom properties for the sidebar */}
      <SidebarProvider
        style={
          {
            "--sidebar-width": "13rem",
            "--sidebar-width-icon": "3rem",
            "--sidebar-offset": "2.75rem",
          } as React.CSSProperties
        }
        className="h-full flex-1"
      >
        <ProjectSidebar projectId={project.id} />
        <SidebarInset className="">
          <div className="flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
