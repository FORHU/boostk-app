import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { Customer, Project, Ticket, TicketMessage } from "prisma/generated/client";
import { Suspense, useState } from "react";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { REDIRECT_REASON } from "@/enums/enums";
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
  const { project } = Route.useRouteContext();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithCustomer | null>(null);

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={<div className="p-2 text-sm text-muted-foreground">Loading project tickets...</div>}>
        <TicketList project={project} selectedTicket={selectedTicket} onSelect={setSelectedTicket} />
      </Suspense>
      <div className="flex-1 flex flex-row min-h-0 border-t">
        <TicketDetails ticket={selectedTicket} />
        <ChatWindow ticket={selectedTicket} />
        <CustomerDetails ticket={selectedTicket} />
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
    <div className="px-2 h-12 flex flex-row gap-2 overflow-x-auto items-end">
      {tickets.map((ticket) => {
        const active = selectedTicket?.id === ticket.id;
        return (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelect(ticket)}
            className={cn(
              "px-2 py-1 min-w-[200px] max-w-[240px] flex items-center justify-between rounded-t-lg border border-b-0 cursor-pointer transition-colors text-left",
              active ? "bg-background" : "bg-muted hover:bg-muted/70",
            )}
          >
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold truncate">{ticket.customer.name}</span>
              <span className="text-xs text-muted-foreground truncate">
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

const TicketDetails = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  return (
    <div className="h-full w-1/4 p-3 text-sm border-r">
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

const ChatWindow = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  const queryClient = useQueryClient();

  if (!ticket) {
    return (
      <div className="h-full w-1/2 flex items-center justify-center text-sm text-muted-foreground">
        Select a ticket to view the conversation
      </div>
    );
  }

  return (
    <div className="h-full w-1/2 flex flex-col min-h-0">
      <AgentMessageList ticket={ticket} />
      <ReplyInput
        ticketId={ticket.id}
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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-0.5 bg-muted/30">
      {list.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No messages yet</div>
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

const CustomerDetails = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  return (
    <div className="h-full w-1/4 p-3 text-sm border-l">
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
