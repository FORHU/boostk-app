import { createFileRoute } from "@tanstack/react-router";
import { OrganizationUpdateForms } from "@/components/organization/OrganizationUpdateForms";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/settings")({
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organization } = Route.useRouteContext();

  if (!organization) {
    return (
      <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Organization not found or you don't have access.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Organization Settings</h2>
          <p className="text-muted-foreground">General configuration, privacy, and lifecycle controls</p>
        </div>

        <div className="mt-8">
          <OrganizationUpdateForms organization={organization} />
        </div>
      </div>
    </div>
  );
}
