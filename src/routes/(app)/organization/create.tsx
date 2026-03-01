import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { CreateOrganizationForm } from "./-components/OrganizationForm";

export const Route = createFileRoute("/(app)/organization/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-full bg-gray-50/50 flex flex-col">
      <TopBar>
        <div className="flex items-center gap-2">
          <Link to="/organization" className="hover:text-gray-900 transition-colors">
            <p>Organizations</p>
          </Link>
        </div>
      </TopBar>

      <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 flex justify-center -mt-8">
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
