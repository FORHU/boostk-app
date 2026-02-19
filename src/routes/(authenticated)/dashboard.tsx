import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(authenticated)/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { authSession } = Route.useRouteContext();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate({ to: "/signin" });
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold text-blue-600">{authSession.user.name}</span>!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm font-medium text-gray-500">Email</h2>
          <p>{authSession.user.email}</p>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm font-medium text-gray-500">Session ID</h2>
          <p className="truncate text-xs font-mono">{authSession.session.id}</p>
        </div>

        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm font-medium text-gray-500">Expires</h2>
          <p>{new Date(authSession.session.expiresAt).toLocaleDateString()}</p>
        </div>
      </div>

      <button type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
