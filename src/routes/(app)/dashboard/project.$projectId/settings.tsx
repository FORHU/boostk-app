import { useForm } from "@tanstack/react-form";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { getFieldInvalid } from "@/lib/form-utils";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

// Zod schema for validation
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional().nullable(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const getProjectSettingsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    return context.project;
  });

export const updateProjectFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ projectId: z.string() }).and(updateProjectSchema))
  .middleware([requireProjectRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context, data }) => {
    try {
      return await prisma.project.update({
        where: { id: context.project.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new Error("This slug is already in use. Please choose another one.");
      }
      throw new Error("Failed to save project settings.");
    }
  });
export const projectSettingQueries = {
  setting: ["project-setting"],
  allByProjectId: (projectId: string) =>
    queryOptions({
      queryKey: [...projectSettingQueries.setting, projectId],
      queryFn: () => getProjectSettingsFn({ data: { projectId } }),
    }),
};

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/settings")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { projectId } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: project } = useSuspenseQuery(projectSettingQueries.allByProjectId(projectId));
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe 
  src="${typeof window !== "undefined" ? window.location.origin : ""}/support/${project.slug}/chat-widget" 
  width="400" 
  height="600" 
  style="border: none; position: fixed; bottom: 20px; right: 20px; z-index: 9999; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateProjectMutation = useMutation({
    mutationKey: ["update-project", projectId],
    mutationFn: updateProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectSettingQueries.setting });
      setIsEditing(false);
      toast("Project settings updated successfully!", "success");
    },
    onError: (error) => {
      console.error(error);
      toast("Failed to update project settings.", "error");
    },
  });

  const updateForm = useForm({
    defaultValues: {
      name: project?.name || "",
      slug: project?.slug || "",
      description: project?.description || "",
      logo: project?.logo || "",
    } as UpdateProjectInput,
    validators: {
      onChange: updateProjectSchema,
      onSubmit: updateProjectSchema,
    },
    onSubmit: async ({ value }) => {
      await updateProjectMutation.mutateAsync({
        data: {
          projectId,
          ...value,
        },
      });
    },
  });

  return (
    <div className="p-6">
      {isEditing ? (
        <form
          className="flex flex-col gap-4 mr-10"
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await updateForm.handleSubmit();
          }}
        >
          {/* Server errors (duplicate slug, etc.) are surfaced via the error toast. */}
          <FieldGroup className="flex flex-col gap-4">
            <updateForm.Field name="name">
              {(field) => {
                const isInvalid = getFieldInvalid(field, updateForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </updateForm.Field>

            <updateForm.Field name="slug">
              {(field) => {
                const isInvalid = getFieldInvalid(field, updateForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full font-mono"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </updateForm.Field>

            <updateForm.Field name="description">
              {(field) => {
                const isInvalid = getFieldInvalid(field, updateForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border rounded-md p-2"
                      rows={3}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </updateForm.Field>
          </FieldGroup>

          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              className="px-4 py-2 border hover:bg-muted transition-colors"
              onClick={() => {
                updateForm.reset();
                setIsEditing(false);
              }}
              disabled={updateProjectMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProjectMutation.isPending || !updateForm.state.canSubmit}
              className="px-4 py-2 border bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ----- READ-ONLY MODE ----- */}
          <div className="grid grid-cols-2 mb-10">
            <div>
              <h1 className="text-2xl font-bold">Project Settings</h1>
            </div>
            <div className="ml-auto mr-20">
              <button
                type="button"
                className="px-4 py-2 text-sm border rounded hover:bg-muted transition-colors"
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200">
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 text-sm font-semibold">Name</div>
                <div className="px-6 py-4 text-sm">{project?.name}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 text-sm font-semibold">Slug</div>
                <div className="px-6 py-4 text-sm font-mono">{project?.slug}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 text-sm font-semibold">Description</div>
                <div className="px-6 py-4 text-sm whitespace-normal wrap-break-words">
                  {project?.description || "No description provided."}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Embed Widget</h2>
                <p className="text-sm text-gray-500">Copy this code to install the chat widget on your website.</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border bg-white rounded-md hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="p-6 bg-gray-900 text-gray-100 overflow-x-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">{embedCode}</pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
