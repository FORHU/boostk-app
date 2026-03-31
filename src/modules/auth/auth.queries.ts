import { queryOptions } from "@tanstack/react-query";
import { getAuthUserSessionFn } from "@/modules/auth/auth.functions";

export const authQueries = {
  all: ["auth"],
  authUser: () =>
    queryOptions({
      queryKey: [...authQueries.all, "user"],
      queryFn: () => getAuthUserSessionFn(),
      staleTime: 5000,
    }),
};
