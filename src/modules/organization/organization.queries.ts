import { queryOptions } from "@tanstack/react-query";
import { getAuthOrganizationsFn } from "./organization.functions";

export const organizationQueries = {
  all: ["organization"],
  getAuthOrganization: () =>
    queryOptions({
      queryKey: [...organizationQueries.all, "auth"],
      queryFn: () => getAuthOrganizationsFn(),
    }),
};
