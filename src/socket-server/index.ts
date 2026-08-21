import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_COOKIE_NAME } from "@/modules/ticket/ticket.constants";
import { startRealtimeRelay } from "./relay";

// Room membership is decided by credentials, never by what the client claims:
//
// - A valid better-auth session cookie joins the caller to their own `user:<id>` room
//   (their agent notification feed). The id comes from the session, so a client cannot
//   subscribe to someone else's stream by passing a different userId.
// - A ticket cookie whose reference number resolves to the requested ticket joins the
//   caller to that `ticket:<id>` room — the same bearer credential that authorizes
//   messaging on the conversation.
//
// A connection that establishes neither is rejected at handshake.
const SocketQuerySchema = z.object({
  ticketId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
});

/**
 * Origins allowed to open a credentialed socket. Browsers send `Origin` on every
 * cross-origin WebSocket/polling request, so this gates which sites can hold a live
 * feed. Header-less clients (health checks, curl) are still permitted through — they
 * carry no cookies and therefore establish no room membership anyway.
 */
const allowedOrigins = new Set(env.trustedOrigins);
if (env.BETTER_AUTH_URL) {
  allowedOrigins.add(new URL(env.BETTER_AUTH_URL).origin);
}
if (env.isDevelopment) {
  // Vite dev server defaults; TRUSTED_ORIGINS is only required in production.
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
}

/** Minimal RFC 6265 cookie reader for handshake headers. */
function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

const server = serve({ fetch: app.fetch, port: env.SOCKET_PORT });
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed"));
      }
    },
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const headers = new Headers(socket.handshake.headers as Record<string, string>);

    const origin = headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
      return next(new Error("Origin not allowed"));
    }

    const rawQuery = socket.handshake.query;
    const result = SocketQuerySchema.safeParse({
      ticketId: typeof rawQuery.ticketId === "string" ? rawQuery.ticketId : undefined,
    });
    const { ticketId } = result.success ? result.data : {};

    const session = await auth.api.getSession({ headers });
    const sessionUserId = session?.user.id ?? null;

    let ticketAuthorized = false;
    if (ticketId) {
      const referenceNumber = readCookie(headers.get("cookie"), TICKET_COOKIE_NAME);
      if (referenceNumber) {
        const ticket = await prisma.ticket.findFirst({
          where: { id: ticketId, referenceNumber },
          select: { id: true },
        });
        ticketAuthorized = Boolean(ticket);
      }
    }

    if (!sessionUserId && !ticketAuthorized) {
      return next(new Error("Unauthorized"));
    }

    if (sessionUserId) socket.join(`user:${sessionUserId}`);
    if (ticketId && ticketAuthorized) socket.join(`ticket:${ticketId}`);

    next();
  } catch (err) {
    console.error("[Socket.IO] Handshake auth failed:", err);
    next(err instanceof Error ? err : new Error("Handshake failed"));
  }
});

startRealtimeRelay(io).catch((err) => {
  console.error("[Socket.IO] Failed to start RabbitMQ relay:", err);
});

console.log(`🔌 Socket.io relay listening on http://localhost:${env.SOCKET_PORT}`);
