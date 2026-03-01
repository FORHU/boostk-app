import { Link } from "@tanstack/react-router";
import { FileText, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";

interface ProjectSidebarProps {
  organizationId: string;
}

export function ProjectSidebar({ organizationId }: ProjectSidebarProps) {
  return (
    <aside className="w-64 border-r bg-gray-50/50 p-4 shrink-0 flex flex-col gap-1">
      <Link
        to="/organization/$organizationId"
        params={{ organizationId }}
        activeProps={{ className: "bg-gray-200/50 text-gray-900 font-medium" }}
        inactiveProps={{ className: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" }}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
      >
        <LayoutDashboard size={18} strokeWidth={2} />
        Overview
      </Link>
      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
        <MessageSquare size={18} strokeWidth={2} />
        Chat Support
      </div>
      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
        <Users size={18} strokeWidth={2} />
        Agents
      </div>
      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
        <FileText size={18} strokeWidth={2} />
        Logs
      </div>
      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
        <Settings size={18} strokeWidth={2} />
        Project settings
      </div>
    </aside>
  );
}
