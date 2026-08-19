import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import OrganizationBottomNav from "@/components/layout/organization-bottom-nav";
import OrganizationSidebar from "@/components/layout/organization-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { REDIRECT_REASON } from "@/enums/enums";
import { useViewport } from "@/hooks/use-viewport";
import { getMemberRole } from "@/modules/auth/roles";
import { getOrganizationFn } from "@/modules/organization/organization.functions";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationSlug")({
  beforeLoad: async ({ context, params }) => {
    const organization = await getOrganizationFn({ data: { organizationSlug: params.organizationSlug } });
    if (!organization) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    // Resolve the caller's role once here so child routes can gate in beforeLoad.
    const role = getMemberRole(organization.members, context.authSession.user.id);

    return { organization, role };
  },
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { organizationSlug } = Route.useParams();
  const { organization, role } = Route.useRouteContext();
  const { isMobile } = useViewport();

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
        <OrganizationSidebar organizationSlug={organizationSlug} organization={organization} memberRole={role} />
        <SidebarInset>
          <div className={`flex-1 overflow-auto ${isMobile ? "pb-24" : ""}`}>
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <OrganizationBottomNav organizationSlug={organizationSlug} role={role} />
    </div>
  );
}
