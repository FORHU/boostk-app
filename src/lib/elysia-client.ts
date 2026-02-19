import { treaty } from "@elysiajs/eden";
import { env } from "@/env";
import type { App } from "@/modules";

export const elysiaClient = treaty<App>(env.VITE_APP_URL);
