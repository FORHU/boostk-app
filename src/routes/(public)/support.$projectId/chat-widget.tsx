import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import type { Project, Ticket, TicketMessage } from "prisma/generated/client";
import { Suspense, useEffect, useState } from "react";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import TicketCustomerForm from "@/components/chat-support/TicketCustomerForm";
import { socket } from "@/lib/socket";
import { getTicketCookieFn } from "@/modules/ticket/ticket.functions";
import { createCustomerTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

export const Route = createFileRoute("/(public)/support/$projectId/chat-widget")({
  beforeLoad: async ({ params }) => {
    // using projectFunctions since the import was replaced accidentally
    const { getProjectPublicFn } = await import("@/modules/project/project.functions");
    const project = await getProjectPublicFn({ data: { projectId: params.projectId } });
    if (!project) throw notFound();

    const ticket = await getTicketCookieFn();

    return { project, ticket };
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(ticketMessageQueries.getCustomerTicketMessages());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { project, ticket } = Route.useRouteContext();

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden">
      <ChatHeader project={project} />

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

const ChatHeader = ({ project }: { project: Project }) => {
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
      <Sparkles size={16} className="text-indigo-300" />
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
