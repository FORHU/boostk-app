import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { validateWidgetAccess } from "@/modules/widget/widget.service";
import { LeadForm } from "./widget/-components/LeadForm";

export const Route = createFileRoute("/widget/$apiKey")({
  beforeLoad: async ({ params }) => {
    const domain = typeof document !== "undefined" ? document.referrer : "";
    console.log("test 1", domain);
    const access = await validateWidgetAccess({
      data: { apiKey: params.apiKey, domain: domain },
    });

    return { widgetConfig: access.config };
  },
  component: ChatWidget,
});

function ChatWidget() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setMessages([
        {
          id: "init",
          text: "Hi! Please introduce yourself to start the chat.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowForm(true);
    }, 1000);
  }, []);

  const handleLeadSubmit = (data: { name: string; email: string }) => {
    console.log("Lead captured:", data);
    setShowForm(false);
    setIsLeadCaptured(true);

    // Add a confirmation message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: `Thanks ${data.name}! How can I help you today?`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            </motion.div>
          ))}
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
