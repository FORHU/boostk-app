import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { getOrganization } from "@/modules/organization/organization.serverFn";
import { useAppStore } from "@/store/app.store";

export const Route = createFileRoute("/(authenticated)")({
  beforeLoad: async ({ context, location }) => {
    if (!context.authSession) {
      throw redirect({ to: "/signin" });
    }

    // Handle string variants: `/organization`, `/organization/`, `/organization/create`, etc.
    const normalizedPath = location.pathname.replace(/\/$/, "");
    const isOrgRoute = normalizedPath === "/organization" || normalizedPath.startsWith("/organization/");

    const orgId = context.authSession.user?.orgId;

    if (!orgId) {
      if (isOrgRoute) {
        return {
          authSession: {
            ...context.authSession,
            user: { ...context.authSession.user, organization: null },
          },
        };
      }
      throw redirect({ to: "/organization" });
    }

    const authUserOrg = await getOrganization({ data: { orgId } });
    if (!authUserOrg) {
      if (isOrgRoute) {
        return {
          authSession: {
            ...context.authSession,
            user: { ...context.authSession.user, organization: null },
          },
        };
      }
      throw redirect({ to: "/organization" });
    }

    return {
      authSession: {
        ...context.authSession,
        user: { ...context.authSession.user, organization: authUserOrg },
      },
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { authSession } = Route.useRouteContext();
  const initSSE = useAppStore((state) => state.initSSE);
  const agentId = authSession.user.id;

  useEffect(() => {
    initSSE(agentId);
  }, [initSSE, agentId]);

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50 text-gray-900">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
