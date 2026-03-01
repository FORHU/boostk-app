import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { getOrganization } from "@/modules/organization/organization.serverFn";
import { useAppStore } from "@/store/app.store";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    const orgId = context.authSession.user.orgId;
    const authUserOrg = orgId ? await getOrganization({ data: { orgId } }) : null;
    const augmentedUser = { ...context.authSession.user, organization: authUserOrg };

    useAppStore.setState({
      userAuth: augmentedUser,
      selectedOrganization: orgId ?? null,
    });

    return {
      authSession: {
        ...context.authSession,
        user: augmentedUser,
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
