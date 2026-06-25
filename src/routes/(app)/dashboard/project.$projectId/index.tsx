import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({

  component: ProjectPage,

});

function ProjectPage() {
  // Extract the dynamic projectId from the current URL route
  const { projectId } = Route.useParams();
  // State to manage whether the floating chat is open or closed
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="p-6 relative min-h-screen">

      <h1 className="text-2xl font-bold mb-4">Project Page</h1>
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Project details for testing RabbitMQ to SSE.
        </p>
      </div>
      {/* ----- FLOATING CHAT WIDGET UI ----- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    
        {/* Chat Window (Only renders when state is true) */}
        {isChatOpen && (
          <div className="mb-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* an iframe here to render the route you already built. This prevents CSS conflicts between your dashboard and the public widget.*/}
            <iframe
              src={`/support/${projectId}/chat-widget`}
              className="w-full h-full border-none bg-slate-50"
              title="Customer Support Chat"/>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center h-14 w-14"
          aria-label="Toggle Chat">
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </div>

  );}