import { createFileRoute } from "@tanstack/react-router";
import { getProjectById } from "@/modules/project/project.service";

// Per-project web app manifest for the customer chat widget.
//
// Why this is generated per project instead of being a static /manifest.json:
// `scope` is what decides how much of the site an installed PWA owns, and it must be a
// concrete URL path prefix. A single static manifest can only ever say `scope: "/"`, which
// is why installing used to swallow the whole site (landing page, dashboard, billing…).
// Scoping to `/support/<projectId>/` means the installed app contains the customer chat
// and nothing else — any link outside that prefix opens in the normal browser instead.
//
// It also gives each project its own installable identity: distinct `id`, and a home
// screen name taken from the project rather than "Boostk Support Dashboard".

// Home screen labels get truncated by the OS anyway; keep short_name genuinely short.
const SHORT_NAME_MAX = 12;

export const Route = createFileRoute("/(public)/support/$projectId/manifest")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { projectId: string } }) => {
        // Browsers refetch the manifest on their own schedule and surface failures as
        // "not installable", so fail with a clean status rather than an unhandled throw.
        let project: Awaited<ReturnType<typeof getProjectById>>;
        try {
          project = await getProjectById(params.projectId);
        } catch {
          return new Response("Service unavailable", { status: 503 });
        }
        if (!project) {
          return new Response("Not found", { status: 404 });
        }

        // Trailing slash matters: without it the scope prefix would also match sibling
        // paths like /support/<id>-other/.
        const scope = `/support/${project.id}/`;

        const manifest = {
          id: scope,
          name: `${project.name} Support`,
          short_name: project.name.slice(0, SHORT_NAME_MAX),
          description: project.description ?? `Chat with the ${project.name} support team.`,
          scope,
          start_url: `${scope}chat-widget`,
          display: "standalone",
          display_override: ["standalone", "minimal-ui"],
          theme_color: "#155dfc", // blue-600, matching the widget's chrome
          background_color: "#ffffff",
          lang: "en",
          dir: "ltr",
          categories: ["business", "productivity"],
          // Deliberately the Boostk icon set rather than `project.logo`: manifest icons
          // must declare accurate `sizes`/`type`, and an arbitrary uploaded logo has
          // neither. Serving per-project icons needs a resize pipeline first.
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: {
            "Content-Type": "application/manifest+json",
            // Short TTL: renaming a project should reach installed apps reasonably soon,
            // but this is hit on every widget load so it shouldn't be uncached.
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
