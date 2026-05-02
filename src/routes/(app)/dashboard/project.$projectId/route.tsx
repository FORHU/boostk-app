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
    <div className="flex-1 flex relative ">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "15rem",
            "--sidebar-width-icon": "3rem",
            "--sidebar-offset": "3rem",
          } as React.CSSProperties
        }
      >
        <ProjectSidebar projectId={project.id} />
        {/* <SidebarInset className="h-full flex-1">
          <Outlet />
        </SidebarInset> */}
      </SidebarProvider>
    </div>
  );
}
