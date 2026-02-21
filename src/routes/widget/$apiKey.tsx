import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  const { apiKey } = Route.useRouteContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = {
      msgCount: messages.length,
      formVisible: showForm,
      captured: isLeadCaptured,
    };

    if (scrollRef.current && trigger) {
      const scrollContainer = scrollRef.current;

      const timeoutId = setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, showForm, isLeadCaptured]);

  useEffect(() => {
    const now = new Date();
    setTimeout(() => {
      setMessages([
        {
          id: "initial_message",
          text: "Hi! Please introduce yourself to start the chat.",
          sender: "bot",
          timestamp: now.toISOString(),
        },
      ]);
      setShowForm(true);
    }, 1000);
  }, []);

  const handleLeadSubmit = async (data: { name: string; email: string; referenceNumber?: string }) => {
    console.log("Lead captured:", data, apiKey);

    const ticket = await createTicket({
      data: {
        apiKey: apiKey,
        name: data.name,
        email: data.email,
      },
    });

    console.log("Ticket created:", ticket);

    setShowForm(false);
    setIsLeadCaptured(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `confirmation_message`,
        text: `Thanks, ${data.name}! Your reference number is: ${ticket.referenceId}`,
        sender: "bot",
        timestamp: new Date().toISOString(),
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `note_message`,
          text: "Please keep an eye on your inbox. You'll need to confirm your email to continue this conversation using your reference number later.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 800);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `help_message`,
          text: "How can I help you today?",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    console.log("Message Sent:", input);
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
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
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth pb-0!">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            const isSameGroup = (m1: any, m2: any) => {
              if (!m1 || !m2) return false;
              if (m1.sender !== m2.sender) return false;
              const time1 = new Date(m1.timestamp).getTime();
              const time2 = new Date(m2.timestamp).getTime();
              return Math.abs(time2 - time1) <= 30000;
            };

            const isStart = !isSameGroup(prevMsg, msg);
            const isEnd = !isSameGroup(msg, nextMsg);

            // New Radius Logic based on your specific request
            const getRadiusClasses = () => {
              const isUser = msg.sender === "user";
              const isSingle = isStart && isEnd;

              if (isSingle) {
                return "rounded-2xl";
              }

              if (isUser) {
                // User Group Logic (Right side)
                if (isStart) return "rounded-2xl rounded-br-none"; // First in group
                if (isEnd) return "rounded-2xl rounded-tr-none"; // Last in group
                return "rounded-2xl rounded-tr-none rounded-br-none"; // Middle
              } else {
                // Bot Group Logic (Left side)
                if (isStart) return "rounded-2xl rounded-bl-none"; // First in group
                if (isEnd) return "rounded-2xl rounded-tl-none"; // Last in group
                return "rounded-2xl rounded-tl-none rounded-bl-none"; // Middle
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
                  className={`max-w-[85%] px-4 py-2 text-sm transition-all shadow-sm ${getRadiusClasses()} ${
                    msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border border-gray-100"
                  }`}
                >
                  {msg.text}
                </div>

                {isEnd && (
                  <span className="text-[10px] text-gray-400 mt-1 px-1 tracking-tight">
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
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all active:scale-95"
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
