import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { RouterBreadcrumb } from "@/components/layout/RouterBreadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    <div className="flex flex-col h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <RouterBreadcrumb />
            </div>
          </header>
          <div>
            <button type="button" onClick={handleSignout}>
              Logout
            </button>
          </div>
          <pre>{JSON.stringify(authSession, null, 2)}</pre>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
