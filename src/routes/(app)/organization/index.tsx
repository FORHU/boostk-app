import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getOrganizations } from "@/modules/organization/organization.serverFn";

export const Route = createFileRoute("/(app)/organization/")({
  component: RouteComponent,
  loader: async () => {
    // TODO: Add organization filtering based on ownership
    // const { user } = context.authSession;

    const organizations = await getOrganizations();

    return { organizations };
  },
});

function RouteComponent() {
  const { organizations } = Route.useLoaderData();
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-full bg-white flex flex-col">
      <TopBar />

      <div className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
        <h1 className="text-2xl text-center md:text-left font-semibold text-gray-900 mb-8">Your Organizations</h1>

        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 mb-8">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              placeholder="Search for an organization"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link
            to="/organization/create"
            className="flex items-center justify-center gap-2 bg-[#6be3a3] hover:bg-[#5cd493] text-emerald-950 font-medium px-4 py-2 rounded-md text-sm transition-colors shadow-sm w-full md:w-auto"
          >
            <Plus size={16} />
            New organization
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Link
              key={org.id}
              to="/organization/$organizationId"
              params={{ organizationId: org.id }}
              preload="intent"
              className="flex items-center border-dashed gap-4 border border-gray-200 rounded-xl p-4 hover:border-emerald-500 hover:shadow-sm transition-all bg-white"
            >
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 shrink-0">
                <Building2 size={20} strokeWidth={1.5} className="text-gray-600" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-900">{org.name}</h3>
                <p className="text-xs text-gray-500">
                  Free Plan • {org._count.projects} projects • {org._count.members} members
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* <div className="border border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer min-h-[140px] group">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Plus size={16} className="text-gray-500 group-hover:text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Create new organization</h3>
          <p className="text-xs text-gray-500">Start a new team workspace</p>
        </div> */}
      </div>
    </div>
  );
}
