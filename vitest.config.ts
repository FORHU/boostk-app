import viteReact from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] }), viteReact()],
  test: {
    environment: "node",
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
