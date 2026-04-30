import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/components/admin-page/users-page";

export const Route = createFileRoute("/(app)/dashboard/admin/users")({
  component: UsersPage,
});
