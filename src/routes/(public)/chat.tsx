import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { Suspense, useEffect, useState } from "react";
import IntakeCustomerForm from "@/components/chat-support/IntakeCustomerForm";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { useToast } from "@/components/ui/toast";
import { useSocket } from "@/hooks/use-socket";
import { EventType, type Message } from "@/lib/notifier/core";
import { clearIntakeCookieFn, createIntakeMessageFn, getIntakeSessionFn } from "@/modules/intake/intake.functions";
import { intakeQueries } from "@/modules/intake/intake.queries";

/**
 * The public global chat: one URL anyone can open, with no project link and no account.
 *
 * Conversations start in the BOOSTK intake queue and are routed to an organization's
 * project by staff. The visitor never sees that happen — after a handoff this same page
 * keeps working, because `getIntakeSession` follows the `routedTicket` link and re-points
 * the cookie on their next request.
 */
export const Route = createFileRoute("/(public)/chat")({
  beforeLoad: async () => {
    const ticket = await getIntakeSessionFn();
    return { ticket };
  },
  loader: ({ context }) => {
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
  const { ticket } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSpinner, setShowSpinner] = useState(true);

  const { lastMessage, status } = useSocket({ ticketId: ticket?.id, projectId: ticket?.projectId });

  useEffect(() => {
    if (lastMessage?.event === EventType.CHAT_MESSAGE) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    }
  }, [lastMessage, queryClient]);

  // Triage routed this conversation to a real project. The ticket the page is bound to
  // no longer receives messages, so reload the route: `getIntakeSession` will follow the
  // handoff, move the cookie, and re-subscribe the socket to the new ticket's room.
  useEffect(() => {
    if (lastMessage?.event === EventType.TICKET_ROUTED) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
      router.invalidate();
    }
  }, [lastMessage, queryClient, router]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden">
      <ChatHeader connectionStatus={ticket ? status : undefined} />

      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 scroll-smooth pb-4">
        {showSpinner ? (
          <LoadingFallback />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <IntakeMessageList hasTicket={Boolean(ticket)} />
          </Suspense>
        )}
      </div>

      {ticket ? (
        <motion.div
          key="chat-input"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <ChatInput ticketId={ticket.id} initialStatus={ticket.status} lastMessage={lastMessage} />
        </motion.div>
      ) : (
        <motion.div key="intake-form" initial={false} animate={{ opacity: 1, y: 0 }}>
          <IntakeCustomerForm />
        </motion.div>
      )}
    </div>
  );
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const ChatHeader = ({ connectionStatus }: { connectionStatus?: "connecting" | "connected" | "reconnecting" }) => {
  const isReconnecting = connectionStatus != null && connectionStatus !== "connected";

  return (
    <header className="flex-none bg-indigo-600 p-4 text-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-400/30 p-2 rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          {/* Intentionally never names the receiving project, before or after routing —
              which team picked the conversation up is not the visitor's concern. */}
          <h2 className="text-sm font-bold leading-none">BOOSTK Support</h2>
          <span className="text-[10px] text-indigo-200 flex items-center gap-1">
            {isReconnecting ? (
              <>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                {connectionStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Always active
              </>
            )}
          </span>
        </div>
      </div>
      <Sparkles size={16} className="text-indigo-300" />
    </header>
  );
};

const IntakeMessageList = ({ hasTicket }: { hasTicket: boolean }) => {
  const { data: messages } = useSuspenseQuery(intakeQueries.messages());

  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <div className="bg-indigo-50 p-4 rounded-full mb-3">
          <Sparkles className="text-indigo-500" size={32} />
        </div>
        <h3 className="font-semibold text-gray-900">{hasTicket ? "Waiting for an agent" : "How can we help?"}</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-[220px]">
          {hasTicket
            ? "Our support team will be with you shortly."
            : "Tell us who you are and what you need — we'll connect you with the right team."}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {messages.map((msg, index) => {
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
          if (!m1 || !m2) return false;
          if (m1.userId !== m2.userId) return false;
          if (m1.customerId !== m2.customerId) return false;
          return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
        };

        return (
          <TicketChatMessageBubble
            key={msg.id}
            msg={msg}
            isStart={!isSameGroup(prevMsg, msg)}
            isEnd={!isSameGroup(msg, nextMsg)}
          />
        );
      })}
    </>
  );
};

const ChatInput = ({
  ticketId,
  initialStatus,
  lastMessage,
}: {
  ticketId: string;
  initialStatus: string;
  lastMessage: Message | null;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (lastMessage?.event === EventType.TICKET_STATUS_CHANGED && lastMessage.data.ticketId === ticketId) {
      setStatus(lastMessage.data.status);
    }
  }, [lastMessage, ticketId]);

  // A routed conversation reopens under the new ticket; drop the stale CLOSED state the
  // handoff left behind so the composer does not show the "closed" panel mid-handoff.
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const createMessageMutation = useMutation({
    mutationKey: intakeQueries.all,
    mutationFn: createIntakeMessageFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intakeQueries.all }),
    onError: (error) => toast(error instanceof Error ? error.message : "Failed to send message.", "error"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      await createMessageMutation.mutateAsync({ data: { content: trimmed, contentType: "TEXT", ticketId } });
      setMessage("");
    } catch {
      // onError already toasted; keep the draft so the visitor does not retype it.
    }
  };

  if (status === "CLOSED") {
    return (
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
        <h4 className="font-semibold text-gray-900 text-sm">This conversation has been closed</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-[250px]">Thank you for contacting BOOSTK support!</p>
        <button
          type="button"
          onClick={async () => {
            await clearIntakeCookieFn();
            router.invalidate();
          }}
          className="mt-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Start a new conversation
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={createMessageMutation.isPending}
            className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!message.trim() || createMessageMutation.isPending}
            className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
