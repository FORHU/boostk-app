import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
// Adjust the middleware import to match your project auth structure
import { requireProjectMiddleware } from "@/modules/project/project.middleware"; 
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; 

// 1. Fetching Function
export const getProjectSettingsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectMiddleware])
  .handler(async ({ data }) => {
    return prisma.project.findUnique({
      where: { id: data.projectId },
    });
  });

// 2. Update Function to save changes
export const updateProjectFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    projectId: z.string(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
  }))
  .middleware([requireProjectMiddleware])
  .handler(async ({ data }) => {
    return prisma.project.update({
      where: { id: data.projectId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
      },
    });
  });

// 3. Query Options
export const projectSettingQueries = {
  setting: ["project-setting"],
  allByProjectId: (projectId: string) =>
    queryOptions({
      queryKey: [...projectSettingQueries.setting, "setting", projectId],
      queryFn: () => getProjectSettingsFn({ data: { projectId } }),
    }),
}

// Adjust the route path based on your actual file tree
export const Route = createFileRoute("/(app)/dashboard/project/$projectId/settings")({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { projectId } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: project, refetch } = useSuspenseQuery(
    projectSettingQueries.allByProjectId(projectId)
  );

  // Fallback initials
  const fallbackInitials = project?.name?.substring(0, 2).toUpperCase() || "PR";

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await updateProjectFn({
      data: {
        projectId,
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: formData.get("description") as string,
      }
    });

    setIsEditing(false);
    refetch(); // Refresh the data to show updates
  };

  return (
    <div className="mt-6 ml-6">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mr-10">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input 
                  name="name" 
                  defaultValue={project?.name} 
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input 
                  name="slug" 
                  defaultValue={project?.slug} 
                  className="w-full border rounded-md p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  name="description" 
                  defaultValue={project?.description || ""} 
                  className="w-full border rounded-md p-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm bg-secondary rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md"
                >
                  Save Changes
                </button>
              </div>
        </form>
      ) : (
        <>
          {/* ----- READ-ONLY MODE ----- */}
          <div className="grid grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold">Project Settings</h1>
            </div>
            <div className="ml-auto mr-20">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
              >
                Edit Settings
              </button>
            </div>
            <p className="mt-2">Id: {projectId}</p>
          </div>
          
          <div className="flex flex-col">
            <h2 className="font-bold mt-5">Name:</h2>
            <p className="text-muted-foreground border-b border-border pb-2 mr-10">
              {project?.name}
            </p>

            <p className="font-bold mt-5">Slug:</p>
            <p className="text-muted-foreground border-b border-border pb-2 mr-10">
              {project?.slug}
            </p>

            <p className="font-bold mt-5">Description:</p>
            <p className="text-muted-foreground border-b border-border pb-2 mr-10">
              {project?.description || "No description provided."}
            </p>
          </div>
        </>
      )}
    </div>
  );}