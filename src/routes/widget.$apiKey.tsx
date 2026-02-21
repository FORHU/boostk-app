import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { validateWidgetAccess } from "@/modules/widget/widget.service";

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
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! Welcome to our chat support. before we start, I'd like to get few details from you.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");

  // Initialize with null to satisfy React's ref requirements
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    // Referencing messages.length satisfies Biome's exhaustive-deps rule
    if (scrollRef.current && messages.length > 0) {
      const { scrollHeight, clientHeight } = scrollRef.current;

      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Mock Bot Response
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        text: "I received your message! This is a sample response from the widget.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white overflow-hidden border border-gray-200">
      {/* Header */}
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

      {/* Message Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}
      </main>

      {/* Input Area */}
      <footer className="flex-none p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
