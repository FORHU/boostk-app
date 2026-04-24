import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  LaptopMinimalCheck,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

// Helper component for trend lines
function Sparkline({ data, color = "#7f9bd7" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 60;
  const height = 20;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / (range || 1)) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Mock conversations data
type Conversation = {
  id: string;
  name: string;
  initials: string;
  email: string;
  idNumber: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  priority: "High" | "Medium" | "Low";
  status: "active" | "inactive";
  department: "support" | "sales" | "billing";
  online: boolean;
};

const mockConversations: Conversation[] = [
  // Active
  {
    id: "1",
    name: "Sarah Jenkins",
    initials: "SJ",
    email: "sarah.j@example.com",
    idNumber: "CUS-9284",
    lastMessage: "I am writing to report a recurring issue with my account synchronization that has been persistent for the past few days.",
    timestamp: new Date(),
    unreadCount: 2,
    priority: "High",
    status: "active",
    department: "support",
    online: true,
  },
  {
    id: "2",
    name: "Marcus West",
    initials: "MW",
    email: "marcus.w@example.com",
    idNumber: "CUS-4521",
    lastMessage: "Thank you for the update on the shipping times.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    unreadCount: 0,
    priority: "Low",
    status: "active",
    department: "sales",
    online: false,
  },
  {
    id: "3",
    name: "Elena Petrova",
    initials: "EP",
    email: "elena.p@example.com",
    idNumber: "CUS-8112",
    lastMessage: "Can we schedule a call to discuss the enterprise plan?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 1,
    priority: "Medium",
    status: "active",
    department: "sales",
    online: true,
  },
  {
    id: "5",
    name: "Linda Chen",
    initials: "LC",
    email: "linda.c@example.com",
    idNumber: "CUS-2345",
    lastMessage: "My invoice shows an incorrect amount.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    unreadCount: 3,
    priority: "Medium",
    status: "active",
    department: "billing",
    online: true,
  },
  {
    id: "6",
    name: "James Wilson",
    initials: "JW",
    email: "james.w@example.com",
    idNumber: "CUS-6789",
    lastMessage: "When will the new feature be released?",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 0,
    priority: "Low",
    status: "active",
    department: "sales",
    online: false,
  },
  {
    id: "7",
    name: "Anna Schmidt",
    initials: "AS",
    email: "anna.s@example.com",
    idNumber: "CUS-9987",
    lastMessage: "I'm locked out of my account.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 1,
    priority: "High",
    status: "active",
    department: "support",
    online: true,
  },
  {
    id: "13",
    name: "Noah Adams",
    initials: "NA",
    email: "noah.a@example.com",
    idNumber: "CUS-1357",
    lastMessage: "I haven't received my order confirmation yet.",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    unreadCount: 1,
    priority: "Low",
    status: "active",
    department: "support",
    online: true,
  },
  {
    id: "14",
    name: "Isabella Garcia",
    initials: "IG",
    email: "isabella.g@example.com",
    idNumber: "CUS-2468",
    lastMessage: "Is there a student discount available?",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    unreadCount: 0,
    priority: "Low",
    status: "active",
    department: "sales",
    online: false,
  },
  {
    id: "15",
    name: "William Taylor",
    initials: "WT",
    email: "william.t@example.com",
    idNumber: "CUS-3579",
    lastMessage: "My business account setup is stuck.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 4,
    priority: "Medium",
    status: "active",
    department: "sales",
    online: true,
  },
  // Inactive
  {
    id: "4",
    name: "Tom Richards",
    initials: "TR",
    email: "tom.r@example.com",
    idNumber: "CUS-3379",
    lastMessage: "The recent update seems to have fixed the bug.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
    unreadCount: 0,
    priority: "Low",
    status: "inactive",
    department: "support",
    online: false,
  },
  {
    id: "8",
    name: "David Kim",
    initials: "DK",
    email: "david.k@example.com",
    idNumber: "CUS-1123",
    lastMessage: "Thanks for resolving my issue.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    unreadCount: 0,
    priority: "Low",
    status: "inactive",
    department: "support",
    online: false,
  },
  {
    id: "9",
    name: "Olivia Martinez",
    initials: "OM",
    email: "olivia.m@example.com",
    idNumber: "CUS-4456",
    lastMessage: "Please call me about billing.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    unreadCount: 0,
    priority: "Low",
    status: "inactive",
    department: "billing",
    online: false,
  },
  {
    id: "10",
    name: "Ethan Wong",
    initials: "EW",
    email: "ethan.w@example.com",
    idNumber: "CUS-7789",
    lastMessage: "The new feature works perfectly.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120),
    unreadCount: 0,
    priority: "Low",
    status: "inactive",
    department: "support",
    online: false,
  },
  {
    id: "11",
    name: "Sophia Lee",
    initials: "SL",
    email: "sophia.l@example.com",
    idNumber: "CUS-9901",
    lastMessage: "Please reopen my ticket.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144),
    unreadCount: 0,
    priority: "Medium",
    status: "inactive",
    department: "sales",
    online: false,
  },
  {
    id: "12",
    name: "Liam O'Connor",
    initials: "LO",
    email: "liam.o@example.com",
    idNumber: "CUS-2234",
    lastMessage: "Cancel my subscription.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168),
    unreadCount: 0,
    priority: "Low",
    status: "inactive",
    department: "billing",
    online: false,
  },
];

function ProjectPage() {
  const { project } = Route.useRouteContext();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Helper for copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [origin, setOrigin] = useState("");
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Status filter (Active/Inactive/All)
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const statusPopupRef = useRef<HTMLDivElement>(null);

  // Priority filter
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const priorityButtonRef = useRef<HTMLButtonElement>(null);
  const priorityPopupRef = useRef<HTMLDivElement>(null);

  // Tags filter
  const [tagOpen, setTagOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("all");
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const tagPopupRef = useRef<HTMLDivElement>(null);

  // Sorting
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "unread" | "read">("recent");
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortPopupRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter conversations based on search, status, priority, tags
  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch =
      searchTerm === "" ||
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter: active or inactive directly
    const matchesStatus = selectedStatus === "all" ? true : conv.status === selectedStatus;

    // Priority filter
    const matchesPriority =
      selectedPriority === "all" || conv.priority.toLowerCase() === selectedPriority.toLowerCase();

    // Tags filter
    const matchesTag = selectedTag === "all" || conv.department === selectedTag.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority && matchesTag;
  });

  // Apply Sorting
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (sortBy === "unread") {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    }
    if (sortBy === "read") {
      if (a.unreadCount === 0 && b.unreadCount > 0) return -1;
      if (a.unreadCount > 0 && b.unreadCount === 0) return 1;
    }
    // Default: Sort by recent
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedConversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedConversations = sortedConversations.slice(startIndex, endIndex);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPriority, selectedTag, setCurrentPage]);

  // Helper: format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"}`;
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Status dropdown
      if (
        statusPopupRef.current &&
        !statusPopupRef.current.contains(event.target as Node) &&
        statusButtonRef.current &&
        !statusButtonRef.current.contains(event.target as Node)
      ) {
        setStatusOpen(false);
      }
      // Priority dropdown
      if (
        priorityPopupRef.current &&
        !priorityPopupRef.current.contains(event.target as Node) &&
        priorityButtonRef.current &&
        !priorityButtonRef.current.contains(event.target as Node)
      ) {
        setPriorityOpen(false);
      }
      // Tags dropdown
      if (
        tagOpen &&
        tagPopupRef.current &&
        !tagPopupRef.current.contains(event.target as Node) &&
        tagButtonRef.current &&
        !tagButtonRef.current.contains(event.target as Node)
      ) {
        setTagOpen(false);
      }
      // Installation popup
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        installButtonRef.current &&
        !installButtonRef.current.contains(event.target as Node)
      ) {
        setShowInstallPopup(false);
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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Escape key closes popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowInstallPopup(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const snippet = `<script src="${origin}/support/${project.id}/widget.js" async></script>`;


  // Generate page numbers for shadcn pagination (simplified: show first, current, last)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="px-4 sm:px-6 md:px-8 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-[10px]">
              <AvatarImage src={project.logo || "/avatars/laugh-orange-cat.gif"} />
              <AvatarFallback className="rounded-[10px] bg-primary/10 text-primary font-bold text-lg">
                {project.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs uppercase">{project.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Live & Accepting Chats
                </span>
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Quick Installation Button with Popup */}
            <div className="relative">
              <Button
                ref={installButtonRef}
                variant="outline"
                size="sm"
                className="h-9 rounded-[5px]"
                onClick={() => setShowInstallPopup(!showInstallPopup)}
              >
                <LaptopMinimalCheck className="mr-2 h-4 w-4" />
                Quick Installation
              </Button>
              {showInstallPopup && (
                <div
                  ref={popupRef}
                  className="absolute top-full left-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-background rounded-[10px] shadow-2xl border border-foreground/10 z-50"
                >
                  <div className="flex items-center justify-between p-3 border-b border-foreground/10">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Quick Installation</h3>
                      <p className="text-xs text-muted-foreground">Add this snippet to your website's header</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInstallPopup(false)}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-3 space-y-3">
                    <div>
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(snippet)}>
                            {copied ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
                          </Button>
                        </div>
                        <pre className="p-3 pr-16 rounded-lg bg-muted/80 border border-foreground/5 overflow-x-auto text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-all">
                          {snippet}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Manual Direct Link</h4>
                      <div className="flex items-center justify-between p-2 rounded-lg border border-foreground/5 bg-muted/30">
                        <code className="text-[11px] truncate max-w-[200px] md:max-w-[220px] opacity-70">
                          {`${origin}/support/${project.id}/chat-widget`}
                        </code>
                        <a
                          href={`/support/${project.id}/chat-widget`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0 ml-2"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 pt-0 border-t border-foreground/10 mt-1">
                    <p className="text-xs text-muted-foreground italic">
                      Need help? <span className="text-primary cursor-pointer hover:underline">Integration docs</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" className="h-9 rounded-[5px]">
              <Settings className="mr-2 h-4 w-4" />
              Project Settings
            </Button>
            <a href={`/support/${project.id}/chat-widget`} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-[5px]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Test Chat Widget
                <ExternalLink className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </a>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Active Chats Card */}
          <Card
            className="border-[#7f9bd7]/20 shadow-sm rounded-[5px] cursor-pointer "
            onClick={() => setSelectedStatus("active")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-[10px] font-bold text-[#91a2c9] uppercase tracking-widest opacity-100">Active Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-[#0037b0]" />
            </CardHeader>
            <CardContent className="pt-0 pb-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-[#0037b0]">
                  {mockConversations.filter((conv) => conv.status === "active").length}
                </div>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +12% from yesterday
                </p>
              </div>
              <div className="pb-1">
                <Sparkline data={[12, 15, 14, 18, 16, 22, 20]} color="#7f9bd7" />
              </div>
            </CardContent>
          </Card>

          {/* Average Response Time Card */}
          <Card className="border-[#7f9bd7]/20 bg-white shadow-sm rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-[#7f9bd7]" />
            </CardHeader>
            <CardContent className="pt-0 pb-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">2.4<span className="text-sm font-medium ml-0.5">m</span></div>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <BarChart3 className="h-3 w-3 text-[#7f9bd7]" />
                  Faster than avg.
                </p>
              </div>
              <div className="pb-1">
                <Sparkline data={[5, 4, 6, 3, 4, 2, 2.4]} color="#0037b0" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Messages Card */}
          <Card className="border-[#7f9bd7]/20 bg-white shadow-sm rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Volume</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500/70" />
            </CardHeader>
            <CardContent className="pt-0 pb-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">142</div>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  +8.4% growth
                </p>
              </div>
              <div className="pb-1">
                <Sparkline data={[100, 110, 105, 120, 135, 130, 142]} color="#7f9bd7" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-0 py-2">
          <div className="flex flex-row items-center gap-2 p-1 bg-white rounded-[5px] shadow-sm border border-[#7f9bd7]/30">
            <div className="flex-1 relative flex items-center min-w-[200px]">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for Agents, Customers, Departments or keywords..."
                className="w-full pl-10 pr-4 py-2 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-px h-6 bg-foreground/10 mx-1 hidden sm:block" />
            <div className="hidden sm:flex flex-row items-center gap-2 pr-2">
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  ref={statusButtonRef}
                  type="button"
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-[#e8f0fa] transition-all whitespace-nowrap"
                >
                  <span className="opacity-60 uppercase tracking-wider">Status:</span>
                  <span className="text-slate-900 capitalize">{selectedStatus}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${statusOpen ? "rotate-180" : "opacity-40"}`} />
                </button>
                {statusOpen && (
                  <div
                    ref={statusPopupRef}
                    className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">Select Option</p>
                    {["all", "active", "inactive"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(status);
                          setStatusOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all flex items-center justify-between group ${selectedStatus === status ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {selectedStatus === status && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority Dropdown */}
              <div className="relative">
                <button
                  ref={priorityButtonRef}
                  type="button"
                  onClick={() => setPriorityOpen(!priorityOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-[#e8f0fa] transition-all whitespace-nowrap"
                >
                  <span className="opacity-60 uppercase tracking-wider">Priority:</span>
                  <span className="text-slate-900 capitalize">
                    {selectedPriority === "all" ? "All" : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${priorityOpen ? "rotate-180" : "opacity-40"}`} />
                </button>

                {priorityOpen && (
                  <div
                    ref={priorityPopupRef}
                    className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">Select Priority</p>
                    {["all", "high", "medium", "low"].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all capitalize ${selectedPriority === priority ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"}`}
                        onClick={() => {
                          setSelectedPriority(priority);
                          setPriorityOpen(false);
                        }}
                      >
                        {priority}
                        {selectedPriority === priority && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags Dropdown */}
              <div className="relative">
                <button
                  ref={tagButtonRef}
                  type="button"
                  onClick={() => setTagOpen(!tagOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold text-slate-600 hover:bg-[#e8f0fa] transition-all whitespace-nowrap"
                >
                  <span className="opacity-60 uppercase tracking-wider">Tags:</span>
                  <span className="text-slate-900 capitalize">{selectedTag === "all" ? "All" : selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${tagOpen ? "rotate-180" : "opacity-40"}`} />
                </button>

                {tagOpen && (
                  <div
                    ref={tagPopupRef}
                    className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">Select Tag</p>
                    {["all", "support", "sales", "billing"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all capitalize ${selectedTag === tag ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"}`}
                        onClick={() => {
                          setSelectedTag(tag);
                          setTagOpen(false);
                        }}
                      >
                        {tag}
                        {selectedTag === tag && <Check className="h-3.5 w-3.5" />}
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
                  <span className="text-slate-900 capitalize">{sortBy}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${sortOpen ? "rotate-180" : "opacity-40"}`} />
                </button>

                {sortOpen && (
                  <div
                    ref={sortPopupRef}
                    className="absolute top-full right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-[5px] shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 overflow-hidden"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold text-[#7f9bd7] uppercase tracking-widest border-b border-slate-50 mb-1">Sort By</p>
                    {["recent", "unread", "read"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 text-[11px] rounded-[5px] font-bold transition-all capitalize ${sortBy === option ? "bg-[#e8f0fa] text-[#0037b0]" : "text-slate-600 hover:bg-slate-50"}`}
                        onClick={() => {
                          setSortBy(option as any);
                          setSortOpen(false);
                        }}
                      >
                        {option}
                        {sortBy === option && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation List - Scrollable */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col border-foreground/10 bg-card/50 shadow-xs rounded-[5px] overflow-hidden">
            <CardHeader className="py-3 px-4 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {selectedStatus === "all"
                    ? "All Chats"
                    : selectedStatus === "active"
                      ? "Active Chats"
                      : "Inactive Chats"}
                </CardTitle>
                <CardDescription className="text-xs">Monitor and manage ongoing support conversations</CardDescription>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-foreground/5">
                Displaying {startIndex + 1}–{Math.min(endIndex, filteredConversations.length)} of{" "}
                {filteredConversations.length}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-foreground/5">
                {displayedConversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No conversations match your filters.
                  </div>
                ) : (
                  displayedConversations.map((conv) => {
                    const isActive = conv.status === "active";
                    const statusColor = isActive ? "bg-green-500" : "bg-gray-400";
                    const tagMap: Record<string, string> = {
                      support: "Support",
                      sales: "Sales",
                      billing: "Billing",
                    };
                    const tag = tagMap[conv.department] || conv.department;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => navigate({ to: `/dashboard/project/${project.id}/chat-support` })}
                        className="px-4 py-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-start gap-3 group border-b border-foreground/5 last:border-0"
                      >
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {conv.initials}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-sm truncate text-slate-900 font-medium">{conv.name}</span>
                            {conv.priority && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${
                                  conv.priority === "High"
                                    ? "bg-red-50 text-red-600 border border-red-100"
                                    : conv.priority === "Medium"
                                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                                      : "bg-[#e8f0fa] text-[#0037b0] border border-[#7f9bd7]/20"
                                }`}
                              >
                                {conv.priority}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider border ${
                              conv.department === "support" 
                                ? "bg-[#7f9bd7]/10 text-[#7f9bd7] border-[#7f9bd7]/20" 
                                : "bg-[#0037b0]/10 text-[#0037b0] border-[#0037b0]/20"
                            }`}>
                              {conv.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-[#7f9bd7] font-bold uppercase tracking-widest">#{conv.idNumber}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(conv.idNumber); }}
                              className="p-1 hover:bg-[#e8f0fa] rounded-[4px] transition-all group/copy"
                            >
                              <Copy className="h-3 w-3 text-slate-300 group-hover/copy:text-[#0037b0]" />
                            </button>
                          </div>
                          <p className={`text-xs truncate mt-1 ${conv.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                            {conv.lastMessage.length > 100
                              ? conv.lastMessage.substring(0, 100) + "..."
                              : conv.lastMessage}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[10px] font-bold whitespace-nowrap uppercase tracking-widest ${conv.unreadCount > 0 ? "text-[#0037b0]" : "text-slate-400"}`}>
                            {formatRelativeTime(conv.timestamp)}
                          </span>
                          {conv.unreadCount > 0 && (
                            <div className="w-2.5 h-2.5 bg-[#0037b0] rounded-full shadow-[0_0_10px_rgba(0,55,176,0.5)] mt-1 animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-center py-2 shrink-0 border-t border-foreground/5">
              {filteredConversations.length > 0 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasPrevious) setCurrentPage(currentPage - 1);
                        }}
                        className={`rounded-[5px] text-xs h-8 px-3 ${!hasPrevious ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}`}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((page, idx) => (
                      <PaginationItem key={page === "ellipsis" ? `ellipsis-${idx}` : page}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page as number);
                            }}
                            className={`h-8 w-8 text-xs rounded-[5px] transition-all border-none ${currentPage === page ? "bg-[#e8f0fa] text-[#0037b0] font-bold cursor-default" : "hover:bg-slate-50 cursor-pointer text-slate-600"}`}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (hasNext) setCurrentPage(currentPage + 1);
                        }}
                        className={`rounded-[5px] text-xs h-8 px-3 ${!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-50"}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
