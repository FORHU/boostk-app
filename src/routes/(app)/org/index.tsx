import { createFileRoute, redirect } from "@tanstack/react-router";
import { getOrganizationsByAuthUserFn } from "@/modules/organization/organization.serverFn";

export const Route = createFileRoute("/(app)/org/")({
  beforeLoad: async () => {
    const organizations = await getOrganizationsByAuthUserFn();
    if (organizations.length > 0) {
      throw redirect({ to: `/org/$organizationId`, params: { organizationId: organizations[0].id }, replace: true });
    }
    throw redirect({ to: "/organizations", replace: true });
  },
});
