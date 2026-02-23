import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { elysiaClient } from "@/lib/elysia-client";
import { createTicket } from "@/modules/ticket/ticket.serverFn";
import { validateWidgetAccess } from "@/modules/widget/widget.service";
import { LeadForm } from "@/routes/widget/-components/LeadForm";

export const Route = createFileRoute("/widget/$apiKey")({
  beforeLoad: async ({ params }) => {
    const domain = typeof document !== "undefined" ? document.referrer : "";
    console.log("test 1", domain);
    const access = await validateWidgetAccess({
      data: { apiKey: params.apiKey, domain: domain },
    });

    return { apiKey: params.apiKey, widgetConfig: access.config };
  },
  component: ChatWidget,
});

export type MessageSender = "bot" | "user" | "agent";

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: string;
}

function ChatHeader() {
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
}

function ChatMessageBubble({ msg, isStart, isEnd }: { msg: Message; isStart: boolean; isEnd: boolean }) {
  const getRadiusClasses = () => {
    const isUser = msg.sender === "user";
    if (isStart && isEnd) return "rounded-2xl";
    if (isUser) {
      if (isStart) return "rounded-2xl rounded-br-none";
      if (isEnd) return "rounded-2xl rounded-tr-none";
      return "rounded-2xl rounded-tr-none rounded-br-none";
    } else {
      if (isStart) return "rounded-2xl rounded-bl-none";
      if (isEnd) return "rounded-2xl rounded-tl-none";
      return "rounded-2xl rounded-tl-none rounded-bl-none";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      layout
      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} ${!isEnd ? "mb-1" : "mb-4"}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2 text-sm shadow-sm ${getRadiusClasses()} ${
          msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border border-gray-100"
        }`}
      >
        {msg.text}
      </div>
      {isEnd && (
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </motion.div>
  );
}

function ChatInput({
  input,
  setInput,
  onSend,
}: {
  input: string;
  setInput: (val: string) => void;
  onSend: (e: React.FormEvent) => void;
}) {
  return (
    <motion.div
      key="chat-input"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="p-3 bg-white border-t border-gray-100"
    >
      <form onSubmit={onSend} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string>();
  const [customerId, setCustomerId] = useState<string>();

  const { apiKey } = Route.useRouteContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. SCROLL LOGIC
  useEffect(() => {
    // We reference these to ensure the effect runs when they change
    messages;
    showForm;

    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, showForm]);

  // 2. INITIAL DELAY FOR FORM
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "initial",
          text: "Hi! Please introduce yourself to start the chat.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
      setShowForm(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 3. SSE CONNECTION LOGIC
  useEffect(() => {
    if (!activeTicketId || !customerId) return;

    const controller = new AbortController();

    const connect = async () => {
      try {
        const response = await elysiaClient.api.notification
          .listen({ channelId: `ticket_${activeTicketId}` })
          .get({ fetch: { signal: controller.signal } });

        if (response.error) return;

        const stream = response.data as unknown as AsyncIterable<{ data: string }>;
        for await (const chunk of stream) {
          const rawData = chunk.data || chunk;
          if (!rawData) continue;

          // biome-ignore lint/suspicious/noExplicitAny: <TODO: type safety for SSE>
          let parsed: Record<string, any>;
          if (typeof rawData === "string") {
            try {
              parsed = JSON.parse(rawData);
            } catch {
              continue;
            }
          } else {
            parsed = rawData as Record<string, any>;
          }

          if (
            parsed.type === "heartbeat" ||
            parsed.message === "connected" ||
            parsed.event === "system" ||
            parsed.event === "heartbeat"
          )
            continue;

          const msgData = parsed.data || parsed;

          setMessages((prev) => {
            if (prev.find((m) => m.id === msgData.id || m.id === parsed.id)) return prev;

            const backendSender = (msgData.senderType || parsed.senderType || "AGENT").toUpperCase();
            const senderRole: MessageSender = backendSender === "CUSTOMER" ? "user" : "agent";

            return [
              ...prev,
              {
                id: msgData.id || parsed.id || Date.now().toString(),
                text: msgData.content || msgData.message || parsed.content || parsed.message || "",
                sender: senderRole,
                timestamp: msgData.createdAt || parsed.createdAt || new Date().toISOString(),
              },
            ];
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("SSE Error:", err);
        } else if (!(err instanceof Error)) {
          console.error("SSE Error:", err);
        }
      }
    };

    connect();
    return () => controller.abort();
  }, [activeTicketId, customerId]);

  // 4. LEAD SUBMIT
  const handleLeadSubmit = async (data: { name: string; email: string }) => {
    try {
      const ticket = await createTicket({
        data: { apiKey, name: data.name, email: data.email },
      });

      setActiveTicketId(ticket.id);
      setCustomerId(ticket.customerId);
      setIsLeadCaptured(true);
      setShowForm(false);

      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `conf-${Date.now()}`,
          text: `Thanks, ${data.name}! Your reference: ${ticket.referenceId}`,
          sender: "bot",
          timestamp: now,
        },
        { id: `note-${Date.now()}`, text: "How can I help you today?", sender: "bot", timestamp: now },
      ]);
    } catch (error) {
      console.error("Failed to create ticket", error);
    }
  };

  // 5. SEND MESSAGE
  const handleSendMessage = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeTicketId || !customerId) return;

    const currentInput = input;
    setInput("");

    try {
      await elysiaClient.api.messages.post({
        ticketId: activeTicketId,
        content: currentInput,
        senderId: customerId,
        senderType: "CUSTOMER",
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden border border-gray-200">
      <ChatHeader />

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth pb-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            const isSameGroup = (m1?: Message, m2?: Message) => {
              if (!m1 || !m2) return false;
              if (m1.sender !== m2.sender) return false;
              return Math.abs(new Date(m2.timestamp).getTime() - new Date(m1.timestamp).getTime()) <= 30000;
            };

            const isStart = !isSameGroup(prevMsg, msg);
            const isEnd = !isSameGroup(msg, nextMsg);

            return <ChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} />;
          })}
        </AnimatePresence>
      </main>

      <footer className="flex-none">
        <AnimatePresence mode="wait">
          {showForm && !isLeadCaptured ? (
            <LeadForm key="lead-form" onSubmit={handleLeadSubmit} />
          ) : isLeadCaptured ? (
            <ChatInput key="chat-input" input={input} setInput={setInput} onSend={handleSendMessage} />
          ) : null}
        </AnimatePresence>
      </footer>
    </div>
  );
}
