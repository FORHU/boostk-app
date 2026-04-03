import {
  BuildingIcon,
  FrameIcon,
  GraduationCapIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  TagIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/layout/nav-main";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";

const data = {
  teams: [
    {
      name: "BoostK Team",
      logo: <ZapIcon />,
      plan: "Enterprise",
    },
    {
      name: "Chumme Team",
      logo: <UsersIcon />,
      plan: "Startup",
    },
    {
      name: "Cheapest Go Team",
      logo: <TagIcon />,
      plan: "Startup",
    },
    {
      name: "OJT Team",
      logo: <GraduationCapIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Management",
      url: "#",
      icon: <BuildingIcon />,
      isActive: true,
      items: [
        {
          title: "Organizations",
          url: "/dashboard/organizations",
        },
        {
          title: "Projects",
          url: "/dashboard/projects",
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
