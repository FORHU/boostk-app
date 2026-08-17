import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Blocks, Boxes, ChartBarBig, CreditCard, type LucideIcon, Settings, Users } from "lucide-react";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { hasOrgRole, ORG_ROLE, type OrgRole } from "@/modules/auth/roles";

interface OrganizationSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizationId: string;
  organization: { name: string; logo?: string | null };
  memberRole: OrgRole | null;
}

interface NavRoute {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  adminOnly?: boolean;
}

const routes: NavRoute[] = [
  { label: "Projects", icon: Boxes, href: "/dashboard/org/$organizationId", exact: true, adminOnly: false },
  { label: "Teams", icon: Users, href: "/dashboard/org/$organizationId/teams", adminOnly: true },
  { label: "Integrations", icon: Blocks, href: "/dashboard/org/$organizationId/integrations", adminOnly: true },
  { label: "Billing", icon: CreditCard, href: "/dashboard/org/$organizationId/billing", adminOnly: true },
  { label: "Usage", icon: ChartBarBig, href: "/dashboard/org/$organizationId/usage", adminOnly: true },
  { label: "Settings", icon: Settings, href: "/dashboard/org/$organizationId/settings", adminOnly: true },
];

export default function OrganizationSidebar({
  organizationId,
  organization,
  memberRole,
  ...props
}: OrganizationSidebarProps) {
  const { pathname } = useLocation();
  const isAdmin = hasOrgRole(memberRole, ORG_ROLE.ADMIN);
  const visibleRoutes = routes.filter((route) => !route.adminOnly || isAdmin);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          to="/dashboard/organizations"
          className="flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All organizations
        </Link>
        <div className="flex items-center gap-2 px-2 py-1">
          <EntityAvatar name={organization.name} logo={organization.logo} className="size-7" />
          <span className="truncate font-semibold">{organization.name}</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              {visibleRoutes.map((route) => {
                const href = route.href.replace("$organizationId", organizationId);
                const isActive = route.exact
                  ? pathname === href || pathname === `${href}/`
                  : pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link to={route.href} params={{ organizationId }} preload="intent" />}
                    >
                      <route.icon />
                      <span>{route.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
