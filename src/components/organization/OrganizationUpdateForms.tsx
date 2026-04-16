"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  deactivateOrganizationFn,
  type GetOrganizationReturn,
  updateOrganizationFn,
} from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { updateOrganizationSchema } from "@/modules/organization/organization.schema";

export function OrganizationUpdateForms({ organization }: { organization: GetOrganizationReturn }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateMutation = useMutation({
    mutationFn: updateOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to update organization");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      toast.success("Organization deactivated");
      navigate({ to: "/dashboard/organizations" });
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to deactivate organization");
    },
  });

  const isDeactivated = organization.status === "INACTIVE";

  const form = useForm({
    defaultValues: {
      id: organization.id,
      name: organization.name,
    },
    validators: {
      onChange: updateOrganizationSchema,
      onSubmit: updateOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({ data: value });
    },
  });

  const handleCopySlug = () => {
    navigator.clipboard.writeText(organization.slug);
    toast.success("Organization slug copied to clipboard");
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {isDeactivated && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>This organization is deactivated. Settings are read-only.</span>
        </div>
      )}

      {/* Organization Details */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Organization details</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6 rounded-xl border bg-card p-6 shadow-xs"
        >
          <form.Field name="name">
            {(field) => (
              <Field orientation="horizontal" className="justify-between">
                <FieldLabel htmlFor={field.name} className="text-base text-muted-foreground font-normal">
                  Organization name
                </FieldLabel>
                <div className="w-full max-w-md">
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="h-10 bg-background/50 border-border/50"
                    readOnly={isDeactivated}
                    disabled={isDeactivated}
                  />
                </div>
              </Field>
            )}
          </form.Field>

          <Field orientation="horizontal" className="justify-between">
            <FieldLabel htmlFor="org-slug" className="text-base text-muted-foreground font-normal">
              Organization slug
            </FieldLabel>
            <div className="w-full max-w-md flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="org-slug"
                  value={organization.slug}
                  readOnly
                  placeholder="organization-slug"
                  className="h-10 bg-muted/30 border-border/50 pr-20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySlug}
                  type="button"
                  className="absolute right-1 top-1 h-8 px-2 text-xs hover:bg-muted/50"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          </Field>

          {!isDeactivated && (
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-6">
              <Button
                variant="ghost"
                type="button"
                onClick={() => form.reset()}
                className="h-9 px-4 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !form.state.canSubmit}
                className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </form>
      </section>

      {/* Danger Zone — only shown for active orgs */}
      {!isDeactivated && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Danger zone</h2>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-2 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-destructive leading-none pt-1">
                  Deactivating this organization will also hide its projects
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Make sure you have backed up any necessary data before deactivating. You can reactivate it later from
                  the admin dashboard.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="destructive"
                type="button"
                className="h-10 px-6"
                disabled={deactivateMutation.isPending}
                onClick={() => {
                  toast("Are you sure you want to deactivate this organization?", {
                    description: "This will hide all associated projects.",
                    action: {
                      label: "Deactivate",
                      onClick: () => deactivateMutation.mutate({ data: { organizationId: organization.id } }),
                    },
                    cancel: {
                      label: "Cancel",
                      onClick: () => {},
                    },
                  });
                }}
              >
                {deactivateMutation.isPending ? "Deactivating..." : "Deactivate organization"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
