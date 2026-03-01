import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { elysiaClient } from "@/lib/elysia-client";
import { useAppStore } from "@/store/app.store";
import { TopBar } from "../../../components/TopBar";
import { getProjectTickets } from "../../../modules/ticket/ticket.serverFn";
import { ChatBox } from "./-components/ChatBox";
import { CustomerInfoSidebar } from "./-components/CustomerInfoSidebar";
import { TicketDetailsSidebar } from "./-components/TicketDetailsSidebar";
import { TicketTabs } from "./-components/TicketTabs";
import { useChatSupportStore } from "./-store/chat-support.store";

export const Route = createFileRoute("/(app)/_organization/chat-support/")({
  component: RouteComponent,
  loader: async () => {
    // TODO: get project id from url
    // We can prefetch here if we want, but for simplicity we'll just use useQuery in the component
    return {};
  },
});

function RouteComponent() {
  const selectedProject = useAppStore((state) => state.selectedProject);
  const selectedOrganization = useAppStore((state) => state.selectedOrganization);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // SSE Store setup
  const lastSseEvent = useAppStore((state) => state.lastSseEvent);

  const context = Route.useRouteContext() as any;
  const agentId = context?.authSession?.user?.id || context?.authSession?.id || "agent_fallback";

  useEffect(() => {
    if (!selectedProject) {
      navigate({
        to: selectedOrganization ? "/organization/$organizationId" : "/organization",
        params: selectedOrganization ? { organizationId: selectedOrganization } : undefined,
      });
    }
  }, [selectedProject, selectedOrganization, navigate]);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["project-tickets", selectedProject?.id],
    queryFn: () => getProjectTickets({ data: { projectId: selectedProject?.id as string } }),
    enabled: !!selectedProject?.id,
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

  // Dynamic Topics Subscription
  useEffect(() => {
    const subscribeTopics = async () => {
      try {
        if (selectedProject?.id) {
          await elysiaClient.api.notification["active-topics"].add.post({
            agentId: `agent_${agentId}`,
            topicId: `project_${selectedProject.id}`,
          });
        }
        if (activeTicketId) {
          await elysiaClient.api.notification["active-topics"].add.post({
            agentId: `agent_${agentId}`,
            topicId: `ticket_${activeTicketId}`,
          });
        }
      } catch (err) {
        console.error("Failed to subscribe to topics", err);
      }
    };
    subscribeTopics();
  }, [selectedProject?.id, activeTicketId, agentId]);

  // Handle Real-Time Events
  useEffect(() => {
    if (lastSseEvent) {
      if (lastSseEvent.event === "heartbeat") return;
      if (lastSseEvent.event === "ticket_assigned" || lastSseEvent.event === "ticket_created") {
        queryClient.invalidateQueries({ queryKey: ["project-tickets", selectedProject?.id] });
      }
      if (lastSseEvent.event === "chat_message") {
        queryClient.invalidateQueries({ queryKey: ["ticket-messages", lastSseEvent.data.ticketId] });
      }
    }
  }, [lastSseEvent, queryClient, selectedProject?.id]);

  if (!isLoading && (!tickets || tickets.length === 0)) {
    return (
      <div className="flex flex-col h-full w-full bg-white font-sans text-gray-900 overflow-hidden">
        <TopBar breadcrumbs={[{ label: "Chat Support" }]} />
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
              <svg
                role="img"
                aria-label="Inbox"
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              There are no chat support tickets for this project yet. They will appear here when customers reach out.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
