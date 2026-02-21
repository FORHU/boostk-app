import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { elysiaClient } from "@/lib/elysia-client";
import { updateProjectDomains } from "@/modules/project/project.service";

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
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      // Joining array to string for easy editing in a single input
      domains: project.allowedDomains.join(", "),
    },
    onSubmit: async ({ value }) => {
      const domainArray = value.domains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      await updateProjectDomains({
        data: {
          projectId: project.id,
          allowedDomains: domainArray,
        },
      });

      // Refresh the route data to show the updated domains
      router.invalidate();
    },
  });

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Project: {project.name}</h1>
        <p>Project ID: {project.id}</p>
        <p>API Key: {project.apiKey}</p>
        <p>Allowed Domains: {project.allowedDomains.join(", ")}</p>
      </div>
      <div>
        <Link to="/widget/$apiKey" params={{ apiKey: project.apiKey }}>
          Open Widget
        </Link>
      </div>
      <hr />

      <div className="max-w-md">
        <h2 className="text-lg font-semibold mb-2">Update Allowed Domains</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="domains">
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium mb-1">
                  Domains (comma separated)
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="example.com, localhost:3000"
                />
                {/* Optional: Add error handling display here */}
                {field.state.meta.errors ? (
                  <em className="text-red-500 text-xs">{field.state.meta.errors.join(", ")}</em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Save Domains"}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
