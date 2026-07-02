import { createFileRoute} from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react"; 

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,

});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLarge, setIsChatLarge] = useState(false);

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
        {isChatOpen && (
          <div className={`mb-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200 relative transition-all
              ${isChatLarge ? "w-[110vh] h-[80vh]" : "w-[55vh] h-[80vh]"} `}>
          
            <button
              onClick={() => setIsChatLarge(!isChatLarge)}
              className="absolute top-3 right-3 z-10 p-2  backdrop-blur-sm text-white transition-all"
              title={isChatLarge ? "Shrink chat" : "Expand chat"}>
              {isChatLarge ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <iframe
              src={`/support/${projectId}/chat-widget`}
              className="w-full h-full border-none bg-slate-50 mt-0"
              title="Customer Support Chat"/>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center h-14 w-14"
          aria-label="Toggle Chat"
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </div>
  );}