import { useForm } from "@tanstack/react-form";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { getFieldInvalid } from "@/lib/form-utils";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

// Zod schema for client and server validation
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
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

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/settings")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organizationId } = Route.useParams();
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

    if (file.size > 2 * 1024 * 1024) {
      toast("Image must be less than 2MB", "error");
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
      } catch (error) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingQueries.setting });
      setIsEditing(false);
      toast("Organization settings updated successfully!", "success");
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
    <div className="mt-6 ml-6">
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
                    <FieldLabel htmlFor={field.name} className="block text-sm font-medium mb-1">
                      Organization Name
                    </FieldLabel>
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
                    <FieldLabel htmlFor={field.name} className="block text-sm font-medium mb-1">
                      Slug
                    </FieldLabel>
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

            <updateForm.Field name="logo">
              {(field) => {
                const isInvalid = getFieldInvalid(field, updateForm);
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className="block text-sm font-medium mb-1">
                      Logo URL
                    </FieldLabel>
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

          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              className="px-4 py-2 border hover:bg-muted transition-colors"
              onClick={() => {
                updateForm.reset();
                updateOrgMutation.reset();
                setIsEditing(false);
              }}
              disabled={updateOrgMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateOrgMutation.isPending || !updateForm.state.canSubmit}
              className="px-4 py-2 border bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ----- READ-ONLY MODE ----- */}
          <h1 className="mb-6 text-2xl font-bold ">Settings</h1>
          <div className="grid grid-cols-2">
            <div className="relative group size-50 mb-10 cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="size-full">
                <AvatarImage src={organization?.logo || undefined} alt={`${organization?.name} logo`} className="object-cover" />
                <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <span className="text-white text-sm font-medium">Upload Image</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="ml-auto mr-20">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm border rounded hover:bg-muted transition-colors"
              >
                Edit Settings
              </button>
            </div>
          </div>

          <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-background isolate mr-10">
            <div className="divide-y divide-border">
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 text-sm font-semibold">Name</div>
                <div className="px-6 py-4 text-sm text-muted-foreground">{organization?.name}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 text-sm font-semibold">Slug</div>
                <div className="px-6 py-4 text-sm text-muted-foreground">{organization?.slug}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
