import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { updateProjectDomains } from "@/modules/project/project.service";

export const Route = createFileRoute("/(app)/_organization/project/$projectId/settings")({
  component: ProjectSettingsComponent,
});

const domainsSchema = z.object({
  domains: z.string().min(1, "At least one domain is required (e.g. example.com)"),
});

function ProjectSettingsComponent() {
  const { project } = Route.useRouteContext();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      domains: project.allowedDomains.join(", "),
    },
    validators: {
      onChange: domainsSchema,
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

      router.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Project Settings</h2>
        <p className="text-sm text-gray-500 mb-6">Manage allowed domains and API credentials for {project.name}.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="domains">
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Allowed Domains (comma separated)
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={`w-full p-2.5 text-sm border bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                    field.state.meta.errors.length ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="example.com, localhost:3000"
                />
                {field.state.meta.errors.length > 0 ? (
                  <em className="text-red-500 text-xs mt-1.5 block">{field.state.meta.errors.join(", ")}</em>
                ) : (
                  <p className="text-xs text-gray-500 mt-1.5">Domains allowed to use this Project API Key.</p>
                )}
              </div>
            )}
          </form.Field>

          <div className="border-t border-gray-100 pt-6 flex justify-end">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}
