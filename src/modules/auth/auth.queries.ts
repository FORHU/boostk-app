import { queryOptions } from "@tanstack/react-query";
import { getAuthenticatedUserFn, getAuthUserSessionFn } from "@/modules/auth/auth.functions";

export const authQueries = {
  all: ["auth"],
  authUser: () =>
    queryOptions({
      queryKey: [...authQueries.all, "user"],
      queryFn: () => getAuthUserSessionFn(),
      staleTime: 60 * 1000, // 1 minute
    }),
  getAuthenticatedUser: () =>
    queryOptions({
      queryKey: [...authQueries.all, "user"],
      queryFn: () => getAuthenticatedUserFn(),
      staleTime: 60 * 1000, // 1 minute
    }),
};
