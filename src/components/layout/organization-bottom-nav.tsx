import { Link } from "@tanstack/react-router";
import { Blocks, Boxes, ChartBarBig, CreditCard, Settings, Users } from "lucide-react";
import { useViewport } from "@/hooks/use-viewport";

interface OrganizationBottomNavProps {
  organizationId: string;
}

const routes = [
  {
    label: "Projects",
    icon: Boxes,
    href: "/dashboard/org/$organizationId",
  },
  {
    label: "Teams",
    icon: Users,
    href: "/dashboard/org/$organizationId/teams",
  },
  {
    label: "Integrations",
    icon: Blocks,
    href: "/dashboard/org/$organizationId/integrations",
  },
  {
    label: "Billing",
    icon: CreditCard,
    href: "/dashboard/org/$organizationId/billing",
  },
  {
    label: "Usage",
    icon: ChartBarBig,
    href: "/dashboard/org/$organizationId/usage",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/org/$organizationId/settings",
  },
];

export default function OrganizationBottomNav({ organizationId }: OrganizationBottomNavProps) {
  const { isMobile, isMounted } = useViewport();

  if (!isMounted || !isMobile) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {routes.map((route) => (
        <Link
          key={route.href}
          to={route.href}
          preload="intent"
          params={{ organizationId }}
          activeOptions={{ exact: true }}
          className="flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary" }}
        >
          <route.icon className="size-5" />
          <span className="leading-none truncate max-w-full">{route.label}</span>
        </Link>
      ))}
    </nav>
  );
}
