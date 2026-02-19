import Elysia from "elysia";
import { createServer } from "vite";
import { connect } from "elysia-connect-middleware";
import { backend } from "@/modules";
import { env } from "@/env";


const viteDevServer = await createServer({
  server: { middlewareMode: true },
});

const app = new Elysia()
  // Mount backend first (/ws and /api)
  .use(backend)
  // Mount vite middleware for HMR and asset serving
  .use(connect(viteDevServer.middlewares));

// Load TanStack Start handler via Vite SSR
const { default: serverEntry } = await viteDevServer.ssrLoadModule("./src/server.ts");
app.all("*", async ({ request }) => {
  return serverEntry.fetch(request);
});

app.listen(3000, () => {
  console.log(`Server running on ${env.VITE_APP_URL}`);
});