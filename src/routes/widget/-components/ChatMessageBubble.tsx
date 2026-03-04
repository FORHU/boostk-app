import { motion } from "framer-motion";
import type { Message } from "../$apiKey";

export function ChatMessageBubble({ msg, isStart, isEnd }: { msg: Message; isStart: boolean; isEnd: boolean }) {
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

  const renderAuxiliaryText = () => {
    const { translatedText, text, sourceLang, targetLang } = msg;

    const hasError = translatedText === "__TRANSLATION_ERROR__";
    const isTranslating = !translatedText && sourceLang && sourceLang !== targetLang;

    const isShowingTranslation = translatedText && !hasError && sourceLang !== targetLang;

    const baseClass = "mt-1 text-[11px] italic opacity-80 whitespace-pre-wrap";

    if (hasError) {
      return <p className={`${baseClass} text-red-500`}>Translation error</p>;
    }

    if (isTranslating) {
      return (
        <p className={`${baseClass} text-[10px] text-gray-500 flex items-center gap-1`}>
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
          Translating...
        </p>
      );
    }

    if (isShowingTranslation) {
      return <p className={`${baseClass} text-gray-500 opacity-70`}>Original: {text}</p>;
    }

    return null;
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
            {!msg.translatedText && msg.sourceLang !== msg.targetLang && msg.sourceLang && (
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
                (!msg.translatedText && msg.sourceLang !== msg.targetLang && msg.sourceLang)
                  ? msg.text // While loading or on error: Show original text as main
                  : msg.translatedText || msg.text // When complete or no translation needed: Show translated text as main
              }
            </p>

            {renderAuxiliaryText()}
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
