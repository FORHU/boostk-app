import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Building2, Copy, Link as LinkIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getProject } from "@/modules/project/project.serverFn";

export const Route = createFileRoute("/(authenticated)/project/$projectId")({
  component: RouteComponent,
  beforeLoad: async ({ params, context }) => {
    const project = await getProject({ data: { projectId: params.projectId, includeOrganization: true } });

    if (!project) {
      throw redirect({
        to: "/organization/$organizationId",
        params: { organizationId: context.authSession.user.organization.id },
      });
    }

    return { project };
  },
});

function RouteComponent() {
  const { project } = Route.useRouteContext();

  const [copied, setCopied] = useState(false);
  const path = `/widget/${project.apiKey.toLowerCase()}`;
  const fullUrl = useMemo(() => {
    if (typeof window === "undefined") return path; // SSR safety
    return `${window.location.origin}${path}`;
  }, [path]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // TODO: Add toast notification
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar>
        <div className="flex items-center gap-2">
          <Link to="/organization" className="hover:text-gray-900 transition-colors">
            <div className="flex items-center gap-2">
              <Building2 size={20} strokeWidth={1.5} className="text-gray-600" />
              {project.organization.name}
            </div>
          </Link>
        </div>
      </TopBar>

      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 mb-4">{project.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <LinkIcon size={14} />
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs hover:underline text-blue-600"
            >
              {fullUrl}
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors ml-1"
              title="Copy link"
            >
              <Copy size={14} />
            </button>

            {copied && <span className="text-xs text-green-600 ml-1">Copied!</span>}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="border-b border-gray-200 mb-6">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                to="/project/$projectId"
                params={{ projectId: project.id }}
                activeProps={{ className: "text-gray-900 border-gray-900 border-b-2 font-medium" }}
                inactiveProps={{ className: "border-transparent text-gray-500 hover:text-gray-700" }}
                className="inline-flex items-center justify-center pb-3 text-sm transition-colors"
                activeOptions={{ exact: true }}
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                to="/project/$projectId/chat-support"
                params={{ projectId: project.id }}
                activeProps={{ className: "text-gray-900 border-gray-900 border-b-2 font-medium" }}
                inactiveProps={{ className: "border-transparent text-gray-500 hover:text-gray-700" }}
                className="inline-flex items-center justify-center pb-3 text-sm transition-colors"
              >
                Chat Support
              </Link>
            </li>
            <li>
              <Link
                to="/project/$projectId/agents"
                params={{ projectId: project.id }}
                activeProps={{ className: "text-gray-900 border-gray-900 border-b-2 font-medium" }}
                inactiveProps={{ className: "border-transparent text-gray-500 hover:text-gray-700" }}
                className="inline-flex items-center justify-center pb-3 text-sm transition-colors"
              >
                Agents
              </Link>
            </li>
            <li>
              <Link
                to="/project/$projectId/logs"
                params={{ projectId: project.id }}
                activeProps={{ className: "text-gray-900 border-gray-900 border-b-2 font-medium" }}
                inactiveProps={{ className: "border-transparent text-gray-500 hover:text-gray-700" }}
                className="inline-flex items-center justify-center pb-3 text-sm transition-colors"
              >
                Logs
              </Link>
            </li>
            <li>
              <Link
                to="/project/$projectId/settings"
                params={{ projectId: project.id }}
                activeProps={{ className: "text-gray-900 border-gray-900 border-b-2 font-medium" }}
                inactiveProps={{ className: "border-transparent text-gray-500 hover:text-gray-700" }}
                className="inline-flex items-center justify-center pb-3 text-sm transition-colors"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
