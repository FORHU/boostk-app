import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { PwaUpdatePrompt } from "@/components/pwa-update-prompt";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authQueries } from "@/modules/auth/auth.queries";
import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('dark');root.classList.add('light');root.removeAttribute('data-theme');root.style.colorScheme='light';}catch(e){}})();`;

interface RootRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  beforeLoad: async ({ context }) => {
    const authSession = await context.queryClient.fetchQuery(authQueries.authUser());
    return { authSession };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Boostk" },
      { name: "description", content: "Boostk support dashboard — manage inboxes, projects, and organizations." },
      // PWA / installability
      { name: "theme-color", content: "#1447e6" },
      { name: "application-name", content: "Boostk" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Boostk" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", href: "/favicon-32.png", sizes: "32x32" },
      { rel: "icon", type: "image/png", href: "/favicon-16.png", sizes: "16x16" },
      { rel: "icon", type: "image/png", href: "/icon-192.png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: <it's a static script> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-red-500" suppressHydrationWarning>
        <ToastProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ToastProvider>

        <PwaUpdatePrompt />

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
