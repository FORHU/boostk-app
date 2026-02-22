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

function ChatWidget() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const { apiKey } = Route.useRouteContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. SCROLL LOGIC (Restored and improved)
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
    if (!activeTicketId) return;

    const controller = new AbortController();

    const connect = async () => {
      try {
        const response = await elysiaClient.api.notification
          .listen({ channelId: activeTicketId })
          .get({ fetch: { signal: controller.signal } });

        if (response.error) return;

        const stream = response.data as unknown as AsyncIterable<{ data: string }>;
        for await (const chunk of stream) {
          const parsed = JSON.parse(chunk.data);

          // Filter out heartbeats and system connection messages
          if (parsed.type === "heartbeat" || parsed.message === "connected") continue;

          setMessages((prev) => {
            // Prevent duplicate messages if the broadcast echoes back to the sender
            if (prev.find((m) => m.id === parsed.id)) return prev;

            return [
              ...prev,
              {
                id: parsed.id || Date.now().toString(),
                text: parsed.content || parsed.message, // handle both formats
                sender: (parsed.senderType || "AGENT").toLowerCase(),
                timestamp: parsed.createdAt || new Date().toISOString(),
              },
            ];
          });
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("SSE Error:", err);
      }
    };

    connect();
    return () => controller.abort();
  }, [activeTicketId]);

  // 4. LEAD SUBMIT (Creates ticket & opens SSE)
  const handleLeadSubmit = async (data: { name: string; email: string }) => {
    try {
      const ticket = await createTicket({
        data: { apiKey, name: data.name, email: data.email },
      });

      setActiveTicketId(ticket.id);
      setIsLeadCaptured(true);
      setShowForm(false);

      // Local confirmation messages
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
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeTicketId) return;

    const userMsg = {
      id: `temp-${Date.now()}`, // Temporary ID for Optimistic UI
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    // Optimistic Update: Show message immediately
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      await elysiaClient.api.notification.broadcast({ channelId: activeTicketId }).post({ message: currentInput });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden border border-gray-200">
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

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth pb-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            const isSameGroup = (m1: any, m2: any) => {
              if (!m1 || !m2) return false;
              if (m1.sender !== m2.sender) return false;
              return Math.abs(new Date(m2.timestamp).getTime() - new Date(m1.timestamp).getTime()) <= 30000;
            };

            const isStart = !isSameGroup(prevMsg, msg);
            const isEnd = !isSameGroup(msg, nextMsg);

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
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
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
          })}
        </AnimatePresence>
      </main>

      <footer className="flex-none">
        <AnimatePresence mode="wait">
          {showForm && !isLeadCaptured ? (
            <LeadForm key="lead-form" onSubmit={handleLeadSubmit} />
          ) : isLeadCaptured ? (
            <motion.div
              key="chat-input"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-3 bg-white border-t border-gray-100"
            >
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
          ) : null}
        </AnimatePresence>
      </footer>
    </div>
  );
}
