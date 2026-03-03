import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChatHeader } from "@/routes/widget/-components/ChatHeader";
import { ChatInput } from "@/routes/widget/-components/ChatInput";
import { ChatMessageBubble } from "@/routes/widget/-components/ChatMessageBubble";

export const Route = createFileRoute("/demo-widget")({
  component: DemoChatWidget,
});

export type MessageSender = "bot" | "user" | "agent";

export interface Message {
  id: string;
  text: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  sender: MessageSender;
  timestamp: string;
}

function DemoChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    // if (!activeTicketId || !customerId) return; // check ticket form successfully submitted

    // Echo user's message immediately
    const userMsgTempId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgTempId,
        text: message,
        sender: "user",
        timestamp: new Date().toISOString(),
      },
    ]);
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

      {/* <footer className="flex-none">
        <AnimatePresence mode="wait">
          {showForm && !isLeadCaptured ? (
            <TicketForm key="ticket-form" onSubmit={handleLeadSubmit} />
          ) : isLeadCaptured ? (
            ) : null}
            </AnimatePresence>
            </footer> */}
      <ChatInput key="chat-input" onSend={handleSendMessage} />
    </div>
  );
}
