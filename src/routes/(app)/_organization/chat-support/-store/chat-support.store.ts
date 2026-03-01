import { create } from "zustand";

interface ChatSupportState {
  activeTicketId: string | null;
  setActiveTicketId: (id: string | null) => void;
}

export const useChatSupportStore = create<ChatSupportState>((set) => ({
  activeTicketId: null,
  setActiveTicketId: (id) => set({ activeTicketId: id }),
}));
