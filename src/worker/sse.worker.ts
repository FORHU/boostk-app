/// <reference lib="webworker" />
import type { Message } from "@/notifier/core";

let eventSource: EventSource | null = null;
let activeUserId: string | null = null;
const broadcastChannel = new BroadcastChannel("boostk_sse_events");
let connectionCount = 0;

function logToTab(msg: string) {
  // Sending log to all tabs via BroadcastChannel
  broadcastChannel.postMessage({ type: "WORKER_LOG", msg });
}

function connect(userId: string, apiUrl: string) {
  if (eventSource && activeUserId !== userId) {
    console.log(`[Worker] 🔄 User changed: ${activeUserId} -> ${userId}. Closing old stream.`);
    logToTab(`Switching user to ${userId}.`);
    eventSource.close();
    eventSource = null;
  }

  if (eventSource) {
    console.log(`[Worker] ✅ EventSource already active for user: ${activeUserId}`);
    return;
  }

  activeUserId = userId;
  const url = `${apiUrl || ""}/api/notification/listen/agent_${userId}`;

  console.log(`[Worker] 🚀 Attempting SSE connection for user: ${userId}`);
  eventSource = new EventSource(url, { withCredentials: true });

  eventSource.onopen = () => {
    console.log(`[Worker] 🟢 SSE Connection Opened to: ${url}`);
    logToTab("SSE Connection Established");
  };

  eventSource.onmessage = (e: MessageEvent) => {
    console.log(`[Worker] 📥 Raw SSE data received:`, e.data);
    try {
      const data: Message = JSON.parse(e.data);
      console.log(`[Worker] 📤 Broadcasting parsed message to tabs:`, data.event);
      broadcastChannel.postMessage(data);
    } catch (err) {
      console.error("[Worker] ❌ Failed to parse SSE data", err);
      logToTab("Failed to parse SSE data");
    }
  };

  eventSource.onerror = (err) => {
    console.error(`[Worker] ⚠️ SSE Error. State: ${eventSource?.readyState}`, err);
    if (eventSource?.readyState === 2) {
      // CLOSED
      console.log("[Worker] 🔄 Connection closed. Retrying in 3s...");
      eventSource.close();
      eventSource = null;
      setTimeout(() => connect(userId, apiUrl), 3000);
    }
  };
}

(self as any).onconnect = (e: MessageEvent) => {
  const port = e.ports[0];
  connectionCount++;

  console.log(`[Worker] 🔌 New tab connected. Total tabs: ${connectionCount}`);

  port.onmessage = (event: MessageEvent) => {
    const { type, userId, apiUrl } = event.data;
    console.log(`[Worker_Port] 📩 Message from tab: ${type}`, { userId });

    if (type === "CONNECT") {
      connect(userId, apiUrl);
    } else if (type === "DISCONNECT") {
      connectionCount--;
      console.log(`[Worker] 🔌 Tab disconnected. Remaining tabs: ${connectionCount}`);
      if (connectionCount <= 0 && eventSource) {
        console.log("[Worker] 🛑 No active tabs. Closing SSE stream.");
        eventSource.close();
        eventSource = null;
        activeUserId = null;
        connectionCount = 0;
      }
    }
  };

  port.start();
};
