import { createFileRoute, redirect } from "@tanstack/react-router";
import { elysiaClient } from "@/lib/elysia-client";

export const Route = createFileRoute("/(authenticated)/project/$projectId")({
  component: RouteComponent,
  beforeLoad: async ({ params }) => {
    const { data: project, error } = await elysiaClient.api.projects({ projectId: params.projectId }).get();

    if (error) {
      // redirect to /organization
      console.log("error", error.value);
      // TODO: Display as toast
      // throw new Error(`Failed: ${error.value}`)
      throw redirect({
        to: "/organization",
      });
    }
    console.log("project", project);
    if (!project) {
      throw redirect({
        to: "/organization",
      });
    }

    return { project };
  },
});

function RouteComponent() {
  const { project } = Route.useRouteContext();

  return (
    <div>
      Hello "/(authenticated)/project/$projectId"! {project.name}
      <div>
        <p>Project ID: {project.id}</p>
        <p>Project Name: {project.name}</p>
        <p>Project API Key: {project.apiKey}</p>
        <p>Project Allowed Domains: {project.allowedDomains.join(", ")}</p>
      </div>
    </div>
  );
}
