import { createFileRoute } from "@tanstack/react-router";
import GlobalChat from "@/components/chat-support/GlobalChat";
import { intakeQueries } from "@/modules/intake/intake.queries";

/**
 * Full-screen global support chat.
 *
 * The same conversation the floating launcher on the marketing site opens — this route is
 * the standalone surface for a direct link, a QR code, or a phone. Both render
 * `GlobalChat`, so the two can never drift apart.
 *
 * The conversation is resolved from the intake cookie inside the component rather than in
 * `beforeLoad`, which is what lets it be mounted anywhere, including over the landing page.
 */
export const Route = createFileRoute("/(public)/chat")({
  loader: ({ context }) => {
    // Warm both queries so the first paint has the conversation already in hand.
    context.queryClient.ensureQueryData(intakeQueries.session());
    context.queryClient.ensureQueryData(intakeQueries.messages());
  },
  head: () => ({
    meta: [
      { title: "BOOSTK Support" },
      { name: "theme-color", content: "#4f46e5" },
      { name: "description", content: "Chat with the BOOSTK support team." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-screen max-h-screen overflow-hidden">
      <GlobalChat />
    </div>
  );
}
