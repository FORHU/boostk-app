import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { memo, useRef, useState } from "react";
import TicketCustomerForm from "@/components/chat-support/CustomerForm";
import { getProjectPublicFn } from "@/modules/project/project.functions";
import { getTicketCookieFn, setTicketCookieFn } from "@/modules/ticket/ticket.functions";

export const Route = createFileRoute("/(public)/support/$projectId/chat-widget")({
  beforeLoad: async ({ params }) => {
    const project = await getProjectPublicFn({ data: { projectId: params.projectId } });
    if (!project) throw notFound();

    return { project };
  },
  loader: async () => {
    const ticket = await getTicketCookieFn();
    return { ticket };
  },
  component: ChatWidgetPage,
});

function ChatWidgetPage() {
  const { project } = Route.useRouteContext();
  const { ticket } = Route.useLoaderData();

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreateTicket = async () => {
    await setTicketCookieFn({ data: { value: "Test 5" } });
    await router.invalidate();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden">
      <ChatHeader />

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth pb-4">
        <p>Chat Here</p>
        <button type="button" onClick={handleCreateTicket}>
          Create Ticket
        </button>
      </main>

      <AnimatePresence>
        {!ticket ? (
          <motion.div
            key="ticket-form"
            initial={{ opacity: 0, y: 8 }}
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
            <ChatInput />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const ChatHeader = memo(function ChatHeader() {
  return (
    <header className="flex-none bg-indigo-600 p-4 text-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-400/30 p-2 rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold leading-none">Support Chat</h2>
          <span className="text-[10px] text-indigo-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            Always active
          </span>
        </div>
      </div>
      <Sparkles size={16} className="text-indigo-300" />
    </header>
  );
});

const ChatInput = () => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log("message", message);
      setMessage("");
    }
  };

  return (
    <div className="p-3 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
