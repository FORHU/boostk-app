import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Folder, MoreVertical, Plus, Search } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { elysiaClient } from "@/lib/elysia-client";
import { CreateOrganizationForm } from "./-components/OrganizationForm";

export const Route = createFileRoute("/(authenticated)/organization/")({
  component: RouteComponent,
  loader: async () => {
    const { data: organizations, error } = await elysiaClient.api.organizations.get();

    if (error) {
      console.log("error", error.value);
      throw redirect({
        to: "/organization",
      });
    }
    return { organizations: organizations ?? [] };
  },
});

function RouteComponent() {
  const { organizations } = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const filteredOrgs = organizations.filter((org) => org.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-full bg-white">
      <TopBar breadcrumbs={[{ label: "Dashboard" }, { label: "Organizations" }]} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Organizations</h1>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Search by name or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map((org) => (
            <Link
              key={org.id}
              to="/organization/$organizationId"
              params={{ organizationId: org.id }}
              className="group block border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-3H8v-3h3v-3h3v3h3v3h-3v3h-3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                </div>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Dropdown logic could go here
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Folder size={14} />
                <span>Projects</span>
              </div>
            </Link>
          ))}

          {/* Create New Org Card */}
          <div className="border border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer min-h-[140px] group">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Plus size={16} className="text-gray-500 group-hover:text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Create new organization</h3>
            <p className="text-xs text-gray-500">Start a new team workspace</p>
          </div>
        </div>

        {/* Existing form hidden/below for real functionality if needed */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Create</h3>
          <CreateOrganizationForm />
        </div>
      </div>
    </div>
  );
}
