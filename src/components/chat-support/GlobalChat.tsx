import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { useEffect, useState } from "react";
import { BoostkLogo } from "@/components/BoostkLogo";
import IntakeCustomerForm from "@/components/chat-support/IntakeCustomerForm";
import TicketChatMessageBubble, {
  type TicketMessageWithAttachment,
} from "@/components/chat-support/TicketChatMessageBubble";
import { useToast } from "@/components/ui/toast";
import { useSocket } from "@/hooks/use-socket";
import { EventType } from "@/lib/notifier/core";
import { clearIntakeCookieFn, createIntakeMessageFn } from "@/modules/intake/intake.functions";
import { intakeQueries } from "@/modules/intake/intake.queries";

/**
 * The global (BOOSTK-wide) support conversation, with no layout of its own.
 *
 * Extracted from the `/chat` route so the same chat can run in two places: full-screen at
 * `/chat`, and inside the floating panel on the marketing site. It owns no routing and
 * reads no route context — the visitor's conversation comes from the intake cookie via
 * `intakeQueries.session()`, so it works wherever it is mounted.
 *
 * Uses `useQuery` rather than `useSuspenseQuery` deliberately: suspending here would
 * suspend whatever page hosts the panel, and the landing page must never blank out
 * because a chat request is in flight.
 */
export default function GlobalChat({ headerAction }: { headerAction?: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: ticket, isLoading: sessionLoading } = useQuery(intakeQueries.session());
  const { data: messages, isLoading: messagesLoading } = useQuery(intakeQueries.messages());

  const { lastMessage, status } = useSocket({ ticketId: ticket?.id, projectId: ticket?.projectId });
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lastMessage?.event === EventType.CHAT_MESSAGE) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    }
  }, [lastMessage, queryClient]);

  // Triage routed this conversation into a real project. The ticket this view is bound to
  // stops receiving messages, so refetch: `getIntakeSession` follows the handoff, moves
  // the cookie, and the socket re-subscribes to the new ticket's room.
  useEffect(() => {
    if (lastMessage?.event === EventType.TICKET_ROUTED) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    }
  }, [lastMessage, queryClient]);

  // If a ticket exists (intake complete), clear the initial message state
  useEffect(() => {
    if (ticket && initialMessage !== null) {
      setInitialMessage(null);
    }
  }, [ticket, initialMessage]);

  const isLoading = sessionLoading || messagesLoading;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <ChatHeader connectionStatus={ticket ? status : undefined} action={headerAction} />

      <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-slate-50 scroll-smooth">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : (
          <MessageList messages={messages ?? []} hasTicket={Boolean(ticket)} />
        )}
      </div>

      {ticket ? (
        <ChatInput ticketId={ticket.id} initialStatus={ticket.status} statusEvent={lastMessage} />
      ) : initialMessage !== null ? (
        <IntakeCustomerForm initialSubject={initialMessage} onCancel={() => setInitialMessage(null)} />
      ) : (
        <FakeChatInput onSubmit={setInitialMessage} />
      )}
    </div>
  );
}

const ChatHeader = ({
  connectionStatus,
  action,
}: {
  connectionStatus?: "connecting" | "connected" | "reconnecting";
  action?: React.ReactNode;
}) => {
  const isReconnecting = connectionStatus != null && connectionStatus !== "connected";

  return (
    <header className="flex-none bg-brand p-4 text-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <BoostkLogo className="size-9 shrink-0" variant="inverted" />
        <div className="min-w-0">
          {/* Never names the receiving project, before or after routing — which team picked
              the conversation up is not the visitor's concern. */}
          <h2 className="text-sm font-bold leading-none truncate">BOOSTK Support</h2>
          <span className="text-[10px] text-blue-200 flex items-center gap-1">
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
      {action}
    </header>
  );
};

const MessageList = ({ messages, hasTicket }: { messages: TicketMessageWithAttachment[]; hasTicket: boolean }) => {
  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <BoostkLogo className="size-14 mb-4 shadow-md" />
        <h3 className="font-semibold text-gray-900 text-sm">
          {hasTicket ? "Waiting for an agent" : "How can we help?"}
        </h3>
        <p className="text-gray-500 text-xs mt-1 max-w-[220px]">
          {hasTicket
            ? "Our support team will be with you shortly."
            : "Tell us who you are and what you need — we'll connect you with the right team."}
        </p>
      </motion.div>
    );
  }

  const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
    if (!m1 || !m2) return false;
    if (m1.userId !== m2.userId) return false;
    if (m1.customerId !== m2.customerId) return false;
    return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
  };

  return (
    <>
      {messages.map((msg, index) => (
        <TicketChatMessageBubble
          key={msg.id}
          msg={msg}
          isStart={!isSameGroup(messages[index - 1], msg)}
          isEnd={!isSameGroup(msg, messages[index + 1])}
        />
      ))}
    </>
  );
};

const ChatInput = ({
  ticketId,
  initialStatus,
  statusEvent,
}: {
  ticketId: string;
  initialStatus: string;
  statusEvent: { event: EventType; data: { ticketId?: string; status?: string } } | null;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (statusEvent?.event === EventType.TICKET_STATUS_CHANGED && statusEvent.data.ticketId === ticketId) {
      setStatus(statusEvent.data.status ?? initialStatus);
    }
  }, [statusEvent, ticketId, initialStatus]);

  // A routed conversation reopens under a new ticket; drop the stale CLOSED state the
  // handoff left behind so the composer does not show the "closed" panel mid-handoff.
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const createMessageMutation = useMutation({
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
      <div className="flex-none p-4 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="text-emerald-500 mb-2" size={22} />
        <h4 className="font-semibold text-gray-900 text-sm">This conversation has been closed</h4>
        <p className="text-xs text-gray-500 mt-1">Thank you for contacting BOOSTK support!</p>
        <button
          type="button"
          onClick={async () => {
            await clearIntakeCookieFn();
            await queryClient.invalidateQueries({ queryKey: intakeQueries.all });
          }}
          className="mt-3 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Start a new conversation
        </button>
      </div>
    );
  }

  return (
    <div className="flex-none p-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={createMessageMutation.isPending}
            className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!message.trim() || createMessageMutation.isPending}
            className="bg-brand text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

const FakeChatInput = ({ onSubmit }: { onSubmit: (message: string) => void }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="flex-none p-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-brand text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
