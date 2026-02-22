import { Send, Star } from "lucide-react";

export function ChatBox({ ticket }: { ticket: any }) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Chat Support</h1>
          <div className="text-xs text-gray-500 font-mono mt-0.5">ROOM_{ticket?.referenceId || "LOADING..."}</div>
        </div>
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
        >
          <Star size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {/* System Message */}
        <div className="flex justify-center">
          <span className="text-xs font-medium text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {/* Agent Message (Mock) */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 mb-1 mr-1">Chloe Moody</span>
          <div className="max-w-[80%] bg-blue-500 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
            <p className="text-[15px] leading-relaxed">안녕하세요! 연락 주셔서 감사합니다! 어떻게 도와드릴까요?</p>
            <div className="mt-3 pt-3 border-t border-blue-400/30">
              <p className="text-xs text-blue-100 italic">
                original: Hello! Thanks for reaching out! How can I assist you today?
              </p>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 mr-1">10:29 AM</span>
        </div>

        {/* Customer Message (Mock) */}
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 mb-1 ml-1">{ticket?.customer?.name || "Customer"}</span>
          <div className="max-w-[80%] bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-sm shadow-sm">
            <p className="text-[15px] leading-relaxed">
              Hey Chloe, thanks for your words. I really appreciate that. I need help in my billing information.
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                글로이, 좋은 말씀 감사합니다. 정말 감사드려요. 결제 정보 관련해서 도움이 필요해요.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 ml-1">10:30 AM</span>
        </div>

        {/* AI Suggestions (Mock) */}
        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Star size={12} className="text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-600 tracking-wider">AI SUGGESTIONS</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="text-left bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-gray-700"
            >
              Could you please elaborate on your question?
            </button>
            <button
              type="button"
              className="text-left bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-gray-700"
            >
              Let me check that information for you now.
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-xl leading-none">☺</span>
          </button>
          <textarea
            placeholder="Type Something...."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] py-2 text-sm text-gray-700 placeholder-gray-400"
            rows={1}
          />
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            Send <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
