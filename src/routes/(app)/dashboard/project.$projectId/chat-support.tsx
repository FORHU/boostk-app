import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Info, Loader2, MessageCircle, User } from "lucide-react";
import type { Customer, Project, Ticket, TicketMessage } from "prisma/generated/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { EmptyState } from "@/components/ui/empty-state";
import { REDIRECT_REASON } from "@/enums/enums";
import { useSocket } from "@/hooks/use-socket";
import { useViewport } from "@/hooks/use-viewport";
import { EventType } from "@/lib/notifier/core";
import { cn } from "@/lib/utils";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { ticketQueries } from "@/modules/ticket/query.queries";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

type TicketWithCustomer = Ticket & { customer: Customer };

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/chat-support")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(ticketQueries.getProjectTickets(context.project.id));
    return {};
  },
  component: ProjectChatSupportPage,
});

function ProjectChatSupportPage() {
  const { project, authSession } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithCustomer | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const { isMobile } = useViewport();
  const isMobileView = isMobile ?? false;

  // Latest message timestamp per ticket we've already processed, so a socket
  // reconnect or duplicate event doesn't invalidate (and refetch) a conversation
  // it already has current data for.
  const lastSeenMessageAtRef = useRef<Record<string, number>>({});

  // Realtime: keep the open conversation and the ticket list fresh when new
  // events arrive over socket.io (agent dashboards do not send these messages).
  const { lastMessage } = useSocket({ userId: authSession?.user.id });

  useEffect(() => {
    if (!lastMessage) return;

    if (
      lastMessage.event === EventType.CHAT_MESSAGE &&
      selectedTicket &&
      lastMessage.data?.ticketId === selectedTicket.id
    ) {
      const ticketId = selectedTicket.id;
      const messageAt =
        typeof lastMessage.data.createdAt === "string" ? new Date(lastMessage.data.createdAt).getTime() : NaN;
      const lastSeen = lastSeenMessageAtRef.current[ticketId] ?? 0;
      if (!Number.isNaN(messageAt) && messageAt <= lastSeen) return;
      lastSeenMessageAtRef.current[ticketId] = messageAt;
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.getByTicket(ticketId).queryKey });
    }

    if (lastMessage.event === EventType.TICKET_CREATED) {
      queryClient.invalidateQueries({ queryKey: ticketQueries.getProjectTickets(project.id).queryKey });
    }
  }, [lastMessage, selectedTicket, queryClient, project.id]);

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={<div className="p-2 text-sm text-muted-foreground">Loading project tickets...</div>}>
        <TicketList project={project} selectedTicket={selectedTicket} onSelect={setSelectedTicket} />
      </Suspense>
      <div className="flex-none h-[87svh] flex flex-row min-h-0 border-t relative">
        {showTicketDetails && <TicketDetails ticket={selectedTicket} isMobile={isMobileView} />}
        <ChatWindow
          ticket={selectedTicket}
          showTicketDetails={showTicketDetails}
          showCustomerDetails={showCustomerDetails}
          onToggleTicketDetails={() => setShowTicketDetails((v) => !v)}
          onToggleCustomerDetails={() => setShowCustomerDetails((v) => !v)}
        />
        {showCustomerDetails && <CustomerDetails ticket={selectedTicket} isMobile={isMobileView} />}
        {isMobileView && (showTicketDetails || showCustomerDetails) && (
          <button
            type="button"
            aria-label="Close details panels"
            className="absolute inset-0 z-10 bg-black/20"
            onClick={() => {
              setShowTicketDetails(false);
              setShowCustomerDetails(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

interface TicketListProps {
  project: Project;
  selectedTicket: TicketWithCustomer | null;
  onSelect: (ticket: TicketWithCustomer) => void;
}

const TicketList = ({ project, selectedTicket, onSelect }: TicketListProps) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(project.id));

  return (
    <div className="px-2 min-h-12 flex flex-row gap-2 overflow-x-auto items-end">
      {tickets.map((ticket) => {
        const active = selectedTicket?.id === ticket.id;
        return (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelect(ticket)}
            className={cn(
              "px-2 py-1 min-w-[200px] max-w-[240px] flex items-center justify-between rounded-t-lg border border-b-0 cursor-pointer transition-colors text-left",
              active ? "bg-blue-600 dark:bg-blue-800 text-white" : "bg-muted hover:bg-muted/70",
            )}
          >
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold truncate">{ticket.customer.name}</span>
              <span className={cn("text-xs truncate", active ? "text-blue-200" : "text-muted-foreground")}>
                Ticket #{ticket.referenceNumber.slice(0, 8)}
                {ticket.customer.language ? ` · ${ticket.customer.language}` : ""}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const TicketDetails = ({ ticket, isMobile }: { ticket: TicketWithCustomer | null; isMobile: boolean }) => {
  return (
    <div
      className={cn(
        "p-3 text-sm border-r bg-background overflow-y-auto",
        isMobile ? "absolute left-0 top-0 bottom-0 z-20 w-72 max-w-[85vw] shadow-xl" : "h-full w-72 shrink-0",
      )}
    >
      {ticket ? (
        <>
          <div className="font-semibold">Ticket #{ticket.referenceNumber.slice(0, 8)}</div>
          <div className="text-muted-foreground">
            {ticket.status} · {ticket.priority}
          </div>
        </>
      ) : (
        <div className="text-muted-foreground">Ticket details</div>
      )}
    </div>
  );
};

interface ChatWindowProps {
  ticket: TicketWithCustomer | null;
  showTicketDetails: boolean;
  showCustomerDetails: boolean;
  onToggleTicketDetails: () => void;
  onToggleCustomerDetails: () => void;
}

const ChatWindow = ({
  ticket,
  showTicketDetails,
  showCustomerDetails,
  onToggleTicketDetails,
  onToggleCustomerDetails,
}: ChatWindowProps) => {
  const queryClient = useQueryClient();

  if (!ticket) {
    return (
      <div className="h-full flex-1 min-w-0 flex items-center justify-center text-sm text-muted-foreground">
        Select a ticket to view the conversation
      </div>
    );
  }

  return (
    <div className="h-full flex-1 min-w-0 flex flex-col min-h-0">
      <header className="flex-none bg-blue-600 dark:bg-blue-800 p-4 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* This header identifies the CUSTOMER the agent is talking to, so it stays a
              person icon — the BOOSTK mark belongs on the visitor's side of the chat. */}
          <div className="bg-blue-400/30 p-2 rounded-lg">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">{ticket.customer.name}</h2>
            <span className="text-[10px] text-blue-200 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  ticket.status === "OPEN" ? "bg-green-400" : "bg-gray-400"
                }`}
              ></span>
              {ticket.status === "OPEN" ? "Open" : "Closed"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTicketDetails}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showTicketDetails ? "bg-white/25 text-white" : "text-blue-200 hover:bg-white/10",
            )}
            title="Toggle ticket details"
            aria-pressed={showTicketDetails}
          >
            <Info size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleCustomerDetails}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showCustomerDetails ? "bg-white/25 text-white" : "text-blue-200 hover:bg-white/10",
            )}
            title="Toggle customer profile"
            aria-pressed={showCustomerDetails}
          >
            <User size={16} />
          </button>
        </div>
      </header>
      <AgentMessageList ticket={ticket} />
      <ReplyInput
        ticketId={ticket.id}
        projectId={ticket.projectId}
        customerName={ticket.customer.name}
        customerLanguage={ticket.customer.language}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ticketMessageQueries.getByTicket(ticket.id).queryKey,
          });
        }}
      />
    </div>
  );
};

// Two messages belong to the same visual group when same sender within 30s.
const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

const AgentMessageList = ({ ticket }: { ticket: TicketWithCustomer }) => {
  const { data: messages, isLoading } = useQuery(ticketMessageQueries.getByTicket(ticket.id));

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <Loader2 className="animate-spin text-blue-600" size={20} />
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 bg-slate-50 dark:bg-slate-900/50 scroll-smooth pb-4">
      {list.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <EmptyState
            icon={
              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-full">
                <MessageCircle className="text-blue-500 dark:text-blue-400" size={32} />
              </div>
            }
            title="Waiting for the customer"
            description="Replies from the customer will appear here."
            className="h-full p-6"
          />
        </motion.div>
      ) : (
        list.map((msg, index) => {
          const isStart = !isSameGroup(list[index - 1], msg);
          const isEnd = !isSameGroup(msg, list[index + 1]);
          return <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />;
        })
      )}
    </div>
  );
};

const CustomerDetails = ({ ticket, isMobile }: { ticket: TicketWithCustomer | null; isMobile: boolean }) => {
  return (
    <div
      className={cn(
        "p-3 text-sm border-l bg-background overflow-y-auto",
        isMobile ? "absolute right-0 top-0 bottom-0 z-20 w-72 max-w-[85vw] shadow-xl" : "h-full w-72 shrink-0",
      )}
    >
      {ticket ? (
        <>
          <div className="font-semibold">{ticket.customer.name}</div>
          <div className="text-muted-foreground">{ticket.customer.email}</div>
          <div className="text-muted-foreground">Language: {ticket.customer.language ?? "detecting…"}</div>
        </>
      ) : (
        <div className="text-muted-foreground">Customer details</div>
      )}
    </div>
  );
};
