import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { type CreateTicketResponse, createTicket } from "@/modules/ticket/ticket.serverFn";
import { ChatHeader } from "@/routes/widget/-components/ChatHeader";
import { ChatInput } from "@/routes/widget/-components/ChatInput";
import { ChatMessageBubble } from "@/routes/widget/-components/ChatMessageBubble";
import { TicketForm } from "./widget/-components/TicketForm";

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

const getInitialMessage = (lang: string) => {
  switch (lang) {
    case "ko":
      return "안녕하세요! 채팅을 시작하려면 자신을 소개해 주세요.";
    case "es":
      return "¡Hola! Por favor, preséntate para comenzar el chat.";
    case "fr":
      return "Salut ! Veuillez vous présenter pour commencer la discussion.";
    case "de":
      return "Hallo! Bitte stellen Sie sich vor, um den Chat zu starten.";
    case "ja":
      return "こんにちは！チャットを始めるには、自己紹介をしてください。";
    case "zh":
      return "你好！请做个自我介绍以开始聊天。";
    default:
      return "Hi! Please introduce yourself to start the chat.";
  }
};
const getWelcomeMessage = (lang: string, name: string, referenceId: string) => {
  switch (lang) {
    case "ko":
      return `안녕하세요, ${name}님! 참조 번호는 ${referenceId}입니다`;
    case "es":
      return `Hola, ${name}. Tu número de referencia es ${referenceId}.`;
    case "fr":
      return `Salut, ${name}! Votre numéro de référence est ${referenceId}.`;
    case "de":
      return `Hallo, ${name}! Ihre Referenznummer lautet ${referenceId}.`;
    case "ja":
      return `こんにちは、${name}さん！参照番号は${referenceId}です`;
    case "zh":
      return `你好，${name}！您的参考号是${referenceId}`;
    default:
      return `Hi, ${name}! Your reference number is ${referenceId}`;
  }
};

const getHelpPrompt = (lang: string) => {
  switch (lang) {
    case "ko":
      return "무엇을 도와드릴까요?";
    case "es":
      return "¿En qué puedo ayudarte?";
    case "fr":
      return "Comment puis-je vous aider?";
    case "de":
      return "Wie kann ich Ihnen helfen?";
    case "ja":
      return "どんな御用でしょうか？";
    case "zh":
      return "今天我能帮您什么忙？";
    default:
      return "How can I help you today?";
  }
};

function DemoChatWidget() {
  const apiKey = "ch-api-cmlzm0zpw000101no0o5vhyua";
  const langTemp = "ko";
  // const langTemp = "en";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-message",
      text: getInitialMessage("en"),
      translatedText: getInitialMessage(langTemp),
      sourceLang: "en",
      targetLang: langTemp,
      sender: "bot",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(true);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);

  const [activeTicket, setActiveTicket] = useState<CreateTicketResponse>();

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLeadSubmit = (data: { name: string; email: string }) => {
    createTicketMutation.mutate({
      data: { apiKey, name: data.name, email: data.email, browserLanguage: langTemp },
    });
  };

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket, variables) => {
      console.log(ticket, variables);
      setActiveTicket(ticket);
      setIsLeadCaptured(true);
      setShowForm(false);

      setMessages((prev) => [
        ...prev,
        {
          id: "welcome-message",
          text: getWelcomeMessage("en", variables.data.name, ticket.referenceId),
          translatedText: getWelcomeMessage(langTemp, variables.data.name, ticket.referenceId),
          sourceLang: "en",
          targetLang: langTemp,
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
        {
          id: "help-prompt",
          text: getHelpPrompt("en"),
          translatedText: getHelpPrompt(langTemp),
          sourceLang: "en",
          targetLang: langTemp,
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    onError: (error) => {
      console.error("Failed to create ticket", error.message);
    },
  });

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
      </main>

      <footer className="flex-none">
        <AnimatePresence mode="wait">
          {showForm && !isLeadCaptured ? (
            <TicketForm key="ticket-form" onSubmit={handleLeadSubmit} />
          ) : isLeadCaptured ? (
            <ChatInput key="chat-input" onSend={handleSendMessage} />
          ) : null}
        </AnimatePresence>
      </footer>
    </div>
  );
}
