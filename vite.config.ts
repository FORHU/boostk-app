import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro({
      preset: "bun",
      plugins: ["./src/modules/plugins/rabbitmq.plugin.ts"],
      // Always let the browser/CDN revalidate the SW + manifest so PWA updates are picked
      // up promptly (the #1 "my PWA won't update" gotcha is a long-cached sw.js).
      routeRules: {
        "/sw.js": { headers: { "cache-control": "no-cache" } },
        "/manifest.json": { headers: { "cache-control": "no-cache" } },
      },
    }),
  ],
  build: {
    rollupOptions: {
      onLog(level, log, handler) {
        if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
        handler(level, log);
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/better-auth")) {
            return "vendor-better-auth";
          }
          if (id.includes("node_modules/zod")) {
            return "vendor-zod";
          }
        },
      },
    },
  },
});

export default config;
