import { queryOptions } from "@tanstack/react-query";
import { getOrgProjectsFn } from "@/modules/organization/organization.functions";
import { deactivateProjectFn, getProjectFn, updateProjectFn } from "./project.functions";

export const projectQueries = {
  all: ["projects"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...projectQueries.all, "by-org", organizationId],
      queryFn: () => getOrgProjectsFn({ data: { organizationId } }),
    }),
  getById: (projectId: string) =>
    queryOptions({
      queryKey: [...projectQueries.all, "by-id", projectId],
      queryFn: () => getProjectFn({ data: { projectId } }),
    }),
};

export const projectMutations = {
  update: () => ({
    mutationFn: updateProjectFn,
  }),
  deactivate: () => ({
    mutationFn: deactivateProjectFn,
  }),
};
