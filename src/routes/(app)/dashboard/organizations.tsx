import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { UsageCardsSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
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
      <PageHeader title="Organizations" description="Manage your organizations and switch between them." />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Organization</CardTitle>
              <CardDescription>Add a new organization to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
              <CardDescription>List of organizations you are a member of.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationListSuspense />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const OrganizationForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOrganizationMutation = useMutation({
    mutationKey: ["create", "organization"],
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      toast("Organization created successfully!", "success");
    },
    onError: (error) => {
      console.error(error);
      toast(error.message || "Failed to create organization. Please try again.", "error");
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
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="https://example.com/logo.png"
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
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
      >
        {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
        <Plus className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
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

  if (organizations.length === 0) {
    return (
      <EmptyState
        title="No organizations yet"
        description="Create your first organization to start managing projects."
        size="sm"
      />
    );
  }

  return (
    <div className="space-y-3">
      {organizations.map((org) => (
        <Link
          to="/dashboard/org/$organizationId"
          params={{ organizationId: org.id }}
          key={org.id}
          className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-accent/50 hover:border-primary/40"
        >
          <EntityAvatar
            name={org.name}
            logo={org.logo}
            className="size-10"
            fallbackClassName="bg-primary/10 text-primary"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{org.name}</span>
              {org.role && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {org.role}
                </span>
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">/{org.slug}</span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
};
