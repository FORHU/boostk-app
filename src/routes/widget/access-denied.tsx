import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { ChatHeader } from "@/routes/widget/-components/ChatHeader";

export const Route = createFileRoute("/widget/access-denied")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col w-screen h-screen max-w-full max-h-screen bg-white overflow-hidden border border-gray-200">
      <ChatHeader />

      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-[250px]">
          You don't have permission to access this widget or it has been disabled for this domain.
        </p>
      </main>
    </div>
  );
}
