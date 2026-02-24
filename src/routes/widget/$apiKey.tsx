import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
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
        {/* Customer viewing their own message */}
        {msg.sender === "user" ? (
          <>
            <p className="whitespace-pre-wrap">{msg.text}</p>
            {msg.translatedText && (
              <p className="mt-1 text-[11px] italic opacity-80 whitespace-pre-wrap text-indigo-200">
                Translated: {msg.translatedText}
              </p>
            )}
            {!msg.translatedText &&
              msg.sourceLang?.split("-")[0] !== msg.targetLang?.split("-")[0] &&
              msg.sourceLang && (
                <p className="mt-1 text-[10px] italic opacity-60 flex items-center gap-1 text-indigo-200">
                  <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></span> Translating...
                </p>
              )}
          </>
        ) : (
          /* Customer viewing incoming Agent/Bot message */
          <>
            <p className="whitespace-pre-wrap">
              {
                msg.translatedText === "__TRANSLATION_ERROR__" ||
                (!msg.translatedText &&
                  msg.sourceLang?.split("-")[0] !== msg.targetLang?.split("-")[0] &&
                  msg.sourceLang)
                  ? msg.text // While loading or on error: Show original text as main
                  : msg.translatedText || msg.text // When complete or no translation needed: Show translated text as main
              }
            </p>

            {/* Bottom auxiliary text */}
            {msg.translatedText === "__TRANSLATION_ERROR__" ? (
              <p className="mt-1 text-[11px] italic opacity-80 whitespace-pre-wrap text-red-500">Translation error</p>
            ) : !msg.translatedText &&
              msg.sourceLang?.split("-")[0] !== msg.targetLang?.split("-")[0] &&
              msg.sourceLang ? (
              <p className="mt-1 text-[10px] italic opacity-80 flex items-center gap-1 text-gray-500">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></span> Translating...
              </p>
            ) : msg.translatedText && msg.targetLang?.split("-")[0] !== "en" ? (
              <p className="mt-1 text-[11px] italic opacity-70 whitespace-pre-wrap text-gray-500">
                Original: {msg.text}
              </p>
            ) : null}
          </>
        )}
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
  const [input, setInput] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string>();
  const [customerId, setCustomerId] = useState<string>();
  const [browserLanguage, setBrowserLanguage] = useState<string | null>(null);
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
      // Fast local i18n lookup instead of API call
      const baseLang = targetLang.split("-")[0];
      let translated = "";

      // Only look up translation if not English
      if (baseLang !== "en") {
        if (name && refId) {
          translated = getConfirmationTranslation(name, refId, targetLang);
        } else {
          translated = uiTranslations[text]?.[targetLang] || uiTranslations[text]?.[baseLang];
        }
      }

      // Always resolve the message — use translation if found, otherwise original text.
      // This prevents messages from being stuck in "Translating..." forever.
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  translatedText: translated || text,
                }
              : msg,
          ),
        );
      }, 300);
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
  // Wait until browser language is detected (not null) before showing initial message
  useEffect(() => {
    if (browserLanguage === null) return;

    const timer = setTimeout(() => {
      const initialId = "initial";
      const text = "Hi! Please introduce yourself to start the chat.";

      const lang = browserLanguage ?? "en";
      setMessages([
        {
          id: initialId,
          text,
          sender: "bot",
          timestamp: new Date().toISOString(),
          sourceLang: "en",
          targetLang: lang,
        },
      ]);
      setShowForm(true);

      if (lang !== "en" && !lang.startsWith("en-")) {
        translateText(text, lang, initialId);
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

  // 4. LEAD SUBMIT
  const handleLeadSubmit = async (data: { name: string; email: string }) => {
    try {
      const ticket = await createTicket({
        data: { apiKey, name: data.name, email: data.email, browserLanguage: browserLanguage ?? "en" },
      });

      setActiveTicketId(ticket.id);
      setCustomerId(ticket.customerId);
      setIsLeadCaptured(true);
      setShowForm(false);

      const now = new Date().toISOString();
      const confId = `conf-${Date.now()}`;
      const noteId = `note-${Date.now()}`;
      const confText = `Thanks, ${data.name}! Your reference: ${ticket.referenceId}`;
      const noteText = "How can I help you today?";
      const lang = browserLanguage ?? "en";

      setMessages((prev) => [
        ...prev,
        {
          id: confId,
          text: confText,
          sender: "bot",
          timestamp: now,
          sourceLang: "en",
          targetLang: lang,
        },
        {
          id: noteId,
          text: noteText,
          sender: "bot",
          timestamp: now,
          sourceLang: "en",
          targetLang: lang,
        },
      ]);

      if (lang !== "en" && !lang.startsWith("en-")) {
        translateText(confText, lang, confId, data.name, ticket.referenceId);
        translateText(noteText, lang, noteId);
      }
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
