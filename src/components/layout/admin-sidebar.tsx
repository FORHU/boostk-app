import { Link } from "@tanstack/react-router";
import { Blocks, Boxes, CreditCard, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const routes = [
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/admin/users",
  },
  {
    label: "Organizations",
    icon: Users,
    href: "/dashboard/admin/organizations",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/admin/settings",
  },
];

export default function AdminSidebar({ ...props }) {
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
