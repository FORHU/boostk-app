import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "../../../components/TopBar";
import { getProjectTickets } from "../../../modules/ticket/ticket.serverFn";
import { ChatBox } from "./-components/ChatBox";
import { CustomerInfoSidebar } from "./-components/CustomerInfoSidebar";
import { TicketDetailsSidebar } from "./-components/TicketDetailsSidebar";
import { TicketTabs } from "./-components/TicketTabs";
import { useChatSupportStore } from "./-store/chat-support.store";

export const Route = createFileRoute("/(authenticated)/chat-support/")({
  component: RouteComponent,
  loader: async () => {
    // We can prefetch here if we want, but for simplicity we'll just use useQuery in the component
    return {};
  },
});

function RouteComponent() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["project-tickets"],
    queryFn: () => getProjectTickets(),
  });

  const activeTicketId = useChatSupportStore((state) => state.activeTicketId);
  const setActiveTicketId = useChatSupportStore((state) => state.setActiveTicketId);

  // Auto-select the first ticket if none is selected
  useEffect(() => {
    if (tickets && tickets.length > 0 && !activeTicketId) {
      setActiveTicketId(tickets[0].id);
    }
  }, [tickets, activeTicketId, setActiveTicketId]);

  const activeTicket = tickets?.find((t: any) => t.id === activeTicketId) || tickets?.[0];

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-gray-900 overflow-hidden">
      <TopBar breadcrumbs={[{ label: "Chat Support" }]} />
      <TicketTabs tickets={tickets || []} isLoading={isLoading} />

      {/* Main 3 Columns */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Left Column: Ticket Properties (Zendesk style) */}
        <TicketDetailsSidebar ticket={activeTicket} />

        {/* Middle Column: Chat Box */}
        <ChatBox ticket={activeTicket} />

        {/* Right Column: Customer Details (Zendesk style) */}
        <CustomerInfoSidebar ticket={activeTicket} />
      </div>
    </div>
  );
}
