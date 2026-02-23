import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import { env } from "@/env";
import { betterAuthRoutes } from "@/modules/auth";
import { authMiddleware } from "@/modules/auth/service";
import { messageController } from "./message/message.controller";
import { notificationController } from "./notification/notification.controller";
import { organizationController } from "./organization/organization.controller";
import { projectController } from "./project/project.controller";
import { testController } from "./test/test-controller";

const ws = new Elysia().ws("/ws", {
  body: t.Object({
    message: t.String(),
  }),
  message(ws, { message }) {
    ws.publish("global-chat", message);
  },
  open(ws) {
    ws.subscribe("global-chat");
  },
});

const api = new Elysia({ prefix: "/api" })
  .use(authMiddleware)
  .all("/auth/*", betterAuthRoutes)
  .use(testController)
  .use(organizationController)
  .use(projectController)
  .use(notificationController)
  .use(messageController)
  .get("/user", ({ user }) => user, { auth: true })
  .get("/hello", ({ user }) => ({ message: `Hello from Elysia ${user.email}` }), { auth: true });

export const backend = new Elysia()
  .use(cors())
  .use(openapi({ enabled: env.VITE_APP_ENV === "local" || env.VITE_APP_ENV === "staging" }))
  .use(ws)
  .use(api);

export type App = typeof backend;
