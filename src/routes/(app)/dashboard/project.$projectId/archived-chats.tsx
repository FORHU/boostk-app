import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/archived-chats")({
  component: ArchivedChatsPage,
});

interface ArchivedConversation {
  id: string;
  customerName: string;
  referenceId: string;
  lastMessage: string;
  archivedAt: string;
  initials: string;
  department: string;
  timeAgo: string;
}

const MOCK_ARCHIVED: ArchivedConversation[] = [
  {
    id: "archived-1",
    customerName: "Sarah Jenkins",
    referenceId: "CUS-9284",
    lastMessage:
      "I am writing to report a recurring issue with my account synchronization that has been persistent for...",
    archivedAt: new Date().toISOString(),
    initials: "SJ",
    department: "SUPPORT",
    timeAgo: "JUST NOW",
  },
  {
    id: "archived-2",
    customerName: "Anna Schmidt",
    referenceId: "CUS-9987",
    lastMessage: "I'm locked out of my account.",
    archivedAt: new Date().toISOString(),
    initials: "AS",
    department: "SUPPORT",
    timeAgo: "5 MINS",
  },
  {
    id: "archived-3",
    customerName: "Noah Adams",
    referenceId: "CUS-1357",
    lastMessage: "I haven't received my order confirmation yet.",
    archivedAt: new Date().toISOString(),
    initials: "NA",
    department: "SUPPORT",
    timeAgo: "10 MINS",
  },
  {
    id: "archived-4",
    customerName: "Linda Chen",
    referenceId: "CUS-2345",
    lastMessage: "My invoice shows an incorrect amount.",
    archivedAt: new Date().toISOString(),
    initials: "LC",
    department: "BILLING",
    timeAgo: "15 MINS",
  },
  {
    id: "archived-5",
    customerName: "Isabella Garcia",
    referenceId: "CUS-2468",
    lastMessage: "Is there a student discount available?",
    archivedAt: new Date().toISOString(),
    initials: "IG",
    department: "SALES",
    timeAgo: "45 MINS",
  },
  {
    id: "archived-6",
    customerName: "James Wilson",
    referenceId: "CUS-6789",
    lastMessage: "When will the new feature be released?",
    archivedAt: new Date().toISOString(),
    initials: "JW",
    department: "SALES",
    timeAgo: "2 HOURS",
  },
];

function ArchivedChatsPage() {
  const { project } = Route.useRouteContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [timeSort, setTimeSort] = useState<"recent" | "oldest">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dropdown states and refs
  const [tagOpen, setTagOpen] = useState(false);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const tagPopupRef = useRef<HTMLDivElement>(null);

  const [sortOpen, setSortOpen] = useState(false);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortPopupRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useMemo(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Tag dropdown
      if (
        tagPopupRef.current &&
        !tagPopupRef.current.contains(event.target as Node) &&
        tagButtonRef.current &&
        !tagButtonRef.current.contains(event.target as Node)
      ) {
        setTagOpen(false);
      }
      // Sort dropdown
      if (
        sortPopupRef.current &&
        !sortPopupRef.current.contains(event.target as Node) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredChats = useMemo(() => {
    return MOCK_ARCHIVED.filter((chat) => {
      const matchesSearch =
        chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.referenceId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = selectedTag === "all" || chat.department === selectedTag;

      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      if (timeSort === "recent") {
        return new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime();
      }
      if (timeSort === "oldest") {
        return new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime();
      }
      return 0;
    });
  }, [searchTerm, selectedTag, timeSort]);

  const totalPages = Math.ceil(filteredChats.length / itemsPerPage);
  const paginatedChats = filteredChats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white z-10 shrink-0">
        <div className="flex flex-row items-center gap-2">
          <div className="flex-1 relative flex items-center min-w-[200px]">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archived conversations by name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-transparent border-slate-200 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 rounded-[5px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-px h-6 bg-foreground/10 mx-1 hidden sm:block" />
          <div className="hidden sm:flex flex-row items-center gap-2">
            {/* Tag Dropdown */}
            <div className="relative">
              <button
                ref={tagButtonRef}
                type="button"
                onClick={() => setTagOpen(!tagOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-[#e8f0fa] transition-all whitespace-nowrap"
              >
                <span className="opacity-60 uppercase tracking-wider">Tag:</span>
                <span className="text-slate-900 capitalize">
                  {selectedTag === "all" ? "All" : selectedTag.toLowerCase()}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${tagOpen ? "rotate-180" : "opacity-40"}`}
                />
              </button>
              {tagOpen && (
                <div
                  ref={tagPopupRef}
                  className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                >
                  <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">
                    Select Tag
                  </p>
                  {["all", "SUPPORT", "SALES", "BILLING"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all capitalize ${
                        selectedTag === tag ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setSelectedTag(tag);
                        setTagOpen(false);
                      }}
                    >
                      {tag === "all" ? "All" : tag.toLowerCase()}
                      {selectedTag === tag && <Check className="h-3.5 w-3.5 text-[#0037b0]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                ref={sortButtonRef}
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-[#e8f0fa] transition-all whitespace-nowrap"
              >
                <span className="opacity-60 uppercase tracking-wider">Sort:</span>
                <span className="text-slate-900 capitalize">
                  {timeSort === "recent" && "Recent"}
                  {timeSort === "oldest" && "Oldest"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${sortOpen ? "rotate-180" : "opacity-40"}`}
                />
              </button>
              {sortOpen && (
                <div
                  ref={sortPopupRef}
                  className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                >
                  <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">
                    Sort By
                  </p>
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all ${
                      timeSort === "recent" ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setTimeSort("recent");
                      setSortOpen(false);
                    }}
                  >
                    Recent
                    {timeSort === "recent" && <Check className="h-3.5 w-3.5 text-[#0037b0]" />}
                  </button>
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all ${
                      timeSort === "oldest" ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setTimeSort("oldest");
                      setSortOpen(false);
                    }}
                  >
                    Oldest
                    {timeSort === "oldest" && <Check className="h-3.5 w-3.5 text-[#0037b0]" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="p-6 w-full flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-end justify-between px-2">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Archived Chats</h2>
            </div>
          </div>

          {/* Conversation List */}
          <Card className="border-slate-100 shadow-xl shadow-slate-200/20 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              {paginatedChats.length > 0 ? (
                paginatedChats.map((chat, idx) => (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center gap-4 py-3 px-6 transition-all hover:bg-slate-50/50 cursor-default ${
                      idx !== paginatedChats.length - 1 ? "border-b border-slate-50" : ""
                    }`}
                  >
                    <Avatar className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm shrink-0">
                      <AvatarFallback className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        {chat.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-sm leading-none tracking-tight">
                          {chat.customerName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 border border-slate-100 bg-slate-50 text-slate-400 text-[7px] font-black rounded-[3px] tracking-widest uppercase">
                            {chat.department}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>#{chat.referenceId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(chat.referenceId)}
                          className="hover:text-[#0037b0] transition-colors"
                        >
                          <Copy size={10} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-4xl leading-relaxed mt-0.5">
                        {chat.lastMessage}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 min-w-[100px] shrink-0">
                      <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                        {chat.timeAgo}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-all border-slate-200 text-slate-600 font-black text-[9px] h-6 px-2.5 rounded-md uppercase tracking-widest hover:border-[#7f9bd7] hover:text-[#0037b0] hover:bg-blue-50/50"
                        onClick={() =>
                          navigate({
                            to: "/dashboard/project/$projectId/chat-support",
                            params: { projectId: project.id },
                            search: { archived: true },
                          })
                        }
                      >
                        Open Chat
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Archive size={24} className="text-slate-200" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">No archived records</h3>
                  <p className="text-xs text-slate-400 max-w-xs font-medium">
                    We couldn't find any historical chats matching your current search or filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-10 py-4 mt-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#7f9bd7] hover:bg-[#eaf1fb] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-[5px] flex items-center justify-center text-[10px] font-black transition-all ${
                    currentPage === page
                      ? "bg-[#7f9bd7] text-white shadow-sm"
                      : "text-slate-400 hover:bg-[#eaf1fb] hover:text-[#7f9bd7]"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#7f9bd7] hover:bg-[#eaf1fb] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              Next
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
