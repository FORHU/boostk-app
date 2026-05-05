import { createFileRoute } from "@tanstack/react-router";
import { OrganizationDetailsPage } from "@/components/admin-page/organization-details-page";

export const Route = createFileRoute("/(app)/dashboard/admin/organizations/$organizationId")({
  component: () => {
    const { organizationId } = Route.useParams();
    return <OrganizationDetailsPage organizationId={organizationId} />;
  },
});
