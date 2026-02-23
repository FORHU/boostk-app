import { create } from "zustand";
import type { Message } from "@/notifier/core";
import SSEWorker from "../worker/sse.worker.ts?sharedworker";

interface Project {
  id: string;
  name: string;
  apiKey: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  userAuth: any | null;
  selectedOrganization: string | null;
  selectedProject: Project | null;
  // Fixed: Use the Message type instead of any
  lastSseEvent: Message | null;
  setUserAuth: (user: any | null) => void;
  setSelectedOrganization: (orgId: string | null) => void;
  setSelectedProject: (project: Project | null) => void;
  initSSE: (userId: string) => void;
}

// FIX: Declare the variable here so the function can find it
let currentConnectedUserId: string | null = null;

export const useAppStore = create<AppState>()((set) => ({
  userAuth: null,
  selectedOrganization: null,
  selectedProject: null,
  lastSseEvent: null,
  setUserAuth: (user) => set({ userAuth: user }),
  setSelectedOrganization: (orgId) => set({ selectedOrganization: orgId }),
  setSelectedProject: (project) => set({ selectedProject: project }),

  initSSE: (userId: string) => {
    if (typeof window === "undefined") return;

    if (currentConnectedUserId === userId) {
      console.log(`[Zustand] ✋ Skip init: User ${userId} is already the active connection.`);
      return;
    }

    console.log(`[Zustand] 🏁 Initializing SSE for User: ${userId}`);
    currentConnectedUserId = userId;

    try {
      const sharedWorker = new SSEWorker();
      sharedWorker.port.start();

      const bc = new BroadcastChannel("boostk_sse_events");

      bc.onmessage = (e: MessageEvent<Message | { type: string; msg: string }>) => {
        const event = e.data;

        if ("event" in event && "data" in event) {
          console.log(`[Zustand] ✨ SSE Event Received & Stored:`, event.event);
          set({ lastSseEvent: event as Message });
        } else if ("type" in event && event.type === "WORKER_LOG") {
          console.log(`[Zustand] 📜 Worker Log:`, (event as any).msg);
        }
      };

      console.log(`[Zustand] 📤 Sending CONNECT command to Worker...`);
      sharedWorker.port.postMessage({
        type: "CONNECT",
        userId,
        apiUrl: import.meta.env.VITE_APP_URL,
      });

      window.addEventListener("beforeunload", () => {
        console.log(`[Zustand] 🚪 Page unloading. Notifying Worker.`);
        sharedWorker.port.postMessage({ type: "DISCONNECT" });
      });
    } catch (err) {
      console.error("[Zustand] ❌ Failed to initialize SharedWorker", err);
      currentConnectedUserId = null;
    }
  },
}));
