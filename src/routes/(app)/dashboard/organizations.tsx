import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, LayoutGrid, Plus, Users2 } from "lucide-react";
import OrganizationList from "@/components/organization/organization-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getFieldInvalid } from "@/lib/form-utils";
import { createOrganizationFn } from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { type CreateOrganizationInput, createOrganizationSchema } from "@/modules/organization/organization.schema";

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  beforeLoad: () => {
    // check if super admin
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(organizationQueries.getAuthOrganization());
  },
  component: OrganizationsPage,
});

function OrganizationsPage() {
  return (
    <div className="w-full">
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h2>
            <p className="text-muted-foreground">Manage your organizations or switch between workspaces.</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> New Organization
                  </Button>
                }
              />
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Create Organization</SheetTitle>
                  <SheetDescription>Set up a new organization to start managing teams and projects.</SheetDescription>
                </SheetHeader>
                <div className="p-4 h-full flex flex-col">
                  <OrganizationFormBase />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{1}</div>
              <p className="text-xs text-muted-foreground">Active workspaces</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">Across all entities</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">48</div>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">+4 this month</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-foreground/5" />

        <OrganizationList />
      </div>
    </div>
  );
}

// TODO: move the logic of close modal to not affect the rendering of other page content
const OrganizationFormBase = () => {
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation({
    mutationKey: ["create", "organization"],
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      createOrganizationForm.reset();
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
      className="space-y-6 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await createOrganizationForm.handleSubmit();
      }}
    >
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
                placeholder="e.g. Acme Corp"
                className="rounded-lg h-11"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </createOrganizationForm.Field>

      <createOrganizationForm.Field name="logo">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Logo URL (Optional)</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="rounded-lg h-11"
            />
          </Field>
        )}
      </createOrganizationForm.Field>

      <Button
        type="submit"
        disabled={createOrganizationMutation.isPending}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
      >
        {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
};
