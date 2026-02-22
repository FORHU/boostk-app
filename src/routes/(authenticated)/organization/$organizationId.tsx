import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { Filter, LayoutGrid, List, MoreVertical, Plus, Search } from "lucide-react";
import { useId, useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { elysiaClient } from "@/lib/elysia-client";
import { useAppStore } from "@/store/app.store";

export const Route = createFileRoute("/(authenticated)/organization/$organizationId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    // In a real app we'd fetch the Org details to get the name, using ID as fallback
    const { data: projects, error } = await elysiaClient.api
      .organizations({ id: params.organizationId })
      .projects.get();

    if (error) {
      console.log("error", error.value);
      throw redirect({
        to: "/organization",
      });
    }
    return { organizationId: params.organizationId, projects: projects ?? [] };
  },
});

function RouteComponent() {
  const projectId = useId();
  const { organizationId, projects } = Route.useLoaderData();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const setSelectedOrganization = useAppStore((state) => state.setSelectedOrganization);

  useEffect(() => {
    setSelectedOrganization(organizationId);
  }, [organizationId, setSelectedOrganization]);

  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()));

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await elysiaClient.api.organizations({ id: organizationId }).projects.post({ name });

      if (error) {
        console.log("error", error.value);
        throw new Error("Failed to create project");
      }

      return data;
    },
    onSuccess: () => {
      router.invalidate();
      setIsOpen(false);
      setProjectName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(projectName);
  };

  return (
    <div className="min-h-full bg-white font-sans text-gray-900">
      <TopBar
        breadcrumbs={[
          { label: "Dashboard", to: "/" },
          { label: "Organizations", to: "/organization" },
          { label: "Projects" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold bg-white mb-6">Projects</h1>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Search for a project"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 shrink-0"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5">
              <button type="button" className="p-1.5 bg-gray-100 rounded text-gray-700 shadow-sm">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700">
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to="/project/$projectId"
              params={{ projectId: project.id }}
              className="block border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all bg-white relative group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 -mr-1 -mt-1 transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="text-xs text-gray-500 font-medium mb-6">AWS | AP-SOUTH-1</div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] tracking-wider">
                  ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 tracking-wider">
                  NANO
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Modal for Creating Project */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Create a new project</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor={projectId} className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Name
                  </label>
                  <input
                    id={projectId}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-shadow"
                    placeholder="e.g. My Awesome Dashboard"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={createProjectMutation.isPending}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProjectMutation.isPending || !projectName.trim()}
                    className="bg-[#10b981] text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
