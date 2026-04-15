import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ProjectUpdateForm } from "@/components/project/ProjectUpdateForm";
import { projectQueries } from "@/modules/project/project.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/settings")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(projectQueries.getById(params.projectId));
  },
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { projectId } = Route.useParams();

  return (
    <div className="flex-1 overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      <div className="flex flex-col gap-10 max-w-5xl mx-auto px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Project Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">General configuration and lifecycle controls</p>
        </div>

        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
          <ProjectUpdateForm projectId={projectId} />
        </Suspense>
      </div>
    </div>
  );
}
