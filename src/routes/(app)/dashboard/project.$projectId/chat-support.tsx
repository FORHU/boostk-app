import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Image, Loader2, Paperclip, Send, Smile, UserCircle2, X, Zap } from "lucide-react";
import type { Project } from "prisma/generated/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { ticketQueries } from "@/modules/ticket/query.queries";
import type { TicketWithCustomer } from "@/modules/ticket/ticket.types";
import { createUserTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/chat-support")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(ticketQueries.getProjectTickets(context.project.id));
    return {};
  },
  component: ProjectChatSupportPage,
});

function ProjectChatSupportPage() {
  const { project } = Route.useRouteContext();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithCustomer | null>(null);
  const queryClient = useQueryClient();

  // Listen for new tickets in this project
  useEffect(() => {
    socket.emit("join_room", `project_${project.id}`);

    const handleTicketCreated = () => {
      queryClient.invalidateQueries({ queryKey: ticketQueries.getProjectTickets(project.id).queryKey });
    };

    socket.on("ticket_list_updated", handleTicketCreated);

    return () => {
      socket.emit("leave_room", `project_${project.id}`);
      socket.off("ticket_list_updated", handleTicketCreated);
    };
  }, [project.id, queryClient]);

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 rounded-xl">
      <Suspense fallback={<div className="p-4 h-14">Loading project tickets...</div>}>
        <TicketList project={project} selectedTicket={selectedTicket} onSelectTicket={setSelectedTicket} />
      </Suspense>
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        <TicketDetails ticket={selectedTicket} />
        <ChatWindow ticket={selectedTicket} />
        <CustomerDetails ticket={selectedTicket} />
      </div>
    </div>
  );
}

const TicketList = ({
  project,
  selectedTicket,
  onSelectTicket,
}: {
  project: Project;
  selectedTicket: TicketWithCustomer | null;
  onSelectTicket: (ticket: TicketWithCustomer) => void;
}) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(project.id));

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    if (e.deltaY !== 0) {
      // Determine if the user is hitting the absolute left or right boundaries and prevent page scroll
      const isAtStart = el.scrollLeft === 0;
      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;

      const tryingToScrollLeft = e.deltaY < 0;
      const tryingToScrollRight = e.deltaY > 0;

      if (isAtStart && tryingToScrollLeft) return;
      if (isAtEnd && tryingToScrollRight) return;

      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="px-2 h-20 flex flex-row gap-2 overflow-x-auto border-b bg-slate-50 items-center shrink-0 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent hover:scrollbar-thumb-slate-500"
    >
      {tickets.map((ticket) => (
        <div key={ticket.id} className="h-full py-2">
          <button
            type="button"
            onClick={() => onSelectTicket(ticket)}
            className={`group relative px-4 py-1.5 h-full min-w-[200px] max-w-[240px] flex items-center justify-between rounded-lg border cursor-pointer transition-all text-left ${selectedTicket?.id === ticket.id ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white hover:bg-slate-100 border-gray-200"}`}
          >
            <div className="flex flex-col truncate">
              <span
                className={`text-sm tracking-tight truncate ${selectedTicket?.id === ticket.id ? "font-bold text-indigo-700" : "font-semibold text-slate-800"}`}
              >
                {ticket.customer.name}
              </span>
              <span className="text-[8px] text-gray-500 truncate font-medium">
                Ticket #{ticket.referenceNumber?.slice(0, 8)}
              </span>
            </div>
            {ticket.status === "OPEN" && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>}
          </button>
        </div>
      ))}
    </div>
  );
};

// Left column: ticket details
const TicketDetails = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  if (!ticket) return <div className="h-full w-1/4 border-r bg-slate-50 p-4"></div>;

  return (
    <div className="h-full w-1/4 border-r bg-slate-50 p-4 min-w-0 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-slate-800">Ticket Details</h3>
      <div className="space-y-4">
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Requester</span>
          <input
            type="text"
            value={ticket.customer.name}
            readOnly
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
          />
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Email</span>
          <p className="text-sm font-medium px-3 py-2">{ticket.customer.email}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Assignee</span>
          <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none">
            <option>Alex Mercer</option>
            <option>Support Josie</option>
          </select>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Reference Number</span>
          <p className="text-sm font-medium px-3 py-2">{ticket.referenceNumber}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Status</span>
          <select
            defaultValue={ticket.status}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
          >
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Priority</span>
          <select
            defaultValue={ticket.priority}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none capitalize"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Created On</span>
          <p className="text-sm font-medium px-3 py-2">{new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-500 font-medium uppercase mb-1">Ticket ID</span>
          <input
            type="text"
            value={ticket.id}
            readOnly
            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

// Center column: chat header, messages, input
const ChatWindow = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  if (!ticket) {
    return (
      <div className="h-full w-1/2 bg-white flex items-center justify-center border-r">
        <p className="text-gray-400 font-medium block">Select a ticket to view messages</p>
      </div>
    );
  }

  return (
    <div className="h-full w-1/2 flex flex-col bg-white border-r relative min-w-0">
      <div className="px-4 py-3 border-b bg-indigo-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
          <UserCircle2 size={18} className="text-indigo-600" />
        </div>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center p-4">Loading messages...</div>}>
        <UserChatMessages ticket={ticket} />
      </Suspense>
      <UserChatInput ticket={ticket} />
    </div>
  );
};

const UserChatMessages = ({ ticket }: { ticket: TicketWithCustomer }) => {
  const { data: messages } = useSuspenseQuery(ticketMessageQueries.getTicketMessages(ticket.id));
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.emit("join_room", ticket.id);
    const handleNewMessage = () => queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.emit("leave_room", ticket.id);
      socket.off("receive_message", handleNewMessage);
    };
  }, [ticket.id, queryClient]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="m-auto text-gray-400 text-sm">No messages yet. Say hi!</div>
      ) : (
        // TODO: add type structure to messages
        // biome-ignore lint/suspicious/noExplicitAny: <ticket message type is not properly typed>
        messages.map((msg: any) => {
          // If userId is present, it's an agent. If customerId, it's a customer.
          const isAgent = !!msg.userId;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isAgent ? "self-end flex-row-reverse" : "self-start"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAgent ? "bg-indigo-100" : "bg-gray-200"}`}
              >
                <UserCircle2 size={20} className={isAgent ? "text-indigo-600" : "text-gray-500"} />
              </div>

              <div className={`flex flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">
                    {isAgent ? msg.user?.name || "Agent" : msg.customer?.name || "Customer"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {msg.content && (
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${isAgent ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}
                  >
                    {!isAgent && msg.translatedContent ? (
                      <div>
                        <div>{msg.translatedContent}</div>
                        <div className="text-[10px] mt-1 pt-1 border-t border-gray-200 text-gray-500">
                          Original: {msg.content}
                        </div>
                      </div>
                    ) : isAgent && msg.translatedContent ? (
                      <div>
                        <div>{msg.content}</div>
                        <div className="text-[10px] mt-1 pt-1 border-t border-indigo-500 text-indigo-200">
                          Translated: {msg.translatedContent}
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                )}

                {msg.attachments?.map((att: any) => (
                  <div
                    key={att.id || att.name}
                    className={`p-3 rounded-xl border flex items-center gap-3 min-w-[260px] ${isAgent ? "bg-indigo-700 border-indigo-500" : "bg-white border-gray-200"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAgent ? "bg-indigo-800" : "bg-indigo-50"}`}
                    >
                      <FileText size={20} className={isAgent ? "text-indigo-200" : "text-indigo-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isAgent ? "text-white" : "text-gray-900"}`}>
                        {att.name}
                      </p>
                      <p className={`text-[10px] ${isAgent ? "text-indigo-200" : "text-gray-500"}`}>{att.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(att.url, "_blank")}
                      className={`p-2 rounded-full transition-colors ${isAgent ? "text-indigo-200 hover:bg-indigo-800" : "text-indigo-600 hover:bg-indigo-50"}`}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// Message input with file upload tray
const UserChatInput = ({ ticket }: { ticket: TicketWithCustomer }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);

  // File upload preview state
  const [uploads, setUploads] = useState<
    Array<{
      id: string;
      file: File;
      preview: string;
      progress: number;
      name: string;
      size: string;
      type: "image" | "document";
    }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMessageMutation = useMutation({
    mutationFn: createUserTicketMessageFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all });
      if (data) socket.emit("new_message", { room: ticket.id });
    },
  });

  const handleFileSelect = (type: "image" | "document") => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt";
    fileInputRef.current.click();
    setAttachOpen(false);
  };

  // Simulate upload progress
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substring(7);
      const isImage = file.type.startsWith("image/");
      const preview = isImage ? URL.createObjectURL(file) : "";
      const size =
        file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;

      const newUpload = {
        id,
        file,
        preview,
        progress: 0,
        name: file.name,
        size,
        type: (isImage ? "image" : "document") as "image" | "document",
      };

      setUploads((prev) => [...prev, newUpload]);

      const interval = setInterval(() => {
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: Math.min(u.progress + 15, 95) } : u)));
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u)));
      }, 2000);
    });

    e.target.value = "";
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const u = prev.find((x) => x.id === id);
      if (u?.preview) URL.revokeObjectURL(u.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !uploads.length) || createMessageMutation.isPending) return;

    createMessageMutation.mutate({
      data: { ticketId: ticket.id, content: message.trim() || `Sent ${uploads.length} file(s)` },
    });
    uploads.forEach((u) => {
      if (u.preview) URL.revokeObjectURL(u.preview);
    });
    setUploads([]);
    setMessage("");
  };

  const uploading = uploads.some((u) => u.progress < 100);

  return (
    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" multiple />
      {uploads.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {uploads.map((u) => (
            <div
              key={u.id}
              className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center"
            >
              {u.type === "image" && u.preview ? (
                <img src={u.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText size={24} className="text-indigo-600" />
              )}

              {u.progress < 100 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeUpload(u.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <button type="button" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Zap size={20} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAttachOpen(!attachOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip size={20} />
            </button>
            {attachOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                <button
                  type="button"
                  onClick={() => handleFileSelect("image")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Image size={16} className="text-indigo-600" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => handleFileSelect("document")}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileText size={16} className="text-indigo-600" /> Document
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={uploads.length ? `Message with ${uploads.length} file(s)...` : "Type a reply..."}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          disabled={uploading}
        />

        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-gray-500 hover:text-indigo-600 transition-colors">
            <Smile size={20} />
          </button>
          <button
            type="submit"
            disabled={(!message.trim() && !uploads.length) || createMessageMutation.isPending || uploading}
            className="bg-indigo-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
          >
            <Send size={18} fill="currentColor" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Right column: agent profile and notes
const CustomerDetails = ({ ticket }: { ticket: TicketWithCustomer | null }) => {
  if (!ticket) return <div className="h-full w-1/4 bg-slate-50 p-4"></div>;

  return (
    <div className="h-full w-1/4 bg-slate-50 p-4 min-w-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <UserCircle2 size={24} className="text-indigo-600" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800">Alex Mercer</h4>
          <p className="text-xs text-gray-500">alec.mercker@gmail.com</p>
        </div>
      </div>

      <div className="mb-6">
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">About Agent</h5>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-500 block">Email</span>
            <p className="text-sm font-medium text-indigo-600">alec.mercker@gmail.com</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Phone</span>
            <p className="text-sm font-medium">63974586421</p>
          </div>
        </div>
      </div>

      <div>
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Notes</h5>
        <textarea
          placeholder="Type a note here..."
          className="w-full h-24 p-3 text-xs bg-white border border-gray-200 rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className="px-3 py-1.5 text-xs text-gray-500">
            Cancel
          </button>
          <button type="button" className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Save Note
          </button>
        </div>
      </div>

      <button
        type="button"
        className="w-full mt-4 py-2 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
      >
        + Add Note
      </button>
    </div>
  );
};
