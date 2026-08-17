import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, HatGlasses, Home, type LucideIcon, MessageCircle, Settings, Ticket, Users } from "lucide-react";
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

interface ProjectSidebarProps extends React.ComponentProps<typeof Sidebar> {
  projectId: string;
  project: { name: string; logo?: string | null; organizationId: string };
}

interface NavRoute {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
}

const routes: NavRoute[] = [
  { label: "Project Overview", icon: Home, href: "/dashboard/project/$projectId", exact: true },
  { label: "Chat Support", icon: MessageCircle, href: "/dashboard/project/$projectId/chat-support" },
  { label: "Tickets", icon: Ticket, href: "/dashboard/project/$projectId/tickets" },
  { label: "Customers", icon: Users, href: "/dashboard/project/$projectId/customers" },
  { label: "Agents", icon: HatGlasses, href: "/dashboard/project/$projectId/agents" },
  { label: "Project Settings", icon: Settings, href: "/dashboard/project/$projectId/settings" },
];

export default function ProjectSidebar({ projectId, project, ...props }: ProjectSidebarProps) {
  const { pathname } = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          to="/dashboard/org/$organizationId"
          params={{ organizationId: project.organizationId }}
          className="flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to projects
        </Link>
        <div className="flex items-center gap-2 px-2 py-1">
          <EntityAvatar name={project.name} logo={project.logo} className="size-7" />
          <span className="truncate font-semibold">{project.name}</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              {routes.map((route) => {
                const href = route.href.replace("$projectId", projectId);
                const isActive = route.exact
                  ? pathname === href || pathname === `${href}/`
                  : pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link to={route.href} params={{ projectId }} preload="intent" />}
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
