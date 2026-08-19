// Stamps a unique build id into the built service worker so every deploy ships a
// changed sw.js — that byte change is what makes browsers detect the update and refresh
// the app-shell cache. Runs after `vite build` (see package.json "build" script).
// Safe no-op if the built file or the token is missing.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SW = join(ROOT, ".output", "public", "sw.js");

if (!existsSync(SW)) {
  console.warn(`stamp-sw: ${SW} not found — skipping (did the build run?)`);
  process.exit(0);
}

// Prefer the git commit (stable, traceable); fall back to a timestamp outside git/CI.
let id = "";
try {
  id = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {
  // not a git repo / git unavailable
}
if (!id) id = String(Date.now());

const src = readFileSync(SW, "utf8");
if (!src.includes("__BUILD_ID__")) {
  console.warn("stamp-sw: no __BUILD_ID__ token in sw.js — nothing to stamp");
  process.exit(0);
}
writeFileSync(SW, src.replaceAll("__BUILD_ID__", id));
console.log(`stamp-sw: sw.js cache version -> boostk-shell-${id}`);
