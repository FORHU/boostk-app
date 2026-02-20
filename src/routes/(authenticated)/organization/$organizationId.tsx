import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { elysiaClient } from "@/lib/elysia-client";

export const Route = createFileRoute("/(authenticated)/organization/$organizationId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { data: projects, error } = await elysiaClient.api
      .organizations({ id: params.organizationId })
      .projects.get();

    if (error) {
      // redirect to /organization
      console.log("error", error.value);
      // TODO: Display as toast
      // throw new Error(`Failed: ${error.value}`)
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

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await elysiaClient.api.organizations({ id: organizationId }).projects.post({ name });

      if (error) {
        // TODO: Display as toast
        console.log("error", error.value);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organization: {organizationId}</h1>
        {/* Create Project Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          + New Project
        </button>
      </div>

      <ul className="space-y-2">
        {projects.map((project) => (
          <Link key={project.id} to="/project/$projectId" params={{ projectId: project.id }}>
            <li className="p-3 border rounded shadow-sm bg-white">{project.name}</li>
          </Link>
        ))}
      </ul>

      {/* Simple Supabase-style Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create a new project</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor={projectId} className="block text-sm font-medium mb-1">
                  Project Name
                </label>
                <input
                  id={projectId}
                  className="w-full border p-2 rounded"
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
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending || !projectName}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
