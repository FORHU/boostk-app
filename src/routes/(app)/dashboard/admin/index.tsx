import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/admin/users" });
  },
});
