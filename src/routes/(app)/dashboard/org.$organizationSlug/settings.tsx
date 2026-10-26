import { useForm } from "@tanstack/react-form";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { requireOrgRole } from "@/modules/organization/organization.middleware";

// Zod schema for client and server validation
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
      const previousSlug = context.organization.slug;
      return await prisma.organization.update({
        where: { id: context.organization.id },
        data: {
          name: data.name,
          slug: data.slug,
          logo: data.logo,
          // Record the old slug so shared URLs keep resolving after a rename.
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

    // Reset file input so same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Mutation for Form Submission
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
          <PageHeader title="Edit Settings" description="Update your organization details.">
            <Button
              type="button"
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
            <Button type="submit" disabled={updateOrgMutation.isPending || !updateForm.state.canSubmit}>
              {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
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
                        <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="w-full"
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
                          className="w-full font-mono"
                          required
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                </updateForm.Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
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
                          className="w-full"
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
          <PageHeader title="Settings" description="Manage your organization settings.">
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
                <span className="text-sm text-muted-foreground">{organization?.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Slug</span>
                <span className="text-sm text-muted-foreground font-mono">{organization?.slug}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  className="relative group shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                  onClick={handleAvatarClick}
                >
                  <Avatar className="size-16">
                    <AvatarImage
                      src={organization?.logo || undefined}
                      alt={`${organization?.name} logo`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <span className="text-white text-xs font-medium">Upload</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </button>
                <p className="text-sm text-muted-foreground">Click the avatar to upload a new logo.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
