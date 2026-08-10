import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { Project, TicketMessage } from "prisma/generated/client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { BoostkLogo } from "@/components/BoostkLogo";
import { AttachmentButton, AttachmentPreview } from "@/components/chat-support/attachment-picker";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import TicketCustomerForm from "@/components/chat-support/TicketCustomerForm";
import { useToast } from "@/components/ui/toast";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { useSocket } from "@/hooks/use-socket";
import { EventType, type Message } from "@/lib/notifier/core";
import { getProjectPublicFn } from "@/modules/project/project.functions";
import { clearTicketCookieFn, getTicketCookieFn } from "@/modules/ticket/ticket.functions";
import { createTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

// Optional `?ref=` label identifying which of a client's own projects/sites a chat came
// from, so one shared widget can still be split apart in the inbox. It is stored verbatim
// on `Customer.metadata`.
//
// SECURITY: this is a LABEL, not a permission. Anyone holding the link can edit it, so it
// must never gate access to anything — `projectId` remains the only trust boundary.
const REF_MAX = 64;

export const Route = createFileRoute("/(public)/support/$projectId/chat-widget")({
  validateSearch: z.object({
    ref: z.string().trim().min(1).max(REF_MAX).optional().catch(undefined),
  }),
  beforeLoad: async ({ params }) => {
    const project = await getProjectPublicFn({ data: { projectId: params.projectId } });
    if (!project) throw notFound();

    const ticket = await getTicketCookieFn({ data: { projectId: params.projectId } });

    return { project, ticket };
  },
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(ticketMessageQueries.getTicketMessages(params.projectId));
    // Surfaced so `head` can title the installed app after the project.
    return { projectName: context.project.name };
  },
  // This route is the ONLY installable surface in the app. The manifest link lives here
  // rather than in __root.tsx so the marketing site and the agent dashboard are not
  // offered for install at all — and so the manifest can be scoped per project.
  head: ({ params, loaderData }) => ({
    meta: [
      { title: loaderData?.projectName ? `${loaderData.projectName} Support` : "Support" },
      { name: "theme-color", content: "#4f46e5" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: loaderData?.projectName ?? "Support" },
    ],
    links: [{ rel: "manifest", href: `/support/${params.projectId}/manifest` }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { project, ticket } = Route.useRouteContext();
  const { ref } = Route.useSearch();
  const queryClient = useQueryClient();
  const [showSpinner, setShowSpinner] = useState(true);
  const { lastMessage, status } = useSocket({ ticketId: ticket?.id, projectId: project.id });

  // Realtime: refetch the message list whenever a new message arrives over
  // socket.io so agent replies appear without a manual refresh.
  useEffect(() => {
    if (lastMessage?.event === EventType.CHAT_MESSAGE) {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    }
  }, [lastMessage, queryClient]);

  // This effect forces the spinner to stay for at least 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden">
      <ChatHeader project={project} connectionStatus={ticket ? status : undefined} />

      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 scroll-smooth pb-4">
        {/* If the timer is still running, show the spinner, otherwise let Suspense handle it */}
        {showSpinner ? (
          <LoadingFallback />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <TicketMessageList projectId={project.id} />
          </Suspense>
        )}
      </div>

      {!ticket ? (
        <motion.div
          key="ticket-form"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <TicketCustomerForm projectId={project.id} sourceRef={ref} />
        </motion.div>
      ) : ticket ? (
        <motion.div
          key="chat-input"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <ChatInput
            ticketId={ticket.id}
            initialStatus={ticket.status}
            projectId={project.id}
            lastMessage={lastMessage}
          />
        </motion.div>
      ) : null}
    </div>
  );
}

const ChatHeader = ({
  project,
  connectionStatus,
}: {
  project: Pick<Project, "id" | "name" | "logo" | "description">;
  connectionStatus?: "connecting" | "connected" | "reconnecting";
}) => {
  const isReconnecting = connectionStatus != null && connectionStatus !== "connected";

  return (
    <header className="flex-none bg-indigo-600 p-4 text-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* The client's own logo when they have set one — this widget is embedded on their
            site and should look like theirs. The BOOSTK mark is the fallback. */}
        {project.logo ? (
          <img src={project.logo} alt="" aria-hidden className="size-9 shrink-0 rounded-full object-contain" />
        ) : (
          <BoostkLogo className="size-9 shrink-0" />
        )}
        <div>
          <h2 className="text-sm font-bold leading-none">{project.name} Support Chat</h2>
          <span className="text-[10px] text-indigo-200 flex items-center gap-1">
            {isReconnecting ? (
              <>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                {connectionStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Always active
              </>
            )}
          </span>
        </div>
      </div>
    </header>
  );
};

const TicketMessageList = ({ projectId }: { projectId: string }) => {
  const { data: ticketMessages } = useSuspenseQuery(ticketMessageQueries.getTicketMessages(projectId));

  if (!ticketMessages) return <div>No messages</div>;

  return (
    <>
      {ticketMessages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full text-center p-6"
        >
          <BoostkLogo className="size-16 mb-3" />
          <h3 className="font-semibold text-gray-900">Waiting for an agent</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-[200px]">Our support team will be with you shortly.</p>
        </motion.div>
      ) : (
        ticketMessages.map((msg, index) => {
          const prevMsg = ticketMessages[index - 1];
          const nextMsg = ticketMessages[index + 1];

          const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
            if (!m1 || !m2) return false;
            if (m1.userId !== m2.userId) return false;
            if (m1.customerId !== m2.customerId) return false;
            return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
          };

          const isStart = !isSameGroup(prevMsg, msg);
          const isEnd = !isSameGroup(msg, nextMsg);

          return <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} />;
        })
      )}
    </>
  );
};

interface ChatInputProps {
  ticketId: string;
  initialStatus: string;
  projectId: string;
  lastMessage: Message | null;
}

const ChatInput = ({ ticketId, initialStatus, projectId, lastMessage }: ChatInputProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState(initialStatus);

  const onUploadError = useCallback((error: string) => toast(error, "error"), [toast]);
  const { attachment, isUploading, upload, clear } = useAttachmentUpload({
    ticketId,
    projectId,
    onError: onUploadError,
  });

  // Listen for TICKET_STATUS_CHANGED events
  useEffect(() => {
    if (lastMessage?.event === EventType.TICKET_STATUS_CHANGED) {
      if (lastMessage.data.ticketId === ticketId) {
        setStatus(lastMessage.data.status);
      }
    }
  }, [lastMessage, ticketId]);

  const createTicketMessageMutation = useMutation({
    mutationKey: ticketMessageQueries.all,
    mutationFn: createTicketMessageFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    },
    onError: () => toast("Failed to send message. Please try again."),
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed && !attachment) return;

    try {
      // A message carries one contentType, so a file sent with a caption goes as
      // two messages — the attachment first.
      if (attachment) {
        await createTicketMessageMutation.mutateAsync({
          data: {
            content: attachment.url,
            contentType: attachment.contentType,
            attachmentId: attachment.id,
            ticketId,
            projectId,
          },
        });
        clear();
      }

      if (trimmed) {
        await createTicketMessageMutation.mutateAsync({
          data: { content: trimmed, contentType: "TEXT", ticketId, projectId },
        });
      }

      setMessage("");
    } catch {
      // onError already toasted; keep the draft so the customer does not retype it.
    }
  };

  if (status === "CLOSED") {
    return (
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
        <h4 className="font-semibold text-gray-900 text-sm">This conversation has been closed</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-[250px]">
          The agent has marked this issue as resolved. Thank you for contacting support!
        </p>
        <button
          type="button"
          onClick={async () => {
            await clearTicketCookieFn();
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
        {attachment && (
          <AttachmentPreview
            attachment={attachment}
            onRemove={clear}
            disabled={createTicketMessageMutation.isPending}
          />
        )}

        <div className="flex items-center gap-2">
          <AttachmentButton
            onSelect={upload}
            disabled={createTicketMessageMutation.isPending}
            isUploading={isUploading}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={createTicketMessageMutation.isPending}
            className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={(!message.trim() && !attachment) || createTicketMessageMutation.isPending || isUploading}
            className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
