import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { elysiaClient } from "@/lib/elysia-client";
import { CreateOrganizationForm } from "./-components/OrganizationForm";

export const Route = createFileRoute("/(authenticated)/organization/")({
  component: RouteComponent,
  loader: async () => {
    const { data: organizations, error } = await elysiaClient.api.organizations.get();

    if (error) {
      // redirect to /organization
      console.log("error", error.value);
      // TODO: Display as toast
      // throw new Error(`Failed: ${error.value}`)
      throw redirect({
        to: "/organization",
      });
    }
    return { organizations: organizations ?? [] };
  },
});

function RouteComponent() {
  const { organizations } = Route.useLoaderData();
  return (
    <div>
      <h1>Hello "/(authenticated)/organization/"!</h1>
      {organizations.map((organization) => (
        <Link key={organization.id} to="/organization/$organizationId" params={{ organizationId: organization.id }}>
          <div className="p-3 border rounded shadow-sm bg-white">{organization.name}</div>
        </Link>
      ))}
      <CreateOrganizationForm />
    </div>
  );
}
