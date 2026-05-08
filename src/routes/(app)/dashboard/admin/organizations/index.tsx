import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsPage } from "@/components/admin-page/organizations-page";
import { getAdminOrganizationsFn } from "@/modules/organization/organization.functions";

export const Route = createFileRoute("/(app)/dashboard/admin/organizations/")({
  loader: () => getAdminOrganizationsFn(),
  component: OrganizationsPage,
});
