import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UsageCardsSkeleton } from "@/components/ui/skeleton";
import { getFieldInvalid } from "@/lib/form-utils";
import { createOrganizationFn } from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { type CreateOrganizationInput, createOrganizationSchema } from "@/modules/organization/organization.schema";

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(organizationQueries.getAuthOrganization());
  },
  component: OrganizationsPage,
});

function OrganizationsPage() {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-sm">Manage your organizations and switch between them.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Create Organization</h3>
              <p className="text-sm text-muted-foreground">Add a new organization to your account.</p>
            </div>
            <OrganizationForm />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Your Organizations</h3>
              <p className="text-sm text-muted-foreground">List of organizations you are a member of.</p>
            </div>
            <div className="p-6 pt-0">
              <OrganizationListSuspense />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const OrganizationForm = () => {
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation({
    mutationKey: ["create", "organization"],
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const createOrganizationForm = useForm({
    defaultValues: {
      name: "",
      logo: "",
    } as CreateOrganizationInput,
    validators: {
      onBlur: createOrganizationSchema,
      onSubmit: createOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await createOrganizationMutation.mutateAsync({ data: value });
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await createOrganizationForm.handleSubmit();
      }}
    >
      <FieldGroup>
        <createOrganizationForm.Field name="name">
          {(field) => {
            const isInvalid = getFieldInvalid(field, createOrganizationForm);
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
                  placeholder="Enter your organization name"
                  className="rounded"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </createOrganizationForm.Field>
        <createOrganizationForm.Field name="logo">
          {(field) => {
            const isInvalid = getFieldInvalid(field, createOrganizationForm);
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Logo</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  type="url"
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="https://example.com/logo.png"
                  className="rounded"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </createOrganizationForm.Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={createOrganizationMutation.isPending}
        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg group rounded"
      >
        {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
        <Plus className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  );
};

const OrganizationListSuspense = () => {
  return (
    <Suspense fallback={<UsageCardsSkeleton count={1} className="md:grid-cols-1" />}>
      <OrganizationList />
    </Suspense>
  );
};

const OrganizationList = () => {
  const { data: organizations } = useSuspenseQuery(organizationQueries.getAuthOrganization());

  return (
    <div className="space-y-4">
      {organizations.map((org) => (
        <Link
          to="/dashboard/org/$organizationId"
          params={{ organizationId: org.id }}
          key={org.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{org.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">/{org.slug}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};
