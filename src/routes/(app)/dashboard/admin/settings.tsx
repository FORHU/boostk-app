import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/admin-page/settings-page";

export const Route = createFileRoute("/(app)/dashboard/admin/settings")({
  component: SettingsPage,
});
