import { Link, useLocation } from "@tanstack/react-router";
import { Blocks, Boxes, ChartBarBig, type LucideIcon, Settings, Users } from "lucide-react";
import { useViewport } from "@/hooks/use-viewport";
import { hasOrgRole, ORG_ROLE, type OrgRole } from "@/modules/auth/roles";

interface OrganizationBottomNavProps {
  organizationSlug: string;
  role: OrgRole | null;
}

interface NavRoute {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  adminOnly?: boolean;
}

const routes: NavRoute[] = [
  { label: "Projects", icon: Boxes, href: "/dashboard/org/$organizationSlug", exact: true, adminOnly: false },
  { label: "Teams", icon: Users, href: "/dashboard/org/$organizationSlug/teams", adminOnly: true },
  { label: "Integrations", icon: Blocks, href: "/dashboard/org/$organizationSlug/integrations", adminOnly: true },
  { label: "Usage", icon: ChartBarBig, href: "/dashboard/org/$organizationSlug/usage", adminOnly: true },
  { label: "Settings", icon: Settings, href: "/dashboard/org/$organizationSlug/settings", adminOnly: true },
];

export default function OrganizationBottomNav({ organizationSlug, role }: OrganizationBottomNavProps) {
  const { isMobile, isMounted } = useViewport();
  const { pathname } = useLocation();
  const isAdmin = hasOrgRole(role, ORG_ROLE.ADMIN);
  const visibleRoutes = routes.filter((route) => !route.adminOnly || isAdmin);

  if (!isMounted || !isMobile) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {visibleRoutes.map((route) => {
        const href = route.href.replace("$organizationSlug", organizationSlug);
        const isActive = route.exact
          ? pathname === href || pathname === `${href}/`
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={route.href}
            to={route.href}
            preload="intent"
            params={{ organizationSlug }}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <route.icon className="size-5" />
            <span className="leading-none truncate max-w-full">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
