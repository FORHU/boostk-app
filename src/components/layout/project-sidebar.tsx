import { Link } from "@tanstack/react-router";
import { HatGlasses, Home, MessageCircle, Settings, Ticket, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface ProjectSidebarProps extends React.ComponentProps<typeof Sidebar> {
  projectId: string;
}

const routes = [
  {
    label: "Project Overview",
    icon: Home,
    href: "/dashboard/project/$projectId",
  },
  {
    label: "Chat Support",
    icon: MessageCircle,
    href: "/dashboard/project/$projectId/chat-support",
  },
  {
    label: "Tickets",
    icon: Ticket,
    href: "/dashboard/project/$projectId/tickets",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/dashboard/project/$projectId/customers",
  },
  {
    label: "Agents",
    icon: HatGlasses,
    href: "/dashboard/project/$projectId/agents",
  },
  {
    label: "Project Settings",
    icon: Settings,
    href: "/dashboard/project/$projectId/settings",
  },
];

export default function ProjectSidebar({ projectId, ...props }: ProjectSidebarProps) {
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
                  params={{ projectId }}
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
