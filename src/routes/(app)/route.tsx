import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return { authSession: context.authSession };
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { authSession } = Route.useRouteContext();

  const handleSignout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/signin" });
        },
      },
    });
  };
  return (
    <div>
      <div>
        <button type="button" onClick={handleSignout}>
          Logout
        </button>
      </div>
      <pre>{JSON.stringify(authSession, null, 2)}</pre>
      <Outlet />
    </div>
  );
}
