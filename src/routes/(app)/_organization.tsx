import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/_organization")({
  beforeLoad: ({ context }) => {
    if (!context.authSession.user.organization) {
      throw redirect({ to: "/organization" });
    }

    return {
      authSession: {
        ...context.authSession,
        user: { ...context.authSession.user, organization: context.authSession.user.organization },
      },
    };
  },
  component: Outlet,
});
