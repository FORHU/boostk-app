import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Image,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Smile,
  SquareUser,
  Tag,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { Project } from "prisma/generated/client";
import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QuickReplies } from "@/components/chat-support/QuickReplies";
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

  // Mock states for UI demo 
  const [ticketTags, setTicketTags] = useState<Record<string, string[]>>({});
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, string>>({});
  const [ticketHistory, setTicketHistory] = useState<Record<string, any[]>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleUpdateStatus = (ticketId: string, status: string) => {
    setIsUpdatingStatus(true);
    
    // Simulate API delay
    setTimeout(() => {
      setTicketStatuses((prev) => ({ ...prev, [ticketId]: status }));
      
      // Add to interaction history
      const newItem = {
        id: Date.now(),
        title: "Support",
        time: "Just now",
        status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        color: status === "OPEN" ? "bg-red-500" : "bg-slate-400",
      };
      
      setTicketHistory((prev) => ({
        ...prev,
        [ticketId]: [newItem, ...(prev[ticketId] || [
          { id: 1, title: "Support", time: "16 minutes ago", status: "Open", color: "bg-red-500" },
          { id: 2, title: "Billing", time: "Wednesday 1:17 pm", status: "Closed", color: "bg-slate-400" },
          { id: 3, title: "Sales", time: "Wednesday 8:21 am", status: "Closed", color: "bg-slate-400" },
          { id: 4, title: "Returns", time: "April 12, 10:45 am", status: "Closed", color: "bg-slate-400" },
          { id: 5, title: "Support", time: "March 28, 2:15 pm", status: "Closed", color: "bg-slate-400" },
          { id: 6, title: "Exchanges", time: "March 15, 9:00 am", status: "Closed", color: "bg-slate-400" },
        ])],
      }));

      setIsUpdatingStatus(false);

      if (status === "ARCHIVED") {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
        toast.success("Ticket archived successfully");
      } else {
        toast.success(`Ticket status updated to ${status.toLowerCase()}`);
      }
    }, 1200);
  };

  const handleUpdateTags = (ticketId: string, tags: string[]) => {
    setTicketTags((prev) => ({ ...prev, [ticketId]: tags }));
  };

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200">
      <Suspense fallback={<div className="p-4 h-14">Loading project tickets...</div>}>
        <TicketList
          project={project}
          selectedTicket={selectedTicket}
          onSelectTicket={setSelectedTicket}
          ticketStatuses={ticketStatuses}
          ticketTags={ticketTags}
        />
      </Suspense>
      <div className="flex-1 flex flex-row overflow-hidden min-h-0 bg-slate-50/50">
        <TicketDetails
          ticket={selectedTicket}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={isUpdatingStatus}
          tags={selectedTicket ? ticketTags[selectedTicket.id] || [] : []}
          onUpdateTags={(tags) => selectedTicket && handleUpdateTags(selectedTicket.id, tags)}
          currentStatus={selectedTicket ? ticketStatuses[selectedTicket.id] || selectedTicket.status : "OPEN"}
        />
        <ChatWindow
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          archivedTickets={Object.entries(ticketStatuses)
            .filter(([_, status]) => status === "ARCHIVED" || status === "CLOSED")
            .map(([id]) => id)}
        />
        <CustomerDetails 
          ticket={selectedTicket} 
          history={selectedTicket ? ticketHistory[selectedTicket.id] || [
            { id: 1, title: "Support", time: "16 minutes ago", status: "Open", color: "bg-red-500" },
            { id: 2, title: "Billing", time: "Wednesday 1:17 pm", status: "Closed", color: "bg-slate-400" },
            { id: 3, title: "Sales", time: "Wednesday 8:21 am", status: "Closed", color: "bg-slate-400" },
            { id: 4, title: "Returns", time: "April 12, 10:45 am", status: "Closed", color: "bg-slate-400" },
            { id: 5, title: "Support", time: "March 28, 2:15 pm", status: "Closed", color: "bg-slate-400" },
            { id: 6, title: "Exchanges", time: "March 15, 9:00 am", status: "Closed", color: "bg-slate-400" },
          ] : []}
        />
      </div>
    </div>
  );
}

const TicketList = ({
  project,
  selectedTicket,
  onSelectTicket,
  ticketStatuses,
  ticketTags,
}: {
  project: Project;
  selectedTicket: TicketWithCustomer | null;
  onSelectTicket: (ticket: TicketWithCustomer) => void;
  ticketStatuses: Record<string, string>;
  ticketTags: Record<string, string[]>;
}) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(project.id));

  const filteredTickets = tickets.filter((ticket) => {
    const status = ticketStatuses[ticket.id] || ticket.status;
    return status !== "ARCHIVED";
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    if (e.deltaY !== 0) {
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
    <div className="h-20 flex flex-row border-b bg-slate-50 items-center shrink-0">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="px-2 h-full flex flex-row gap-2 overflow-x-auto items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
      >
        {filteredTickets.length === 0 ? (
          <div className="px-10 text-xs text-slate-400 font-medium whitespace-nowrap">No active conversations found</div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="h-full py-2">
              <button
                type="button"
                onClick={() => onSelectTicket(ticket)}
                className={`group relative px-4 py-1.5 h-full min-w-[200px] max-w-[240px] flex items-center justify-between rounded-lg border cursor-pointer transition-all text-left ${selectedTicket?.id === ticket.id ? "bg-white border-[#0037b0] shadow-md scale-[1.02] z-10" : "bg-white hover:bg-slate-100 border-slate-200"}`}
              >
                <div className="flex flex-col truncate">
                  <span
                    className={`text-sm tracking-tight truncate ${selectedTicket?.id === ticket.id ? "font-bold text-[#0037b0]" : "font-semibold text-slate-800"}`}
                  >
                    {ticket.customer.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 truncate font-bold uppercase tracking-wider">
                      #{ticket.referenceNumber?.slice(0, 8)}
                    </span>
                    {(ticketTags[ticket.id] || []).slice(0, 1).map((tag) => (
                      <span key={tag} className="text-[7px] bg-[#eaf1fb] text-[#0037b0] px-1 rounded font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {(ticketStatuses[ticket.id] || ticket.status) === "OPEN" && (
                  <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TicketDetails = ({
  ticket,
  onUpdateStatus,
  isUpdatingStatus,
  tags,
  onUpdateTags,
  currentStatus,
}: {
  ticket: TicketWithCustomer | null;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdatingStatus: boolean;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
  currentStatus: string;
}) => {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const assigneePopupRef = useRef<HTMLDivElement>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("Alex Mercer");

  const [statusOpen, setStatusOpen] = useState(false);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const statusPopupRef = useRef<HTMLDivElement>(null);

  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityButtonRef = useRef<HTMLButtonElement>(null);
  const priorityPopupRef = useRef<HTMLDivElement>(null);

  const [submitOpen, setSubmitOpen] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submitPopupRef = useRef<HTMLDivElement>(null);

  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id);
    toast.success("Ticket ID copied to clipboard");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (assigneeOpen && assigneeButtonRef.current && !assigneeButtonRef.current.contains(target) && assigneePopupRef.current && !assigneePopupRef.current.contains(target)) setAssigneeOpen(false);
      if (statusOpen && statusButtonRef.current && !statusButtonRef.current.contains(target) && statusPopupRef.current && !statusPopupRef.current.contains(target)) setStatusOpen(false);
      if (priorityOpen && priorityButtonRef.current && !priorityButtonRef.current.contains(target) && priorityPopupRef.current && !priorityPopupRef.current.contains(target)) setPriorityOpen(false);
      if (submitOpen && submitButtonRef.current && !submitButtonRef.current.contains(target) && submitPopupRef.current && !submitPopupRef.current.contains(target)) setSubmitOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [assigneeOpen, statusOpen, priorityOpen, submitOpen]);

  if (!ticket) return <div className="h-full w-1/4 border-r border-slate-100 bg-white p-4"></div>;

  return (
    <div className="h-full w-1/4 border-r border-slate-100 bg-white p-6 min-w-0 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-base text-slate-900 tracking-tight">Ticket Details</h3>
        <span className="px-2 py-0.5 bg-[#eaf1fb] text-[#0037b0] text-[10px] font-bold rounded-full uppercase">General</span>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-[10px] rounded-[5px] text-slate-400 font-bold uppercase tracking-wider">Tags</span>
            <Tag size={12} className="text-slate-300" />
          </div>
          <TicketTags tags={tags} onUpdateTags={onUpdateTags} />
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Requester</span>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium flex items-center justify-between" style={{ borderRadius: "5px" }}>
            <span>{ticket.customer.name}</span>
            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase">{ticket.customer.language}</span>
          </div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Email</span>
          <p className="text-sm font-medium text-slate-600 px-1 truncate" title={ticket.customer.email}>{ticket.customer.email}</p>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Assignee</span>
          <div className="relative">
            <button ref={assigneeButtonRef} type="button" onClick={() => setAssigneeOpen(!assigneeOpen)} className="w-full px-3 py-2 bg-white border border-slate-200 text-sm text-left flex items-center justify-between outline-none hover:border-[#7f9bd7] transition-colors" style={{ borderRadius: "5px" }}>
              <span className="font-medium text-slate-700">{selectedAssignee}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {assigneeOpen && (
              <div ref={assigneePopupRef} className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-[5px] shadow-xl z-20 p-1 animate-in fade-in zoom-in-95 duration-100">
                {["Alex Mercer", "Support Josie"].map((assignee, idx, arr) => (
                  <div key={assignee}>
                    <button type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 rounded-md transition-colors font-medium text-slate-700" onClick={() => { setSelectedAssignee(assignee); setAssigneeOpen(false); }}>{assignee}
                      
                    </button>
                    {idx !== arr.length - 1 && <div className="h-px bg-slate-100 my-1 mx-2" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Current Status</span>
            <div className="relative">
              <button ref={statusButtonRef} type="button" onClick={() => setStatusOpen(!statusOpen)} className="w-full px-3 py-2 bg-white border border-slate-200 text-sm text-left flex items-center justify-between outline-none hover:border-[#7f9bd7] transition-colors" style={{ borderRadius: "5px" }}>
                <span className="capitalize font-medium text-slate-700">{currentStatus.toLowerCase()}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {statusOpen && (
                <div ref={statusPopupRef} className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-[5px] shadow-xl z-20 p-1 animate-in fade-in zoom-in-95 duration-100">
                  {["OPEN", "CLOSED", "ARCHIVED"].map((status, idx, arr) => (
                    <div key={status}>
                      <button type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 rounded-md transition-colors capitalize font-medium text-slate-700" onClick={() => { onUpdateStatus(ticket.id, status); setStatusOpen(false); }}>{status.toLowerCase()}</button>
                      {idx !== arr.length - 1 && 
                      <div className="h-px bg-slate-100 my-1 mx-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Priority</span>
            <div className="relative">
              <button ref={priorityButtonRef} type="button" onClick={() => setPriorityOpen(!priorityOpen)} className="w-full px-3 py-2 bg-white border border-slate-200 text-sm text-left flex items-center justify-between outline-none hover:border-[#7f9bd7] transition-colors" style={{ borderRadius: "5px" }}>
                <span className="capitalize font-medium text-slate-700">{ticket.priority.toLowerCase()}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {priorityOpen && (
                <div ref={priorityPopupRef} className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-[5px] shadow-xl z-20 p-1 animate-in fade-in zoom-in-95 duration-100">
                  {["LOW", "NORMAL", "HIGH"].map((priority, idx, arr) => (
                    <div key={priority}>
                      <button type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 rounded-md transition-colors capitalize font-medium text-slate-700" onClick={() => setPriorityOpen(false)}>{priority.toLowerCase()}</button>
                      {idx !== arr.length - 1 && <div className="h-px bg-slate-100 my-1 mx-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Ticket ID</span>
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] font-bold text-slate-500 font-mono truncate mr-2" title={ticket.id}>
              {ticket.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-slate-300 hover:text-[#0037b0] transition-colors p-1 flex-shrink-0"
              title="Copy Ticket ID"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <div className="relative">
            <button ref={submitButtonRef} type="button" disabled={isUpdatingStatus} onClick={() => setSubmitOpen(!submitOpen)} className="text-white text-sm py-2 px-4 transition-all flex items-center gap-2.5 hover:brightness-110 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed shadow-sm" style={{ backgroundColor: "#203b69", borderRadius: "5px" }}>
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><span className="font-bold">Submit Status as:</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${submitOpen ? "rotate-180" : ""}`} /></>)}
            </button>
            {submitOpen && (
              <div ref={submitPopupRef} className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-20 p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Change Status To</p>
                {["OPEN", "CLOSED", "ARCHIVED"].map((status) => (
                  <button key={status} type="button" className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 rounded-lg transition-all font-bold text-slate-700 flex items-center justify-between group" onClick={() => { onUpdateStatus(ticket.id, status); setSubmitOpen(false); }}>
                    <span className="capitalize group-hover:text-[#203b69]">{status.toLowerCase()}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "OPEN" ? "bg-green-500" : status === "CLOSED" ? "bg-red-500" : "bg-slate-300"}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketTags = ({ tags, onUpdateTags }: { tags: string[]; onUpdateTags: (tags: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const predefinedTags = ["Sales", "Support", "Billing", "Urgent", "Technical", "Feature Request", "Feedback"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) onUpdateTags(tags.filter((t) => t !== tag));
    else onUpdateTags([...tags, tag]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-[5px] min-h-[40px]">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-[#eaf1fb] text-[#0037b0] text-[11px] font-bold rounded-full group hover:bg-[#7f9bd7]/20 transition-all shadow-sm">
            {tag}
            <button type="button" onClick={() => toggleTag(tag)} className="text-[#0037b0]/60 hover:text-[#0037b0]"><X size={12} strokeWidth={2.5} /></button>
          </span>
        ))}
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 px-3 py-1 border border-dashed border-slate-300 text-slate-400 text-[11px] font-bold rounded-full hover:border-[#0037b0] hover:text-[#0037b0] hover:bg-[#eaf1fb] transition-all"><Plus size={12} /> Add Tag</button>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Category</p>
          <div className="grid grid-cols-1 gap-1">
            {predefinedTags.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`w-full text-left px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all flex items-center justify-between ${tags.includes(tag) ? "bg-[#203b69] text-white shadow-sm" : "hover:bg-[#eaf1fb] text-slate-600 hover:text-[#0037b0]"}`}>
                {tag}{tags.includes(tag) && <X size={12} strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatWindow = ({ ticket, archivedTickets, onClose }: { ticket: TicketWithCustomer | null; archivedTickets: string[]; onClose: () => void; }) => {
  const [isDragging, setIsDragging] = useState(false);
  if (!ticket) {
    return (
      <div className="h-full w-1/2 bg-white flex flex-col items-center justify-start border-r overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><History size={40} className="text-slate-300" /></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No conversation selected</h2>
          <p className="text-slate-500 text-sm mb-8">Select an active ticket from the list above to start chatting with a customer.</p>
        </div>
        {archivedTickets.length > 0 && (
          <div className="w-full px-8 pb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-slate-100" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recently Archived ({archivedTickets.length})</span><div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              {archivedTickets.slice(0, 5).map((id) => (
                <div key={id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-[#7f9bd7] hover:bg-white transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">{id.slice(0, 2).toUpperCase()}</div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-700">Ticket #{id.slice(0, 8)}</span><span className="text-[10px] text-slate-400">Archived on {new Date().toLocaleDateString()}</span></div>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:text-[#0037b0] hover:border-[#7f9bd7]">View History</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) window.dispatchEvent(new CustomEvent("file-drop", { detail: files }));
  };

  return (
    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className="h-full w-1/2 flex flex-col bg-white border-r border-slate-100 relative min-w-0">
      {isDragging && (
        <div className="absolute inset-0 bg-[#7f9bd7]/10 border-2 border-dashed border-[#7f9bd7] z-50 flex flex-col items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-[#7f9bd7] text-white rounded-[5px] flex items-center justify-center shadow-2xl mb-4 animate-bounce"><Paperclip size={32} /></div>
          <p className="text-[#7f9bd7] font-bold text-lg">Drop files to upload</p>
          <p className="text-[#7f9bd7] text-sm">Images and documents up to 10MB</p>
        </div>
      )}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ width: 36, height: 36 }}><div className="absolute inset-0 rounded-[5px] bg-[#0038b0] flex items-center justify-center">
            <span className="text-sm font-bold text-white">{ticket.customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
            </div>
            </div>
          <div className="flex flex-col"><span className="font-bold text-slate-900 text-sm leading-tight">{ticket.customer.name}</span><span className="text-[10px] text-slate-400 font-medium">#{ticket.referenceNumber}</span></div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-black transition-all ml-auto" title="Close Chat"><X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-4">Loading messages...</div>}><UserChatMessages ticket={ticket} /></Suspense>
        <UserChatInput ticket={ticket} />
      </div>
    </div>
  );
};

const UserChatMessages = ({ ticket }: { ticket: TicketWithCustomer }) => {
  const { data: messages } = useSuspenseQuery(ticketMessageQueries.getTicketMessages(ticket.id));
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MessageStatus = ({ status }: { status?: string }) => {
    const s = status || "DELIVERED";
    if (s === "FAILED") return (<div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-red-500"><span>Failed to send</span><AlertCircle size={10} /></div>);
    const isRead = s === "READ";
    return (<div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${isRead ? "text-[#0037b0]" : "text-slate-400"}`}><span>{isRead ? "Read" : "Delivered"}</span><CheckCheck size={12} className={isRead ? "text-[#0037b0]" : "text-slate-300"} /></div>);
  };

  useEffect(() => {
    socket.emit("join_room", ticket.id);
    const handleNewMessage = () => { queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all }); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };
    socket.on("receive_message", handleNewMessage);
    return () => { socket.emit("leave_room", ticket.id); socket.off("receive_message", handleNewMessage); };
  }, [ticket.id, queryClient]);

  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages]);
  // TODO: Remove mock messages
  const mockMessages = [
    {
      id: "mock_1",
      userId: "agent_1",
      content: "Here are the Earth texture assets you requested:",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: "READ",
      attachments: [
        { id: "img_1", name: "earthtexture.png", size: "2.4 MB", type: "image", url: "/images/earthtexture.png" },
        { id: "img_2", name: "earth-specular.jpg", size: "1.1 MB", type: "image", url: "/images/earth-specular.jpg" },
        { id: "img_3", name: "earth-map.jpg", size: "3.2 MB", type: "image", url: "/images/earth-map.jpg" },
      ]
    },
    {
      id: "mock_2",
      userId: "agent_1",
      content: "I've also attached the latest technical requirements document.",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      status: "READ",
      attachments: [
        { id: "doc_1", name: "BoostK Technical Requirements.pdf", size: "850 KB", type: "document", url: "/documents/BoostK Technical Requirments.pdf" }
      ]
    },
    {
      id: "mock_3",
      userId: "agent_1",
      content: "Check out these marketing clips for the upcoming launch:",
      createdAt: new Date(Date.now() - 600000).toISOString(),
      status: "DELIVERED",
      attachments: [
        { id: "vid_1", name: "marketing-1.mp4", size: "12.5 MB", type: "video", url: "/videos/marketing-1.mp4" },
        { id: "vid_2", name: "marketing-2.mp4", size: "18.2 MB", type: "video", url: "/videos/marketing-2.mp4" }
      ]
    }
  ];

  const allMessages = [...mockMessages, ...messages];

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {allMessages.length === 0 ? (<div className="m-auto text-gray-400 text-sm">No messages yet. Say hi!</div>) : (
        allMessages.map((msg: any, idx: number) => {
          const isAgent = !!msg.userId;
          const showDivider = idx === 0 || new Date(msg.createdAt).toLocaleDateString() !== new Date(allMessages[idx - 1].createdAt).toLocaleDateString();
          return (
            <Fragment key={msg.id}>
              {showDivider && (<div className="flex items-center gap-4 py-4 px-2"><div className="flex-1 h-px bg-slate-200" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(msg.createdAt))}</span><div className="flex-1 h-px bg-slate-200" /></div>)}
              <div className={`flex gap-3 max-w-[85%] ${isAgent ? "self-end flex-row-reverse" : "self-start"}`}>
                <div className={`w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0 ${isAgent ? "bg-[#0037b0]/10" : "bg-gray-200"}`}><SquareUser size={20} className={isAgent ? "text-[#0037b0]" : "text-gray-500"} /></div>
                <div className={`flex flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{isAgent ? msg.user?.name || "Agent" : msg.customer?.name || "Customer"}</span>
                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {msg.content && (<div style={{ borderRadius: "5px" }} className={`px-4 py-2 text-sm ${isAgent ? "bg-[#eaf1fb] text-black" : "bg-gray-100 text-gray-800"}`}>
                    {msg.translatedContent ? (<div><div>{isAgent ? msg.content : msg.translatedContent}</div><div className={`text-[10px] mt-1 pt-1 border-t ${isAgent ? "border-[#0037b0]/20 text-[#0037b0]/60" : "border-gray-200 text-gray-500"}`}>{isAgent ? `Translated: ${msg.translatedContent}` : `Original: ${msg.content}`}</div></div>) : msg.content}
                  </div>)}
                  {msg.content === "Sent 3 file(s)" && !msg.attachments?.length && (
                    <div 
                      onClick={() => setSelectedMedia({ url: "/images/cat-point-laughing.gif", type: "image" })}
                      className="mt-2 rounded-[5px] overflow-hidden border border-slate-200 shadow-sm max-w-[300px] bg-[#eaf1fb] group cursor-pointer hover:border-[#0037b0] transition-all"
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src="/images/cat-point-laughing.gif" 
                          alt="Mock Preview" 
                          className="w-full h-auto object-cover max-h-[180px] group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-[#0037b0] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg">View GIF</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700">cat-point-laughing.gif</span>
                          <span className="text-[8px] text-slate-400">1.2 MB • GIF</span>
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-[#0037b0] transition-colors"><ExternalLink size={14} /></button>
                      </div>
                    </div>
                  )}
                  {msg.attachments?.map((att: any) => {
                    const isImage = att.type === "image" || att.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isVoice = att.type === "voice";
                    const isVideo = att.type === "video" || att.name?.match(/\.(mp4|mov|avi)$/i);

                    if (isImage) return (
                    <div key={att.id} onClick={() => setSelectedMedia({ url: att.url || "/images/cat-point-laughing.gif", type: "image" })} className="mt-2 rounded-[5px] overflow-hidden border border-slate-200 shadow-sm max-w-[300px] bg-[#eaf1fb] hover:border-[#0037b0] transition-colors cursor-pointer group">
                      <div className="relative overflow-hidden">
                        <img src={att.url || "/images/cat-point-laughing.gif"} alt="" className="w-full h-auto object-cover max-h-[200px] group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-[#0037b0] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg">View Image</span>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 truncate">{att.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); window.open(att.url, "_blank"); }} className="text-[#0037b0]"><ExternalLink size={12} /></button>
                      </div>
                    </div>);

                    if (isVideo) return (
                      <div 
                        key={att.id} 
                        onClick={() => setSelectedMedia({ url: att.url, type: "video" })}
                        className="mt-2 rounded-[5px] overflow-hidden border border-slate-200 shadow-sm max-w-[300px] bg-slate-900 group cursor-pointer relative"
                      >
                        <div className="aspect-video bg-slate-800 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <History size={24} className="rotate-90" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white uppercase tracking-wider">Video</div>
                        <div className="px-3 py-2 bg-[#eaf1fb] flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{att.name}</span>
                            <span className="text-[8px] text-slate-400">{att.size}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); window.open(att.url, "_blank"); }} className="p-1.5 text-slate-400 hover:text-[#0037b0] transition-colors"><ExternalLink size={14} /></button>
                        </div>
                      </div>
                    );

                    if (isVoice) return (
                    <div key={att.id} className={`mt-2 p-3 rounded-[5px] flex items-center gap-3 min-w-[240px] shadow-sm ${isAgent ? "bg-[#0037b0] text-white" : "bg-white border border-slate-100"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAgent ? "bg-white/20" : "bg-[#eaf1fb]"}`}><RotateCcw size={18} className={isAgent ? "text-white" : "text-[#0037b0]"} />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-1">{[...Array(12)].map((_, i) => (<div key={i} className={`w-1 rounded-full ${isAgent ? "bg-white/40" : "bg-[#7f9bd7]/20"}`} style={{ height: 4 + Math.random() * 12 }} />))}</div>
                        <span className={`text-[9px] font-bold ${isAgent ? "text-white/60" : "text-slate-400"}`}>0:12 • Voice Message</span>
                      </div>
                      <button className={`p-2 rounded-full ${isAgent ? "hover:bg-white/10" : "hover:bg-slate-50"}`}><Download size={14} />
                      </button>
                    </div>);

                    return (<div key={att.id} className={`p-3 border flex items-center gap-3 min-w-[260px] shadow-sm ${isAgent ? "bg-[#0037b0]/90 border-[#0037b0]" : "bg-[#eaf1fb] border-gray-200"}`} style={{ borderRadius: "5px" }}><div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAgent ? "bg-[#0037b0]" : "bg-white"}`}><FileText size={20} className={isAgent ? "text-white/80" : "text-[#0037b0]"} /></div><div className="flex-1 min-w-0"><p className={`text-xs font-bold truncate ${isAgent ? "text-white" : "text-gray-900"}`}>{att.name}</p><p className={`text-[10px] ${isAgent ? "text-white/60" : "text-gray-500"}`}>{att.size}</p></div><button onClick={() => window.open(att.url, "_blank")} className={`p-2 rounded-full ${isAgent ? "text-white/60 hover:bg-white/10" : "text-[#0037b0] hover:bg-white"}`}><Download size={16} /></button></div>);
                  })}
                  {isAgent && <MessageStatus status={msg.status} />}
                </div>
              </div>
            </Fragment>
          );
        })
      )}
      <div ref={messagesEndRef} />

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all hover:rotate-90 z-[110]"
          >
            <X size={24} strokeWidth={3} />
          </button>
          
          <div className="max-w-[90vw] max-h-[90vh] relative animate-in zoom-in-95 duration-300">
            {selectedMedia.type === "video" ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                className="w-full h-full rounded-lg shadow-2xl shadow-black/50 outline-none"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Full view" 
                className="w-full h-full object-contain rounded-lg shadow-2xl shadow-black/50"
              />
            )}
            <div className="absolute bottom-[-40px] left-0 right-0 text-center">
              <span className="text-white/60 text-xs font-medium">Click outside or use the exit button to close</span>
            </div>
          </div>
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedMedia(null)} />
        </div>
      )}
    </div>
  );
};

const UserChatInput = ({ ticket }: { ticket: TicketWithCustomer }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMessageMutation = useMutation({
    mutationFn: createUserTicketMessageFn,
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ticketMessageQueries.all }); if (data) socket.emit("new_message", { room: ticket.id }); },
  });

  useEffect(() => {
    const handleFileDrop = (e: any) => handleFiles(Array.from(e.detail));
    window.addEventListener("file-drop", handleFileDrop);
    return () => window.removeEventListener("file-drop", handleFileDrop);
  }, []);

  /**
   * Processes uploaded files:
   * - Images: JPG, PNG, WEBP, GIF (auto-generates previews)
   * - Documents: PDF, DOC, DOCX, TXT
   * - Constraints: Max 10MB per file
   */
  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); return; }
      const id = Math.random().toString(36).substring(7);
      const isImage = file.type.startsWith("image/");
      setUploads(prev => [...prev, { id, file, preview: isImage ? URL.createObjectURL(file) : "", progress: 0, name: file.name, size: file.size > 1024 * 1024 ? `${(file.size/1024/1024).toFixed(1)}MB` : `${(file.size/1024).toFixed(0)}KB`, type: isImage ? "image" : "document" }]);
      let prog = 0; const int = setInterval(() => { prog += 15; setUploads(p => p.map(u => u.id === id ? { ...u, progress: Math.min(prog, 100) } : u)); if (prog >= 100) clearInterval(int); }, 200);
    });
  };

  const handleStartRecording = () => { setIsRecording(true); setRecordingDuration(0); timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000); };
  const handleStopRecording = () => { clearInterval(timerRef.current); setIsRecording(false); const id = "v" + Math.random(); setUploads(p => [...p, { id, progress: 100, name: "Voice", size: `${Math.floor(recordingDuration/60)}:${(recordingDuration%60).toString().padStart(2,"0")}`, type: "voice" }]); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if ((!message.trim() && !uploads.length) || createMessageMutation.isPending || isRecording) return;
    createMessageMutation.mutate({ data: { ticketId: ticket.id, content: message.trim() || `Sent ${uploads.length} file(s)` } });
    setUploads([]); setMessage("");
  };

  return (
    <div className="p-3 bg-white border-t border-gray-100 shrink-0 relative">
      <input ref={fileInputRef} type="file" onChange={(e) => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ""; }} className="hidden" multiple />
      {uploads.length > 0 && (
        <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
          {uploads.map(u => (
            <div key={u.id} className="relative w-20 h-20 border border-slate-200 rounded-[8px] overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center group">
              {u.type === "image" ? <img src={u.preview} className="w-full h-full object-cover" alt="" /> : u.type === "voice" ? <Mic size={24} className="text-[#0037b0]" /> : <FileText size={24} className="text-[#0037b0]" />}
              {u.progress < 100 && 
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-2">
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#0037b0] h-full" style={{ width: `${u.progress}%` }} />
                </div>
              </div>
              }
              <button onClick={() => setUploads(p => p.filter(x => x.id !== u.id))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <Trash2 size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      {showQuickResponses && <QuickReplies onSelectReply={(t) => { setMessage(t); setShowQuickResponses(false); }} onClose={() => setShowQuickResponses(false)} />}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3">
            <button type="button" onClick={() => { clearInterval(timerRef.current); setIsRecording(false); }} className="p-2 text-slate-400 hover:text-red-500"><XCircle size={20} />
            </button>
            <div className="flex-1 bg-[#0037b0] h-11 rounded-full px-4 flex items-center justify-between">
              <button type="button" onClick={handleStopRecording} className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#0037b0]">
                <div className="w-2.5 h-2.5 bg-[#0037b0] rounded-sm" />
              </button>
              <div className="flex-1 flex gap-1 mx-4">{[...Array(24)].map((_,i)=>
                <div key={i} className="flex-1 bg-white/40 rounded-full h-4 animate-pulse" />)}
              </div>
              <span className="text-white font-mono text-[11px]">{Math.floor(recordingDuration/60)}:{(recordingDuration%60).toString().padStart(2,"0")}
              </span>
            </div>
            <button type="submit" className="w-10 h-10 bg-[#0037b0] text-white rounded-full flex items-center justify-center shadow-md"><Send size={18} fill="currentColor" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 border-r border-gray-200">
              <button type="button" onClick={handleStartRecording} className="p-2 text-[#0037b0] hover:bg-[#0037b0]/10 rounded-[5px]"><Mic size={20} /></button>
              <button type="button" onClick={() => setShowQuickResponses(!showQuickResponses)} className="p-2 text-[#0037b0] hover:bg-[#0037b0]/10 rounded-[5px]"><Zap size={20} />
              </button>
              <div className="relative">
                <button type="button" onClick={() => setAttachOpen(!attachOpen)} className="p-2 text-[#0037b0] hover:bg-[#0037b0]/10 rounded-[5px]"><Paperclip size={20} />
                </button>{attachOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white shadow-2xl border border-slate-200 py-2 rounded-[10px] z-50">
                    <button type="button" onClick={() => { fileInputRef.current!.accept = "image/*"; fileInputRef.current!.click(); setAttachOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#0037b0]/10 flex items-center gap-3"><Image size={16} className="text-[#0037b0]" /> 
                    Image</button>
                    <button type="button" onClick={() => { fileInputRef.current!.accept = ".pdf,.doc,.docx,.txt"; fileInputRef.current!.click(); setAttachOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#0037b0]/10 flex items-center gap-3"><FileText size={16} className="text-[#0037b0]" /> Document
                    </button>
                    </div>
                  )}
              </div>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }} placeholder="Type a reply..." className="flex-1 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0037b0] rounded-[8px] border border-transparent resize-none" rows={1} />
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 text-[#0037b0] hover:bg-[#0037b0]/10 rounded-[5px]"><Smile size={20} /></button>
              <button type="submit" disabled={(!message.trim() && !uploads.length) || createMessageMutation.isPending} className="bg-[#0037b0] text-white p-2.5 rounded-[8px] shadow-md hover:brightness-110"><Send size={18} fill="currentColor" /></button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

const CustomerDetails = ({ ticket, history }: { ticket: TicketWithCustomer | null; history: any[] }) => {
  const [note, setNote] = useState("Customer is a VIP. Prefers email for non-urgent matters.");
  const [isEditing, setIsEditing] = useState(false);
  const [tempNote, setTempNote] = useState(note);
  if (!ticket) return <div className="h-full w-1/4 bg-slate-50 p-4"></div>;
  return (
    <div className="h-full w-1/4 bg-white flex flex-col border-l border-slate-200 overflow-y-auto">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-full bg-slate-400 flex items-center justify-center"><SquareUser className="h-5.5 w-5.5 text-white/90" /></div>
          <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">Alex Mercer</h3>
          </div>
        <div className="space-y-3.5">
          <div className="grid grid-cols-[90px_1fr] items-baseline">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</span>
            <span className="text-[13px] text-[#0037b0] font-medium break-all leading-tight">alec.merker@gmail.com</span>
          </div>
          <div className="grid grid-cols-[90px_1fr] items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Local time</span>
            <span className="text-[13px] text-slate-700 font-medium">Fri, 7:58 AM PDT</span>
          </div>
          <div className="grid grid-cols-[90px_1fr] items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Language</span>
            <span className="text-[13px] text-slate-700 font-medium">English (US)</span>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes</span>
            <textarea className={`w-full text-[13px] text-slate-700 p-2.5 bg-white border rounded-[3px] resize-none outline-none min-h-[70px] ${isEditing ? "border-[#7f9bd7]" : "border-slate-200"}`} value={isEditing ? tempNote : note} onFocus={() => setIsEditing(true)} onChange={e => setTempNote(e.target.value)} />{isEditing && (
              <div className="flex items-center justify-end gap-2 mt-1"><button onClick={() => setIsEditing(false)} className="text-[11px] font-bold text-slate-500">Cancel</button>
              <button onClick={() => { setNote(tempNote); setIsEditing(false); }} className="px-3 py-1 bg-[#0037b0] text-white text-[11px] font-bold rounded shadow-sm">Save</button></div>)}
          </div>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h4 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Interaction history</h4>
          <div className="flex items-center gap-1"><RotateCcw className="h-4 w-4 text-slate-400 cursor-pointer hover:text-[#0037b0] transition-colors" /><ChevronUp className="h-4 w-4 text-slate-400 cursor-pointer hover:text-[#0037b0] transition-colors" /><ChevronDown className="h-4 w-4 text-slate-400 cursor-pointer hover:text-[#0037b0] transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {history.map((item, idx) => (
            <div key={item.id} className={`group relative pl-14 pr-5 py-5 transition-colors border-l-4 border-transparent ${idx === 0 ? "bg-[#eaf1fb] border-l-[#0037b0]" : "hover:bg-slate-50"}`}>
              {idx !== history.length - 1 && 
              <div className="absolute left-[24px] top-[30px] bottom-[-30px] w-[1px] bg-slate-200" />}
              <div className={`absolute left-[21px] top-6 w-[7px] h-[7px] rounded-sm ${item.color} z-10 shadow-sm`} />
              <div className="flex flex-col">
                <h5 className="text-[13px] font-bold text-slate-800 mb-1">{item.title}</h5>
                <span className="text-[12px] text-slate-500 mb-1">{item.time}</span>
                <span className="text-[12px] text-slate-500 font-medium capitalize">Status {item.status.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
