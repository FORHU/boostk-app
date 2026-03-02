import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { elysiaClient } from "@/lib/elysia-client";
import { createTicket } from "@/modules/ticket/ticket.serverFn";
import { validateWidgetAccess } from "@/modules/widget/widget.service";
import { ChatHeader } from "@/routes/widget/-components/ChatHeader";
import { ChatInput } from "@/routes/widget/-components/ChatInput";
import { ChatMessageBubble } from "@/routes/widget/-components/ChatMessageBubble";
import { TicketForm } from "@/routes/widget/-components/TicketForm";

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
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  sender: MessageSender;
  timestamp: string;
}

// Hardcoded UI Translations (i18n)
const uiTranslations: Record<string, Record<string, string>> = {
  "Hi! Please introduce yourself to start the chat.": {
    ko: "안녕하세요! 채팅을 시작하려면 자신을 소개해 주세요.",
    "ko-KR": "안녕하세요! 채팅을 시작하려면 자신을 소개해 주세요.",
    es: "¡Hola! Por favor, preséntate para comenzar el chat.",
    fr: "Salut ! Veuillez vous présenter pour commencer la discussion.",
    de: "Hallo! Bitte stellen Sie sich vor, um den Chat zu starten.",
    ja: "こんにちは！チャットを始めるには、自己紹介をしてください。",
    zh: "你好！请做个自我介绍以开始聊天。",
  },
  // The exact confirmation text requires matching the dynamic part, so we use a function helper below for it
  "How can I help you today?": {
    ko: "오늘 무엇을 도와드릴까요?",
    "ko-KR": "오늘 무엇을 도와드릴까요?",
    es: "¿En qué puedo ayudarte hoy?",
    fr: "Comment puis-je vous aider aujourd'hui ?",
    de: "Wie kann ich Ihnen heute helfen?",
    ja: "今日はどのようなご用件でしょうか？",
    zh: "我今天能帮您什么忙？",
  },
};

const getConfirmationTranslation = (name: string, refId: string, lang: string) => {
  const baseLang = lang.split("-")[0];
  switch (baseLang) {
    case "ko":
      return `감사합니다, ${name}님! 참조 번호: ${refId}`;
    case "es":
      return `¡Gracias, ${name}! Tu referencia: ${refId}`;
    case "fr":
      return `Merci, ${name} ! Votre référence : ${refId}`;
    case "de":
      return `Danke, ${name}! Ihre Referenz: ${refId}`;
    case "ja":
      return `ありがとうございます、${name}さん！ 参照番号: ${refId}`;
    case "zh":
      return `谢谢，${name}！您的参考号：${refId}`;
    default:
      return `Thanks, ${name}! Your reference: ${refId}`;
  }
};

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [activeTicketId, setActiveTicketId] = useState<string>();
  const [customerId, setCustomerId] = useState<string>();
  const [browserLanguage, setBrowserLanguage] = useState<string>("en");
  console.log(browserLanguage);
  const { apiKey } = Route.useRouteContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 0. DETECT BROWSER LANGUAGE
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setBrowserLanguage(navigator.language || navigator.languages?.[0] || "en");
    }
  }, []);

  const translateText = useCallback(
    async (text: string, targetLang: string, messageId: string, name?: string, refId?: string) => {
      if (targetLang === "en" || targetLang.startsWith("en-")) return;

      // Fast local i18n lookup instead of API call
      const baseLang = targetLang.split("-")[0];
      let translated = "";

      if (name && refId) {
        translated = getConfirmationTranslation(name, refId, targetLang);
      } else {
        translated = uiTranslations[text]?.[targetLang] || uiTranslations[text]?.[baseLang];
      }

      if (translated) {
        // Simulate slight async delay to feel like the actual translation flow
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, translatedText: translated } : msg)),
          );
        }, 300);
      }
    },
    [],
  );

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
      const initialId = "initial";
      const text = "Hi! Please introduce yourself to start the chat.";

      setMessages([
        {
          id: initialId,
          text,
          sender: "bot",
          timestamp: new Date().toISOString(),
          sourceLang: "en",
          targetLang: browserLanguage,
        },
      ]);
      setShowForm(true);

      if (browserLanguage !== "en" && !browserLanguage.startsWith("en-")) {
        translateText(text, browserLanguage, initialId);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [browserLanguage, translateText]);

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
            // biome-ignore lint/suspicious/noExplicitAny: <TODO: type safety for SSE>
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
            const rawId = msgData.id || parsed.id || Date.now().toString();
            const existingIndex = prev.findIndex((m) => m.id === rawId);
            const backendSender = (msgData.senderType || parsed.senderType || "AGENT").toUpperCase();
            const senderRole: MessageSender = backendSender === "CUSTOMER" ? "user" : "agent";

            const newMessage = {
              id: rawId,
              text: msgData.content || msgData.message || parsed.content || parsed.message || "",
              translatedText: msgData.translatedContent || parsed.translatedContent,
              sourceLang: msgData.sourceLang || parsed.sourceLang,
              targetLang: msgData.targetLang || parsed.targetLang,
              sender: senderRole,
              timestamp: msgData.createdAt || parsed.createdAt || new Date().toISOString(),
            };

            // Replace if existing, otherwise append
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = newMessage;
              return updated;
            }

            return [...prev, newMessage];
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

  // 4. LEAD SUBMIT (using React Query mutate)
  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket, variables) => {
      setActiveTicketId(ticket.id);
      setCustomerId(ticket.customerId);
      setIsLeadCaptured(true);
      setShowForm(false);

      const now = new Date().toISOString();
      const confId = `conf-${Date.now()}`;
      const noteId = `note-${Date.now()}`;
      const confText = `Thanks, ${variables.data.name}! Your reference: ${ticket.referenceId}`;
      const noteText = "How can I help you today?";

      setMessages((prev) => [
        ...prev,
        {
          id: confId,
          text: confText,
          sender: "bot",
          timestamp: now,
          sourceLang: "en",
          targetLang: browserLanguage,
        },
        {
          id: noteId,
          text: noteText,
          sender: "bot",
          timestamp: now,
          sourceLang: "en",
          targetLang: browserLanguage,
        },
      ]);

      if (browserLanguage !== "en" && !browserLanguage.startsWith("en-")) {
        translateText(confText, browserLanguage, confId, variables.data.name, ticket.referenceId);
        translateText(noteText, browserLanguage, noteId);
      }
    },
    onError: (error) => {
      console.error("Failed to create ticket", error);
    },
  });

  const handleLeadSubmit = (data: { name: string; email: string }) => {
    createTicketMutation.mutate({
      data: { apiKey, name: data.name, email: data.email, browserLanguage },
    });
  };

  // 5. SEND MESSAGE
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !activeTicketId || !customerId) return;

    try {
      await elysiaClient.api.messages.post({
        ticketId: activeTicketId,
        content: message,
        senderId: customerId,
        senderType: "CUSTOMER",
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };
  console.log("test 1", messages);

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
            <TicketForm key="ticket-form" onSubmit={handleLeadSubmit} />
          ) : isLeadCaptured ? (
            <ChatInput key="chat-input" onSend={handleSendMessage} />
          ) : null}
        </AnimatePresence>
      </footer>
    </div>
  );
}
