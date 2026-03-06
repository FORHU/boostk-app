import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { getProjectFn } from "@/modules/project/project.serverFn";
import { getTickets } from "@/modules/ticket/ticket.serverFn";
import { ProjectSidebar } from "../-components/ProjectSidebar";
import { ChatBox } from "./-components/ChatBox";
import { CustomerInfoSidebar } from "./-components/CustomerInfoSidebar";
import { EmptyTickets } from "./-components/EmptyTickets";
import { TicketDetailsSidebar } from "./-components/TicketDetailsSidebar";
import { TicketTabs } from "./-components/TicketTabs";
import { useChatSupportStore } from "./-store/chat-support.store";

export const Route = createFileRoute("/(app)/project/$projectId_/chat-support/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const project = await getProjectFn({ data: { projectId: params.projectId, includeOrganization: true } });
    if (!project) throw new Error("Project not found");

    const tickets = await getTickets({ data: { projectId: params.projectId, includeCustomer: true } });

    return { project, tickets };
  },
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { project, tickets } = Route.useLoaderData();

  const activeTicketId = useChatSupportStore((state) => state.activeTicketId);
  const setActiveTicketId = useChatSupportStore((state) => state.setActiveTicketId);

  useEffect(() => {
    if (tickets && tickets.length > 0 && !activeTicketId) {
      setActiveTicketId(tickets[0].id);
    }
  }, [tickets, activeTicketId, setActiveTicketId]);

  const activeTicket = tickets.find((t) => t.id === activeTicketId);

  if (!activeTicket)
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar>
          <div className="flex items-center gap-2">
            <Link to="/project/$projectId" params={{ projectId }} className="hover:text-gray-900 transition-colors">
              <p>{project.name}</p>
            </Link>
          </div>
        </TopBar>

        <div className="flex flex-1 overflow-hidden">
          <ProjectSidebar organizationId={project.organization?.id || ""} />
          <div className="flex flex-1 overflow-hidden bg-white border-red-500 border-2">
            <EmptyTickets />
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-gray-900 overflow-hidden">
      <TopBar>
        <div className="flex items-center gap-2">
          <Link to="/project/$projectId" params={{ projectId }} className="hover:text-gray-900 transition-colors">
            <p>{project.name}</p>
          </Link>
        </div>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar organizationId={project.organization?.id || ""} />

        <main className="flex flex-col flex-1 overflow-y-auto">
          <TicketTabs tickets={tickets} isLoading={false} />

          <div className="flex flex-1 overflow-hidden bg-white">
            <TicketDetailsSidebar ticket={activeTicket} />
            <ChatBox ticket={activeTicket} />
            <CustomerInfoSidebar ticket={activeTicket} />
          </div>
        </main>
      </div>
    </div>
  );
}
