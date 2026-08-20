import { useForm } from "@tanstack/react-form";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Camera, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { getFieldInvalid } from "@/lib/form-utils";
import { prisma } from "@/lib/prisma";
import { slugSchema } from "@/lib/utils";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  logo: z.string().optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const getSettingsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    return context.organization;
  });

export const updateOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string() }).and(updateOrganizationSchema))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context, data }) => {
    try {
      return await prisma.organization.update({
        where: { id: context.organization.id },
        data: {
          name: data.name,
          slug: data.slug,
          logo: data.logo,
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new Error("This slug is already taken by another organization.");
      }
      throw new Error("Failed to save organization settings.");
    }
  });

export const settingQueries = {
  setting: ["setting"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...settingQueries.setting, organizationId],
      queryFn: () => getSettingsFn({ data: { organizationId } }),
    }),
};

export const Route = createFileRoute("/(app)/dashboard/org/$organizationSlug/settings")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organization: routeOrganization } = Route.useRouteContext();
  const organizationId = routeOrganization.id;
  const navigate = Route.useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: organization } = useSuspenseQuery(settingQueries.allByOrgId(organizationId));

  const fallbackInitials = organization?.name?.substring(0, 2).toUpperCase() || "OR";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast("Image must be less than 10MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      try {
        await updateOrgMutation.mutateAsync({
          data: {
            organizationId,
            name: organization?.name || "",
            slug: organization?.slug || "",
            logo: base64String,
          },
        });
      } catch (_error) {
        // error handled in mutation onError
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateOrgMutation = useMutation({
    mutationKey: ["update", "organization", organizationId],
    mutationFn: updateOrganizationFn,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: settingQueries.setting });
      setIsEditing(false);
      toast("Organization settings updated successfully!", "success");
      if (updated.slug && updated.slug !== routeOrganization.slug) {
        navigate({
          to: "/dashboard/org/$organizationSlug/settings",
          params: { organizationSlug: updated.slug },
          replace: true,
        });
      }
    },
    onError: (error) => {
      console.error(error);
      toast("Failed to update organization settings.", "error");
    },
  });

  const updateForm = useForm({
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
      logo: organization?.logo || "",
    } as UpdateOrganizationInput,
    validators: {
      onChange: updateOrganizationSchema,
      onSubmit: updateOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateOrgMutation.mutateAsync({
        data: {
          organizationId,
          ...value,
        },
      });
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {isEditing ? (
        <>
          <PageHeader title="Edit Settings" description="Update your organization profile and preferences.">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  updateForm.reset();
                  updateOrgMutation.reset();
                  setIsEditing(false);
                }}
                disabled={updateOrgMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await updateForm.handleSubmit();
                }}
                disabled={updateOrgMutation.isPending || !updateForm.state.canSubmit}
              >
                {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </PageHeader>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Organization Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await updateForm.handleSubmit();
                }}
                className="space-y-6"
              >
                <FieldGroup className="space-y-6">
                  <updateForm.Field name="name">
                    {(field) => {
                      const isInvalid = getFieldInvalid(field, updateForm);
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter organization name"
                            required
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
                            placeholder="organization-slug"
                            className="font-mono"
                            required
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </updateForm.Field>

                  <updateForm.Field name="logo">
                    {(field) => {
                      const isInvalid = getFieldInvalid(field, updateForm);
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Logo URL</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="https://example.com/logo.png"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </updateForm.Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <PageHeader title="Settings" description="Manage your organization profile and preferences.">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" />
              Edit Settings
            </Button>
          </PageHeader>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Organization Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <button
                  type="button"
                  className="relative group size-24 shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl bg-transparent p-0 block"
                  onClick={handleAvatarClick}
                >
                  <Avatar className="size-full rounded-2xl">
                    <AvatarImage
                      src={organization?.logo || undefined}
                      alt={`${organization?.name} logo`}
                      className="object-cover rounded-2xl"
                    />
                    <AvatarFallback className="text-xl rounded-2xl">{fallbackInitials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <Camera className="size-5 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </button>

                <div className="flex-1 min-w-0 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{organization?.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slug</p>
                      <p className="text-sm font-medium font-mono">{organization?.slug}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
