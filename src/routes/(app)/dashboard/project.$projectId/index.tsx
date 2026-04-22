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
  priority: "Urgent" | "High" | "Low";
  status: "open" | "pending" | "resolved" | "closed";
  department: "support" | "sales" | "billing";
  online: boolean;
};

const mockConversations: Conversation[] = [
  // Active (open/pending)
  {
    id: "1",
    name: "Sarah Jenkins",
    initials: "SJ",
    email: "sarah.j@example.com",
    idNumber: "CUS-9284",
    lastMessage: "I'm still having issues logging into my account...",
    timestamp: new Date(),
    unreadCount: 2,
    priority: "Urgent",
    status: "open",
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
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 0,
    priority: "Low",
    status: "pending",
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
    priority: "High",
    status: "open",
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
    priority: "High",
    status: "open",
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
    status: "pending",
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
    priority: "Urgent",
    status: "open",
    department: "support",
    online: true,
  },
  // Inactive (resolved/closed)
  {
    id: "4",
    name: "Tom Richards",
    initials: "TR",
    email: "tom.r@example.com",
    idNumber: "CUS-3379",
    lastMessage: "The recent update seems to have fixed the bug.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unreadCount: 0,
    priority: "Low",
    status: "resolved",
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
    status: "resolved",
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
    status: "closed",
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
    status: "resolved",
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
    priority: "High",
    status: "closed",
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
    status: "closed",
    department: "billing",
    online: false,
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
    status: "open",
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
    status: "pending",
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
    priority: "High",
    status: "open",
    department: "sales",
    online: true,
  },
];

function ProjectPage() {
  const { project } = Route.useRouteContext();
  const [copied, setCopied] = useState(false);
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

  // Category filter
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryPopupRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter conversations based on search, status, priority, category
  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch =
      searchTerm === "" ||
      conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter: active = open or pending, inactive = resolved or closed
    const isActive = conv.status === "open" || conv.status === "pending";
    const matchesStatus = selectedStatus === "all" ? true : selectedStatus === "active" ? isActive : !isActive;

    // Priority filter
    const matchesPriority =
      selectedPriority === "all" || conv.priority.toLowerCase() === selectedPriority.toLowerCase();

    // Category filter
    const matchesCategory = selectedCategory === "all" || conv.department === selectedCategory.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedConversations = filteredConversations.slice(startIndex, endIndex);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPriority, selectedCategory, setCurrentPage]);

  // Helper: format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
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
      // Category dropdown
      if (
        categoryPopupRef.current &&
        !categoryPopupRef.current.contains(event.target as Node) &&
        categoryButtonRef.current &&
        !categoryButtonRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyToClipboard}>
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Active Chats Card – clickable */}
          <Card
            className="border-foreground/10 bg-card/50 shadow-xs rounded-[5px] cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setSelectedStatus("active")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
              <CardTitle className="text-xs font-medium">Active Chats</CardTitle>
              <MessageSquare className="h-3.5 w-3.5 text-blue-500 opacity-70" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-xl font-bold text-foreground">
                {mockConversations.filter((conv) => conv.status === "open" || conv.status === "pending").length}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                {filteredConversations.length} match current filters
              </p>
            </CardContent>
          </Card>

          {/* Average Response Time – mock */}
          <Card className="border-foreground/10 bg-card/50 shadow-xs rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
              <CardTitle className="text-xs font-medium">Avg. Response Time</CardTitle>
              <Clock className="h-3.5 w-3.5 text-orange-500 opacity-70" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-xl font-bold text-foreground">4.2m</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                -0.8m from last week
              </p>
            </CardContent>
          </Card>

          {/* Daily Messages – mock */}
          <Card className="border-foreground/10 bg-card/50 shadow-xs rounded-[5px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2">
              <CardTitle className="text-xs font-medium">Daily Messages</CardTitle>
              <BarChart3 className="h-3.5 w-3.5 text-purple-500 opacity-70" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-xl font-bold text-foreground">142</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                +12% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-0 py-2">
          <div className="flex flex-row items-center gap-2 p-1.5 bg-surface-container-lowest rounded-[8px] shadow-sm border border-foreground/10">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-sm font-medium text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
                >
                  Status: {selectedStatus === "all" ? "All" : selectedStatus === "active" ? "Active" : "Inactive"}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {statusOpen && (
                  <div
                    ref={statusPopupRef}
                    className="absolute top-full left-0 mt-1 w-32 bg-background rounded-[5px] shadow-lg border border-foreground/10 z-50 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("all");
                        setStatusOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between"
                    >
                      All {selectedStatus === "all" && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("active");
                        setStatusOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between"
                    >
                      Active {selectedStatus === "active" && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("inactive");
                        setStatusOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between"
                    >
                      Inactive {selectedStatus === "inactive" && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Priority Dropdown */}
              <div className="relative">
                <button
                  ref={priorityButtonRef}
                  type="button"
                  onClick={() => setPriorityOpen(!priorityOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-sm font-medium text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
                >
                  Priority:{" "}
                  {selectedPriority === "all"
                    ? "All"
                    : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {priorityOpen && (
                  <div
                    ref={priorityPopupRef}
                    className="absolute top-full left-0 mt-1 w-32 bg-background rounded-[5px] shadow-lg border border-foreground/10 z-50 py-1"
                  >
                    {["all", "urgent", "high", "low"].map((priority) => (
                      <button
                        type="button"
                        key={priority}
                        onClick={() => {
                          setSelectedPriority(priority);
                          setPriorityOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between capitalize"
                      >
                        {priority === "all" ? "All" : priority}
                        {selectedPriority === priority && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <button
                  ref={categoryButtonRef}
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-sm font-medium text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
                >
                  Category: {selectedCategory === "all" ? "All" : selectedCategory}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {categoryOpen && (
                  <div
                    ref={categoryPopupRef}
                    className="absolute top-full left-0 mt-1 w-32 bg-background rounded-[5px] shadow-lg border border-foreground/10 z-50 py-1"
                  >
                    {["All", "Support", "Sales", "Billing"].map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCategoryOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between capitalize"
                      >
                        {cat}
                        {selectedCategory === cat && <Check className="h-3.5 w-3.5 text-primary" />}
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
                    const isActive = conv.status === "open" || conv.status === "pending";
                    const statusColor = isActive ? "bg-green-500" : "bg-gray-400";
                    const categoryMap: Record<string, string> = {
                      support: "Support",
                      sales: "Sales",
                      billing: "Billing",
                    };
                    const category = categoryMap[conv.department] || conv.department;
                    return (
                      <div
                        key={conv.id}
                        className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-start gap-3 group"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {conv.initials}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="font-medium text-sm text-foreground truncate">{conv.name}</span>
                            {conv.priority && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  conv.priority === "Urgent"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : conv.priority === "High"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                }`}
                              >
                                {conv.priority}
                              </span>
                            )}
                          </div>
                          <div className="mb-1">
                            <span className="text-xs text-muted-foreground">{category}</span>
                          </div>
                          <p className="text-xs text-foreground/80 truncate">
                            {conv.lastMessage.length > 70
                              ? conv.lastMessage.substring(0, 70) + "..."
                              : conv.lastMessage}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(conv.timestamp)}
                          </span>
                          {conv.unreadCount > 0 && (
                            <div className="min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm">
                              {conv.unreadCount}
                            </div>
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
                        className={!hasPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                            className="h-7 w-7 text-xs cursor-pointer"
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
                        className={!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
