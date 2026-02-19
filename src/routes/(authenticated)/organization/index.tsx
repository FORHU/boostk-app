import { createFileRoute } from "@tanstack/react-router";
import { CreateOrganizationForm } from "./-components/OrganizationForm";

export const Route = createFileRoute("/(authenticated)/organization/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Hello "/(authenticated)/organization/"!</h1>

      <CreateOrganizationForm />
    </div>
  );
}
