import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Project, Ticket } from "prisma/generated/client";
import { Suspense } from "react";
import { ticketQueries } from "@/modules/ticket/query.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/chat-support")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(ticketQueries.getProjectTickets(context.project.id));
    return {};
  },
  component: ProjectChatSupportPage,
});

function ProjectChatSupportPage() {
  const { project } = Route.useRouteContext();

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={<div>Loading project tickets...</div>}>
        <TicketList project={project} />
      </Suspense>
      <div className="flex-1 flex flex-row border-2 border-blue-500">
        <TicketDetails />
        <ChatWindow />
        <CustomerDetails />
      </div>
    </div>
  );
}

const TicketList = ({ project }: { project: Project }) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(project.id));

  const handleSelectTicket = (ticket: Ticket) => {
    console.log("ticket", ticket);
  };

  return (
    <div className="px-2 h-12 flex flex-row gap-2 overflow-x-auto border-2 border-red-500">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="h-full bg-gray-200">
          <button
            type="button"
            onClick={() => handleSelectTicket(ticket)}
            className={
              "group relative px-2 py-1 min-w-[200px] max-w-[240px] flex items-center justify-between rounded-t-lg border border-b-0 cursor-pointer transition-colors text-left"
            }
          >
            <div className="flex flex-col truncate">
              <span className={"text-sm font-semibold truncate"}>{ticket.customer.name}</span>
              <span className="text-xs text-gray-500 truncate">Ticket #{ticket.referenceNumber.slice(0, 8)}</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

const TicketDetails = () => {
  return <div className="h-full w-1/4 border-2 border-green-500">Ticket Details window</div>;
};

const ChatWindow = () => {
  return <div className="h-full w-1/2 border-2 border-yellow-500">chat window</div>;
};

const CustomerDetails = () => {
  return <div className="h-full w-1/4 border-2 border-purple-500">Customer Details window</div>;
};
