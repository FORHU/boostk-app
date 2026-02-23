import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { CreateOrganizationForm } from "./-components/OrganizationForm";

export const Route = createFileRoute("/(authenticated)/organization/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-full bg-gray-50/50 flex flex-col">
      <TopBar breadcrumbs={[{ label: "New organization" }]} />

      <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 flex justify-center -mt-8">
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
