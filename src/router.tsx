import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import NotFound from "@/components/layout/not-found";
import type { BreadcrumbValue } from "@/components/layout/RouterBreadcrumb";
import { SharedErrorComponent } from "@/components/ui/shared-error";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,

    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    notFoundMode: "root",

    // 2. Add the global error boundary here
    defaultErrorComponent: ({ error }) => <SharedErrorComponent error={error} />,

    defaultNotFoundComponent: () => <NotFound />,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }

  interface StaticDataRouteOption {
    breadcrumb?: BreadcrumbValue;
  }
}
