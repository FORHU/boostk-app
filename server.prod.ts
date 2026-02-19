import { backend } from "@/modules";
import Elysia from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { env } from "@/env";

const app = new Elysia()
  // Mount backend first (/ws and /api)
  .use(backend)
  // Serve static assets (frontend build)
  .use(staticPlugin({ assets: "./dist/client", prefix: "/", alwaysStatic: true }));

// Load TanStack Start handler
// @ts-ignore
const { default: handler } = await import("./dist/server/server.js");
app.all("*", async ({ request }) => {
  return await handler.fetch(request);
});

app.listen(3000, () => {
  console.log(`Server running on ${env.VITE_APP_URL}`);
});