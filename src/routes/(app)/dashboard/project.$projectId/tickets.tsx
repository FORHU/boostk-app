import { createFileRoute, redirect } from "@tanstack/react-router";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/tickets")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: ProjectTicketsPage,
});

function ProjectTicketsPage() {
  const { projectId } = Route.useParams();
  return (
    <div>
      <h1>Tickets - {projectId}</h1>
      <div>
        <div>Welcome to Project Tickets Page</div>
      </div>
    </div>
  );
}
