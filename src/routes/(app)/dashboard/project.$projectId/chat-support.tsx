import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/chat-support")({
  component: ProjectChatSupportPage,
});

function ProjectChatSupportPage() {
  return (
    <div className="flex flex-col h-full">
      <TicketList />
      <div className="flex-1 flex flex-row border-2 border-blue-500">
        <TicketDetails />
        <ChatWindow />
        <CustomerDetails />
      </div>
    </div>
  );
}

const TicketList = () => {
  return <div className="h-10 border-2 border-red-500">ticket list</div>;
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
