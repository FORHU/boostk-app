import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, MessageCircle, PlusCircle, Send, Trash2 } from "lucide-react";
import type { Project, Ticket, TicketMessage } from "prisma/generated/client";
import { Suspense, useEffect, useState } from "react";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import TicketCustomerForm from "@/components/chat-support/TicketCustomerForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { socket } from "@/lib/socket";
import {
  getTicketCookieFn,
  getTicketSessionsCookieFn,
  removeTicketSessionFn,
  setTicketCookieFn,
} from "@/modules/ticket/ticket.functions";
import { createCustomerTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

export const Route = createFileRoute("/(public)/support/$projectId/chat-widget")({
  beforeLoad: async ({ params }) => {
    // using projectFunctions since the import was replaced accidentally
    const { getProjectPublicFn } = await import("@/modules/project/project.functions");
    const project = await getProjectPublicFn({ data: { projectId: params.projectId } });
    if (!project) throw notFound();

    const ticket = await getTicketCookieFn();
    const ticketSessions = await getTicketSessionsCookieFn();

    return { project, ticket, ticketSessions };
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(ticketMessageQueries.getCustomerTicketMessages());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { project, ticket, ticketSessions } = Route.useRouteContext();

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden">
      <ChatHeader project={project} activeTicket={ticket} ticketSessions={ticketSessions} />

      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 scroll-smooth pb-4">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading messages...</div>}>
          <TicketMessageList />
        </Suspense>
      </div>

      {!ticket ? (
        <motion.div
          key="ticket-form"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <TicketCustomerForm projectId={project.id} />
        </motion.div>
      ) : ticket ? (
        <motion.div
          key="chat-input"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <ChatListener ticket={ticket} />
          <ChatInput ticket={ticket} />
        </motion.div>
      ) : null}
    </div>
  );
}

const ChatHeader = ({
  project,
  activeTicket,
  ticketSessions,
}: {
  project: Project;
  activeTicket: Ticket | null;
  ticketSessions: (Ticket & { customer: { name: string | null } | null })[];
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSwitchSession = async (referenceNumber: string) => {
    await setTicketCookieFn({ data: { value: referenceNumber } });
    await queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    router.invalidate();
  };

  const handleRemoveSession = async (referenceNumber: string) => {
    await removeTicketSessionFn({ data: { referenceNumber } });
    if (activeTicket?.referenceNumber === referenceNumber) {
      await queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    }
    router.invalidate();
  };

  const handleNewSession = async () => {
    await setTicketCookieFn({ data: { value: "" } });
    await queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    router.invalidate();
  };

  return (
    <header className="flex-none bg-indigo-600 p-4 text-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-400/30 p-2 rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold leading-none">{project.name} Support Chat</h2>
          <span className="text-[10px] text-indigo-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            Always active
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                aria-label="Active sessions"
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 text-slate-200 text-left"
              >
                <div className="relative flex shrink-0">
                  <span className="text-sm font-medium mr-2">Sessions</span>

                  <MessageCircle size={20} className="text-indigo-300" />
                  {ticketSessions && ticketSessions.length > 0 && (
                    <span className="absolute top-0 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm translate-x-1/4 -translate-y-1/4">
                      {ticketSessions.length > 99 ? "99+" : ticketSessions.length}
                    </span>
                  )}
                </div>
              </button>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="bg-slate-800 text-slate-100 border-slate-700">
              <p>Sessions</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px] max-w-[calc(100vw-32px)]">
          {ticketSessions && ticketSessions.length > 0 ? (
            <div className="max-h-[250px] overflow-y-auto p-1">
              {ticketSessions.map((session) => (
                <div key={session.id} className="relative flex items-center group mb-1">
                  <DropdownMenuItem
                    className={`flex-1 flex-col items-start min-w-0 py-2 cursor-pointer focus:bg-slate-100 pr-10 ${activeTicket?.referenceNumber === session.referenceNumber ? "bg-indigo-50/50 text-indigo-900 border-l-2 border-indigo-500" : "pl-3 border-l-2 border-transparent"}`}
                    onClick={() => handleSwitchSession(session.referenceNumber)}
                  >
                    <div className="font-medium truncate w-full flex items-center gap-2 text-sm">
                      <span className="truncate">{session.customer?.name || "Unknown Sender"}</span>
                      {activeTicket?.referenceNumber === session.referenceNumber && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-px rounded-sm tracking-wider font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      #{session.referenceNumber.substring(0, 8)}
                    </span>
                  </DropdownMenuItem>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSession(session.referenceNumber);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors z-10"
                    title="Remove Session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">No recent sessions</div>
          )}
          <DropdownMenuSeparator />
          <div className="p-1">
            <DropdownMenuItem
              onClick={handleNewSession}
              className="cursor-pointer text-indigo-600 font-medium flex items-center justify-center gap-2 py-2"
            >
              <PlusCircle size={14} />
              <span>Start New Session</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

const TicketMessageList = () => {
  const { data: ticketMessages } = useSuspenseQuery(ticketMessageQueries.getCustomerTicketMessages());

  if (!ticketMessages) {
    return <div className="flex items-center justify-center h-full">Please create a ticket to start chatting</div>;
  }

  return (
    <>
      {ticketMessages.length === 0 ? (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex items-center justify-center h-full"
        >
          <p className="text-center text-gray-500 text-sm">No messages yet</p>
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

const ChatListener = ({ ticket }: { ticket: Ticket }) => {
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

  return null;
};

const ChatInput = ({ ticket }: { ticket: Ticket }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>("");

  const createTicketMessageMutation = useMutation({
    mutationKey: ticketMessageQueries.all,
    mutationFn: createCustomerTicketMessageFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
      if (data) {
        socket.emit("new_message", { room: ticket.id });
      }
    },
    onError: (error) => {
      console.log("error", error);
    },
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    createTicketMessageMutation.mutate({ data: { content: trimmed, contentType: "TEXT", ticketId: ticket.id } });
    setMessage("");
  };

  return (
    <div className="p-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!message.trim() || createTicketMessageMutation.isPending}
          className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
