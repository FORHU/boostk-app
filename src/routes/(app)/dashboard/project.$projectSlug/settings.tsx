import { useForm } from "@tanstack/react-form";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { getFieldInvalid } from "@/lib/form-utils";
import { prisma } from "@/lib/prisma";
import { slugSchema } from "@/lib/slug";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

// Zod schema for validation
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
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
      const previousSlug = context.project.slug;
      return await prisma.project.update({
        where: { id: context.project.id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          // Record the old slug so embedded widgets and shared links keep resolving.
          ...(data.slug !== previousSlug ? { previousSlugs: { push: previousSlug } } : {}),
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

export const Route = createFileRoute("/(app)/dashboard/project/$projectSlug/settings")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const { project: routeProject } = Route.useRouteContext();
  const projectId = routeProject.id;
  const navigate = Route.useNavigate();
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
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: projectSettingQueries.setting });
      setIsEditing(false);
      toast("Project settings updated successfully!", "success");
      if (updated.slug && updated.slug !== routeProject.slug) {
        navigate({
          to: "/dashboard/project/$projectSlug/settings",
          params: { projectSlug: updated.slug },
          replace: true,
        });
      }
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
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
      {isEditing ? (
        <form
          className="space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await updateForm.handleSubmit();
          }}
        >
          <PageHeader title="Project Settings" description="Update your project details.">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                updateForm.reset();
                setIsEditing(false);
              }}
              disabled={updateProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProjectMutation.isPending || !updateForm.state.canSubmit}>
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </PageHeader>

          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="space-y-6">
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
                          aria-invalid={isInvalid}
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
                          aria-invalid={isInvalid}
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
                          className="w-full border border-border rounded-lg bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          rows={3}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </updateForm.Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>
      ) : (
        <>
          <PageHeader title="Project Settings" description="Manage your project configuration.">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Settings
            </Button>
          </PageHeader>

          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-muted-foreground">{project?.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Slug</span>
                <span className="text-sm text-muted-foreground font-mono">{project?.slug}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Description</span>
                <span className="text-sm text-muted-foreground text-right max-w-md">
                  {project?.description || "No description provided."}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed Widget</CardTitle>
              <p className="text-sm text-muted-foreground">
                Copy this code to install the chat widget on your website.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-foreground/5 border border-border p-6 overflow-x-auto">
                <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">{embedCode}</pre>
              </div>
            </CardContent>
            <div className="px-4 pb-4">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
