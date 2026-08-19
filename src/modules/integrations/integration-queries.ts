import { queryOptions } from "@tanstack/react-query";
import { getOrgIntegrationsFn } from "./integration-functions";

export const organizationIntegrationQueries = {
  all: (organizationId: string) =>
    queryOptions({
      queryKey: ["org-integrations", organizationId],
      queryFn: () => getOrgIntegrationsFn({ data: { organizationId } }),
    }),
};
