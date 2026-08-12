import { createMiddleware } from "@tanstack/react-start";

/**
 * Surfaces the raw request on context.
 *
 * Rate limiting has to derive a client key from proxy headers, and
 * `@tanstack/react-start/server` exposes no ambient request accessor in this version —
 * so the request has to travel through middleware the way `authMiddleware` does it.
 *
 * Lives in `lib` rather than in one module because every public surface needs it:
 * intake's `startIntakeChatFn` and the widget's `upsertTicketSessionFn` both key their
 * limits on the caller, and neither should be importing the other's middleware.
 */
export const requestMiddleware = createMiddleware().server(async ({ next, request }) => {
  return next({ context: { request } });
});
