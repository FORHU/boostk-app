import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { elysiaClient } from "@/lib/elysia-client";
import { createTicket } from "@/modules/ticket/ticket.serverFn";

type SSEChunk = { data: string };

export const Route = createFileRoute("/demo/sse/sample")({
  component: RouteComponent,
});

function RouteComponent() {
  const [channel, setChannel] = useState("example");
  const [inputChannel, setInputChannel] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");

  const connectToChannel = useCallback(async (channelId: string, signal: AbortSignal) => {
    setMessages([]);
    console.log("🚀 Connection attempt started...");

    try {
      const response = await elysiaClient.api.notification.listen({ channelId }).get({
        fetch: { signal },
      });

      if (response.error) {
        console.error("❌ Stream error:", response.error);
        return;
      }

      // CASTING: Tell TS this is an AsyncIterable of your chunk type
      const stream = response.data as unknown as AsyncIterable<SSEChunk>;

      if (stream && typeof stream === "object") {
        console.log("🌀 Starting stream iteration...");

        for await (const chunk of stream) {
          // chunk is now typed as SSEChunk
          const rawData = chunk?.data;

          if (!rawData) continue;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.type === "heartbeat") continue;

            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                time: new Date().toLocaleTimeString(),
                data: parsed,
              },
            ]);
          } catch (e) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                time: new Date().toLocaleTimeString(),
                data: rawData,
              },
            ]);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("stop: Stream aborted");
      } else {
        console.error("err: Iteration failed", err);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    connectToChannel(channel, controller.signal);
    return () => controller.abort();
  }, [connectToChannel, channel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // This part is working as per your confirmation
    await elysiaClient.api.notification.broadcast({ channelId: channel }).post({
      message: messageText,
    });

    setMessageText("");
  };

  const handleChannelSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputChannel.trim()) {
      setChannel(inputChannel.trim());
      setInputChannel("");
    }
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h3>SSE Test: {channel}</h3>
      <form onSubmit={handleChannelSwitch} style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
        <input value={inputChannel} onChange={(e) => setInputChannel(e.target.value)} placeholder="Channel..." />
        <button type="submit">Switch</button>
      </form>
      <hr />
      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc", marginBottom: "1rem" }}>
        <table style={{ width: "100%" }}>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td style={{ fontSize: "0.7rem", color: "#888", width: "80px" }}>{m.time}</td>
                <td>
                  <pre style={{ margin: 0 }}>{JSON.stringify(m.data, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
        <input value={messageText} onChange={(e) => setMessageText(e.target.value)} style={{ flexGrow: 1 }} />
        <button type="submit">Send</button>
      </form>

      <div>
        <button
          type="button"
          onClick={async () => {
            try {
              const ticket = await createTicket({
                data: {
                  apiKey: "ch-api-cmlyjz50r0001w4lpr666lcqe",
                  email: "test@example.com",
                  name: "John Test",
                },
              });

              console.log("Created ticket:", ticket);
            } catch (err) {
              console.error("Failed to create ticket:", err);
            }
          }}
        >
          Create Ticket
        </button>
      </div>
    </div>
  );
}
