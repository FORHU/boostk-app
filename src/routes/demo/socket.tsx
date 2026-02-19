import { treaty } from "@elysiajs/eden";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { env } from "@/env";
import type { App } from "@/modules";

const client = treaty<App>(env.VITE_APP_URL);

export const Route = createFileRoute("/demo/socket")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Use a Ref for the actual socket to avoid closure staleness
  // biome-ignore lint/suspicious/noExplicitAny: This is just an example
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("Attempting to connect...");

    const chat = client.ws.subscribe();
    socketRef.current = chat;

    chat.on("open", () => {
      setIsConnected(true);
      console.log("✅ Connected");
    });

    chat.on("message", (event) => {
      const incoming = typeof event.data === "string" ? event.data : JSON.stringify(event.data);

      setMessages((prev) => [...prev, incoming]);
    });

    chat.on("close", () => {
      setIsConnected(false);
      console.log("❌ Disconnected");
    });

    return () => {
      chat.close();
    };
  }, []);

  const sendMessage = () => {
    const socketWrapper = socketRef.current;

    // Access the real WebSocket instance inside the Eden wrapper
    const realSocket = socketWrapper?.ws;
    const currentState = realSocket?.readyState;

    if (input.trim() && realSocket && currentState === 1) {
      // We can use the wrapper's .send() or the realSocket.send()
      // Using the wrapper is better for type safety
      socketWrapper.send({ message: input });
      setMessages((prev) => [...prev, input]);
      setInput("");
    } else {
      console.log("Socket details:", {
        exists: !!realSocket,
        state: currentState, // This should now be 1
        input: input,
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        <span className="font-bold">Status: {isConnected ? "Connected" : "Connecting..."}</span>
      </div>

      <div className="border p-4 h-64 overflow-y-auto mb-4 bg-white rounded shadow-inner">
        {messages.map((msg, i) => (
          <div key={`${i}-${msg}`} className="mb-2 p-2 bg-blue-50 rounded">
            {msg}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border p-2 rounded"
          placeholder="Type something..."
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!isConnected}
          className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
