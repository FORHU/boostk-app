import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import { z } from "zod";
import { env } from "@/env";
import { startRealtimeRelay } from "./relay";

const SocketQuerySchema = z.object({
  userId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
  projectId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
  ticketId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
});

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

const server = serve({ fetch: app.fetch, port: env.SOCKET_PORT });
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  const query = socket.handshake.query;
  const result = SocketQuerySchema.safeParse({
    userId: typeof query.userId === "string" ? query.userId : undefined,
    projectId: typeof query.projectId === "string" ? query.projectId : undefined,
    ticketId: typeof query.ticketId === "string" ? query.ticketId : undefined,
  });

  const { userId, projectId, ticketId } = result.success ? result.data : {};

  if (userId) socket.join(`user:${userId}`);
  if (projectId) socket.join(`project:${projectId}`);
  if (ticketId) socket.join(`ticket:${ticketId}`);
});

startRealtimeRelay(io).catch((err) => {
  console.error("[Socket.IO] Failed to start RabbitMQ relay:", err);
});

console.log(`🔌 Socket.io relay listening on http://localhost:${env.SOCKET_PORT}`);
