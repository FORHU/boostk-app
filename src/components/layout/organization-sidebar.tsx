import { Link } from "@tanstack/react-router";
import { Blocks, Boxes, ChartBarBig, CreditCard, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface OrganizationSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export default function OrganizationSidebar({ organizationId, ...props }: OrganizationSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  to={route.href}
                  preload="intent"
                  params={{ organizationId }}
                  activeOptions={{ exact: true }}
                  className="flex items-center gap-2"
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium ",
                  }}
                >
                  <SidebarMenuItem className="w-full">
                    <SidebarMenuButton className="text-muted-foreground ">
                      <route.icon className="size-4" />
                      <span>{route.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Link>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
