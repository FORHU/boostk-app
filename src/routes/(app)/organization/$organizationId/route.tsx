import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Activity, Blocks, Building2, Cuboid, Receipt, Settings, Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { getOrganization } from "@/modules/organization/organization.serverFn";

export const Route = createFileRoute("/(app)/organization/$organizationId")({
  beforeLoad: async ({ params }) => {
    const organization = await getOrganization({ data: { orgId: params.organizationId } });
    if (!organization) throw redirect({ to: "/organization" });

    return { organization };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organization } = Route.useRouteContext();
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar>
        <div className="flex items-center gap-2">
          <Link to="/organization" className="hover:text-gray-900 transition-colors">
            <div className="flex items-center gap-2">
              <Building2 size={20} strokeWidth={1.5} className="text-gray-600" />
              {organization.name}
            </div>
          </Link>
        </div>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-gray-50/50 p-4 shrink-0 flex flex-col gap-1">
          <Link
            to="/organization/$organizationId"
            params={{ organizationId: organization.id }}
            activeProps={{ className: "bg-gray-200/50 text-gray-900 font-medium" }}
            inactiveProps={{ className: "text-gray-600 hover:bg-gray-100 hover:text-gray-900" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
          >
            <Cuboid size={18} strokeWidth={2} />
            Projects
          </Link>
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
            <Users size={18} strokeWidth={2} />
            Team
          </div>
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
            <Blocks size={18} strokeWidth={2} />
            Integrations
          </div>
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
            <Activity size={18} strokeWidth={2} />
            Usage
          </div>
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
            <Receipt size={18} strokeWidth={2} />
            Billing
          </div>
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed">
            <Settings size={18} strokeWidth={2} />
            Organization settings
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
