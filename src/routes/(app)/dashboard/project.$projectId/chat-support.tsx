import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Send, UserCircle2 } from "lucide-react";
import type { Project, Ticket } from "prisma/generated/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { ticketQueries } from "@/modules/ticket/query.queries";
import type { TicketWithCustomer } from "@/modules/ticket/ticket.types";
import { createUserTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/chat-support")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(ticketQueries.getProjectTickets(context.project.id));
    return {};
  },
  component: ProjectChatSupportPage,
});

function ProjectChatSupportPage() {
  const { project } = Route.useRouteContext();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithCustomer | null>(null);
  const queryClient = useQueryClient();

  // Listen for new tickets in this project
  useEffect(() => {
    socket.emit("join_room", `project_${project.id}`);

    const handleTicketCreated = () => {
      queryClient.invalidateQueries({ queryKey: ticketQueries.getProjectTickets(project.id).queryKey });
    };

    socket.on("ticket_list_updated", handleTicketCreated);

    return () => {
      socket.emit("leave_room", `project_${project.id}`);
      socket.off("ticket_list_updated", handleTicketCreated);
    };
  }, [project.id, queryClient]);

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 rounded-xl">
      <Suspense fallback={<div className="p-4 h-14">Loading project tickets...</div>}>
        <TicketList project={project} selectedTicket={selectedTicket} onSelectTicket={setSelectedTicket} />
      </Suspense>
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        <TicketDetails ticket={selectedTicket} />
        <ChatWindow ticket={selectedTicket} />
        <CustomerDetails ticket={selectedTicket} />
      </div>
    </div>
  );
}

const TicketList = ({
  project,
  selectedTicket,
  onSelectTicket,
}: {
  project: Project;
  selectedTicket: TicketWithCustomer | null;
  onSelectTicket: (ticket: TicketWithCustomer) => void;
}) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(project.id));

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      if (e.deltaY !== 0) {
        scrollRef.current.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
  };

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      className="px-2 h-14 flex flex-row gap-2 overflow-x-auto border-b bg-slate-50 items-center shrink-0"
    >
      {tickets.map((ticket) => (
        <div key={ticket.id} className="h-full py-2">
          <button
            type="button"
            onClick={() => onSelectTicket(ticket)}
            className={`group relative px-4 py-1.5 h-full min-w-[200px] max-w-[240px] flex items-center justify-between rounded-lg border cursor-pointer transition-all text-left ${selectedTicket?.id === ticket.id ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white hover:bg-slate-100 border-gray-200"}`}
          >
            <div className="flex flex-col truncate">
              <span
                className={`text-sm tracking-tight truncate ${selectedTicket?.id === ticket.id ? "font-bold text-indigo-700" : "font-semibold text-slate-800"}`}
              >
                {ticket.customer.name}
              </span>
              <span className="text-[8px] text-gray-500 truncate font-medium">
                Ticket #{ticket.referenceNumber?.slice(0, 8)}
              </span>
            </div>
            {ticket.status === "OPEN" && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>}
          </button>
        </div>
      ))}
    </div>
  );
};

const TicketDetails = ({ ticket }: { ticket: Ticket | null }) => {
  if (!ticket) return <div className="h-full w-1/4 border-r bg-slate-50 p-4"></div>;

  return (
    <div className="h-full w-1/4 border-r bg-slate-50 p-4 min-w-0 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-slate-800">Details</h3>
      <div className="space-y-4">
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase">Reference Number</span>
          <p className="text-sm font-medium">{ticket.referenceNumber}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase">Status</span>
          <p className="text-sm font-medium">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
            >
              {ticket.status}
            </span>
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase">Priority</span>
          <p className="text-sm font-medium capitalize">{ticket.priority.toLowerCase()}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase">Created On</span>
          <p className="text-sm font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = ({ ticket }: { ticket: Ticket | null }) => {
  if (!ticket) {
    return (
      <div className="h-full w-1/2 bg-white flex items-center justify-center border-r">
        <p className="text-gray-400 font-medium block">Select a ticket to view messages</p>
      </div>
    );
  }

  return (
    <div className="h-full w-1/2 flex flex-col bg-white border-r relative min-w-0">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center p-4">Loading messages...</div>}>
        <UserChatMessages ticket={ticket} />
      </Suspense>
      <UserChatInput ticket={ticket} />
    </div>
  );
};

const UserChatMessages = ({ ticket }: { ticket: Ticket }) => {
  const { data: messages } = useSuspenseQuery(ticketMessageQueries.getTicketMessages(ticket.id));
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.emit("join_room", ticket.id);

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.emit("leave_room", ticket.id);
      socket.off("receive_message", handleNewMessage);
    };
  }, [ticket.id, queryClient]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {messages.length === 0 ? (
        <div className="m-auto text-gray-400 text-sm">No messages yet. Say hi!</div>
      ) : (
        // TODO: add type structure to messages
        // biome-ignore lint/suspicious/noExplicitAny: <ticket message type is not properly typed>
        messages.map((msg: any) => {
          // If userId is present, it's an agent. If customerId, it's a customer.
          const isAgent = !!msg.userId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${isAgent ? "self-end items-end" : "self-start items-start"} `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-medium text-gray-500">
                  {isAgent ? msg.user?.name || "Agent" : msg.customer?.name || "Customer"}
                </span>
                <span className="text-[9px] text-gray-400">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-2xl text-sm ${isAgent ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}
              >
                {!isAgent && msg.translatedContent ? (
                  <div>
                    <div>{msg.translatedContent}</div>
                    <div className="text-[10px] mt-1 pt-1 border-t border-gray-200 text-gray-500">
                      Original: {msg.content}
                    </div>
                  </div>
                ) : isAgent && msg.translatedContent ? (
                  <div>
                    <div>{msg.content}</div>
                    <div className="text-[10px] mt-1 pt-1 border-t border-indigo-500 text-indigo-200">
                      Translated: {msg.translatedContent}
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const UserChatInput = ({ ticket }: { ticket: Ticket }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const createMessageMutation = useMutation({
    mutationFn: createUserTicketMessageFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
      if (data) {
        socket.emit("new_message", { room: ticket.id });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || createMessageMutation.isPending) return;

    createMessageMutation.mutate({ data: { ticketId: ticket.id, content: message.trim() } });
    setMessage("");
  };

  return (
    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!message.trim() || createMessageMutation.isPending}
          className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

const CustomerDetails = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  if (!ticket) return <div className="h-full w-1/4 bg-slate-50 p-4"></div>;

  return (
    <div className="h-full w-1/4 bg-slate-50 p-4 min-w-0 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-slate-800">Customer Details</h3>
      <div className="flex flex-col items-center mb-6">
        <UserCircle2 size={64} className="text-gray-300 mb-2" strokeWidth={1} />
        <h4 className="font-semibold">{ticket.customer.name || "Unknown Customer"}</h4>
        {ticket.customer.email && <p className="text-sm text-gray-500">{ticket.customer.email}</p>}
      </div>
    </div>
  );
};
