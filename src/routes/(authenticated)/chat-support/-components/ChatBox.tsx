import { useInfiniteQuery } from "@tanstack/react-query";
import { Send, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { elysiaClient } from "@/lib/elysia-client";
import { useAppStore } from "@/store/app.store";

export function ChatBox({ ticket }: { ticket: any }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const context = useAppStore.getState();

  // Try to use a persistent user ID from wherever it's stored in the app
  const currentUserId = context?.authSession?.user?.id || context?.authSession?.id || "agent_fallback";

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["ticket-messages", ticket?.id],
    queryFn: async ({ pageParam }) => {
      const response = await elysiaClient.api.messages.ticket({ ticketId: ticket.id }).get({
        query: { cursor: pageParam as string | undefined },
      });
      if (response.error) {
        throw response.error;
      }
      return response.data || { messages: [], nextCursor: undefined };
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!ticket?.id,
  });

  // Pages are fetched backwards in time. We reverse the pages, and reverse the messages inside them
  // to get a standard chronological list (oldest top, newest bottom).
  const messages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => [...page.messages].reverse()) || [];

  // Scroll logic mirroring the widget but adapting for infinite scroll
  useEffect(() => {
    // Reference messages to ensure effect runs when it changes
    messages;

    if (!scrollRef.current) return;

    if (previousScrollHeight.current > 0) {
      // We just loaded older messages at the top, restore scroll position
      const newScrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
      previousScrollHeight.current = 0; // reset
    } else {
      // Initial load or a new message was appended -> auto scroll to bottom
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ticket?.id) return;

    const currentInput = input;
    setInput("");

    try {
      await elysiaClient.api.messages.post({
        ticketId: ticket.id,
        content: currentInput,
        senderId: currentUserId,
        senderType: "AGENT",
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleScroll = async () => {
    if (!scrollRef.current) return;

    // Check if scrolled to the absolute top to load older messages
    if (scrollRef.current.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      previousScrollHeight.current = scrollRef.current.scrollHeight;
      await fetchNextPage();
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-gray-500">
        Select a ticket to view conversation
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 bg-gray-50/30 flex flex-col space-y-6 scroll-smooth"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center my-2 py-4">
            <span className="text-xs text-gray-400">Loading older messages...</span>
          </div>
        )}
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center text-gray-400 text-sm">Loading messages...</div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex justify-center text-gray-400 text-sm">No messages yet.</div>
        )}

        {messages.map((msg: any) => {
          const isAgent = msg.senderType === "AGENT";
          const isSystem = msg.senderType === "SYSTEM";

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-1">
                <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm max-w-[80%] text-center">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}>
              <span className={`text-xs text-gray-500 mb-1 ${isAgent ? "mr-1" : "ml-1"}`}>
                {isAgent ? "Agent" : ticket?.customer?.name || "Customer"}
              </span>
              <div
                className={`max-w-[80%] p-4 shadow-sm ${
                  isAgent
                    ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              <span className={`text-[10px] text-gray-400 mt-1 ${isAgent ? "mr-1" : "ml-1"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"
        >
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <span className="text-xl leading-none">☺</span>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type Something...."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] py-2 text-sm text-gray-700 placeholder-gray-400"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            Send <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
