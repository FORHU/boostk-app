import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) {
      throw redirect({ to: "/signin" });
    }

    return {
      authSession: context.authSession,
    };
  },
});
