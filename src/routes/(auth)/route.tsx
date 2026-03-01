import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: ({ context }) => {
    if (context.authSession) {
      throw redirect({ to: "/organization" });
    }

    return {
      authSession: context.authSession,
    };
  },
});
