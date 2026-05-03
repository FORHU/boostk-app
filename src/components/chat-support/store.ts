import { useStore } from "@tanstack/react-store";
import { createStore } from "@tanstack/store";
import type { TicketWithCustomer } from "@/modules/ticket/ticket.types";

type ChatSupportState = {
  selectedTicket: TicketWithCustomer | null;
};

export const chatSupportStore = createStore<ChatSupportState>({
  selectedTicket: null,
});

export const useSelectedTicket = () => {
  return useStore(chatSupportStore, (state) => state.selectedTicket);
};

export const setSelectedTicket = (ticket: TicketWithCustomer | null) => {
  chatSupportStore.setState((state) => ({
    ...state,
    selectedTicket: ticket,
  }));
};
