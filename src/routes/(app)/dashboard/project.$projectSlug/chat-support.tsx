import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Flag,
  Hash,
  Info,
  ListFilter,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketPriorityBadge } from "@/components/ui/ticket-priority";
import { useToast } from "@/components/ui/toast";
import { useNotification } from "@/contexts/notification-context";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { useSocket } from "@/hooks/use-socket";
import { useViewport } from "@/hooks/use-viewport";
import { formatDate, formatRelative } from "@/lib/format-date";
import { EventType } from "@/lib/notifier/core";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import type { ProjectTicketSummary, TicketInboxScope } from "@/modules/ticket/ticket.schema";
import { ticketInboxQueries } from "@/modules/ticket/ticket-inbox.queries";
import { ticketMessageQueries } from "@/modules/ticket-message/ticket-message.queries";
import { assignTicketFn, updateTicketStatusFn } from "./tickets";

function ChatSupportLoadingFallback() {
  return (
    <div className="flex h-full w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* TICKET LIST SIDEBAR SKELETON */}
      <aside className="border-r border-border bg-background flex-col w-full md:w-80 flex">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto p-2 space-y-2">
          {[...Array(6)].map((id) => (
            <div key={id} className="p-3 border border-transparent rounded-md flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-3 w-12 shrink-0" />
              </div>
              <div className="flex justify-between items-center gap-2 mt-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ACTIVE CHAT AREA SKELETON */}
      <main className="flex-1 flex-col bg-background relative hidden md:flex">
        <header className="h-16 border-b border-border flex justify-between items-center px-3 md:px-6 bg-background shadow-sm z-10 gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-sm shrink-0" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="lg:hidden w-9 h-9 rounded-sm shrink-0" />
        </header>

        {/* Message History */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/20">
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-16 w-[80%] md:w-[60%] rounded-2xl rounded-tl-none" />
            <Skeleton className="h-3 w-16 mt-1 ml-1" />
          </div>

          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-12 w-[70%] md:w-[45%] rounded-2xl rounded-tr-none" />
            <Skeleton className="h-3 w-20 mt-1 mr-1" />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-24 w-[85%] md:w-[65%] rounded-2xl rounded-tl-none" />
            <Skeleton className="h-3 w-16 mt-1 ml-1" />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 md:p-4 bg-background border-t border-border">
          <div className="flex items-end gap-2 bg-muted/50 border border-input rounded-lg p-1.5 md:p-2">
            <Skeleton className="w-9 h-9 rounded-md shrink-0" />
            <Skeleton className="flex-1 h-9 bg-transparent" />
            <Skeleton className="w-9 h-9 rounded-md shrink-0" />
          </div>
        </div>
      </main>

      {/* TICKET DETAILS SKELETON (Desktop Only) */}
      <aside className="hidden lg:flex w-72 bg-background border-l border-border h-full flex-col shrink-0">
        <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto no-scrollbar h-[calc(100vh-65px)]">
          <div className="flex flex-col items-center text-center gap-3">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="w-full flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-24 rounded-sm" />
            </div>
          </div>

          <hr className="border-border" />

          <ul className="space-y-5">
            {[...Array(4)].map((id) => (
              <li key={id} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-[90%]" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export const Route = createFileRoute("/(app)/dashboard/project/$projectSlug/chat-support")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  pendingComponent: ChatSupportLoadingFallback,
  component: ProjectChatSupportPage,
});

// Two messages belong to the same visual group when same sender within 30s.
const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

const getStatusIndicator = (status: string) => {
  return status === "OPEN" ? (
    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></span>
  ) : (
    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0"></span>
  );
};

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];

function TicketStatusFilter({
  statusFilter,
  onChange,
}: {
  statusFilter: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}) {
  const activeLabel = STATUS_FILTERS.find((o) => o.value === statusFilter)?.label ?? "All";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Filter conversations by status"
      >
        <ListFilter className="size-4" />
        {activeLabel}
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUS_FILTERS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            {option.label}
            {option.value === statusFilter && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SCOPE_FILTERS = [
  { label: "All tickets", value: "ALL" },
  { label: "My tickets", value: "MINE" },
  { label: "Unassigned", value: "UNASSIGNED" },
] as const;

function TicketScopeFilter({
  options,
  scope,
  onChange,
}: {
  options: ReadonlyArray<{ label: string; value: TicketInboxScope }>;
  scope: TicketInboxScope;
  onChange: (scope: TicketInboxScope) => void;
}) {
  const activeLabel = options.find((o) => o.value === scope)?.label ?? options[0]?.label ?? "My tickets";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Scope tickets by assignee"
      >
        <Users className="size-4" />
        {activeLabel}
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            {option.label}
            {option.value === scope && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectChatSupportPage() {
  const { authSession, role, memberId, project } = Route.useRouteContext();
  const projectId = project.id;
  const queryClient = useQueryClient();
  const { markAsRead } = useNotification();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const debouncedSearchQuery = useDebounce(searchQuery);

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showDesktopDetails, setShowDesktopDetails] = useState(true);

  // Admins/owners get the full assignee scope (all/my/unassigned); agents get only
  // their own tickets plus the unassigned pool so they can pick up intake. The
  // server re-enforces this regardless of what the client submits.
  const isAdmin = hasOrgRole(role, ORG_ROLE.ADMIN);
  const availableScopes = isAdmin ? SCOPE_FILTERS : SCOPE_FILTERS.filter((s) => s.value !== "ALL");
  const [scope, setScope] = useState<TicketInboxScope>(isAdmin ? "ALL" : "MINE");

  // Paginated light list: one row per ticket with a latest-message preview.
  const ticketsQuery = useInfiniteQuery(
    ticketInboxQueries.list({ projectId, search: debouncedSearchQuery, statusFilter, scope }),
  );
  const tickets = ticketsQuery.data?.pages.flatMap((page) => page.tickets) ?? [];

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? tickets[0] ?? null;

  const { isMd, isLg, isMounted } = useViewport();

  // Infinite scroll: fetch the next cursor page only when the sentinel is visible.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = ticketsQuery;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { root: null, threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Realtime: keep the open conversation and the ticket list fresh when new
  // events arrive over socket.io (agent dashboards do not send these messages).
  const { lastMessage } = useSocket({ userId: authSession?.user.id });

  // Latest message timestamp per ticket we've already processed, so a socket
  // reconnect or duplicate event doesn't invalidate (and refetch) a conversation
  // it already has current data for.
  const lastSeenMessageAtRef = useRef<Record<string, number>>({});

  // Mark the open conversation read as soon as it is selected, whether that is the
  // auto-selected first ticket on load or a sidebar click, so the bell clears without
  // having to go through the notification itself.
  useEffect(() => {
    if (selectedTicket?.id) markAsRead(selectedTicket.id);
  }, [selectedTicket?.id, markAsRead]);

  useEffect(() => {
    if (!lastMessage) return;

    if (
      lastMessage.event === EventType.CHAT_MESSAGE &&
      selectedTicket &&
      lastMessage.data?.ticketId === selectedTicket.id
    ) {
      const ticketId = selectedTicket.id;
      const messageAt =
        typeof lastMessage.data.createdAt === "string" ? new Date(lastMessage.data.createdAt).getTime() : NaN;
      const lastSeen = lastSeenMessageAtRef.current[ticketId] ?? 0;
      if (!Number.isNaN(messageAt) && messageAt <= lastSeen) return;
      lastSeenMessageAtRef.current[ticketId] = messageAt;
      markAsRead(ticketId);
      queryClient.invalidateQueries({ queryKey: ticketMessageQueries.getByTicket(ticketId).queryKey });
    }

    if (
      lastMessage.event === EventType.TICKET_CREATED ||
      lastMessage.event === EventType.TICKET_STATUS_CHANGED ||
      lastMessage.event === EventType.TICKET_ASSIGNED
    ) {
      queryClient.invalidateQueries({ queryKey: ticketInboxQueries.listPrefix(projectId) });
    }
  }, [lastMessage, selectedTicket, queryClient, projectId, markAsRead]);

  if (!isMounted) {
    return <ChatSupportLoadingFallback />;
  }

  if (ticketsQuery.isPending && tickets.length === 0) {
    return <ChatSupportLoadingFallback />;
  }

  return (
    <div className="flex h-full w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* TICKET LIST SIDEBAR */}
      <aside
        className={`border-r border-border bg-background flex-col min-h-0 ${isMd ? "w-80 flex" : `w-full ${selectedTicketId ? "hidden" : "flex"}`}`}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Chat Support</h2>
            {ticketsQuery.isFetching && !ticketsQuery.isFetchingNextPage && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <TicketStatusFilter
              statusFilter={statusFilter}
              onChange={(value) => {
                setSelectedTicketId(null);
                setStatusFilter(value);
              }}
            />
            <TicketScopeFilter
              options={availableScopes}
              scope={scope}
              onChange={(value) => {
                setSelectedTicketId(null);
                setScope(value);
              }}
            />
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
            />
          </div>
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
          {tickets.length === 0 ? (
            <EmptyState title="No conversations found." size="sm" className="p-4" />
          ) : (
            tickets.map((ticket) => (
              <button
                type="button"
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`w-full text-left p-3 border rounded-md cursor-pointer flex flex-col gap-1 transition-all ${selectedTicket?.id === ticket.id ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-background border-transparent hover:bg-muted/50"}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {ticket.customer.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-foreground truncate">{ticket.customer.name}</span>
                    {ticket.customer.language ? (
                      <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {ticket.customer.language}
                      </span>
                    ) : null}
                    {getStatusIndicator(ticket.status)}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 pl-1">
                    {formatRelative(ticket.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                    {ticket.latestMessage?.content || `Ticket #${ticket.referenceNumber.slice(0, 8)}`}
                  </p>
                  <div className="shrink-0">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              </button>
            ))
          )}

          {hasNextPage && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-2">
              {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          )}
        </div>
      </aside>

      {/* ACTIVE CHAT AREA */}
      {selectedTicket ? (
        <main
          className={`flex-1 flex flex-col min-h-0 bg-background transition-all duration-300 ease-in-out ${isMd || selectedTicketId ? "flex" : "hidden"}`}
        >
          <ChatWindow
            ticket={selectedTicket}
            projectId={projectId}
            role={role}
            memberId={memberId}
            isMd={isMd}
            onBack={() => setSelectedTicketId(null)}
            onToggleDetails={() => (isLg ? setShowDesktopDetails((v) => !v) : setShowMobileDetails(true))}
          />
        </main>
      ) : tickets.length === 0 ? (
        <main className="flex-1 flex-col bg-background relative hidden md:flex">
          <EmptyState
            icon={
              <div className="bg-muted p-4 rounded-full">
                <MessageCircle className="text-muted-foreground" size={48} />
              </div>
            }
            title="No conversations yet"
            description="When customers start chatting, their conversations will appear here."
            className="h-full"
          />
        </main>
      ) : null}

      {/* TICKET DETAILS */}
      {tickets.length > 0 && (
        <aside
          className={`flex h-full transition-all duration-300 ease-in-out ${
            isLg
              ? `relative shadow-none ${showDesktopDetails ? "w-72" : "w-0"}`
              : `fixed inset-y-0 right-0 z-50 ${showMobileDetails ? "translate-x-0 shadow-2xl" : "translate-x-full"}`
          }`}
        >
          <div className="w-72 max-w-[85vw] bg-background border-l border-border h-full flex flex-col shrink-0">
            <div className={`${isMd ? "p-5" : "p-4"} border-b border-border/50 flex justify-between items-center`}>
              <h3 className="text-sm font-bold text-foreground uppercase truncate pr-2">Ticket &amp; Customer</h3>
              {!isLg && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0 p-1 bg-muted/50 rounded-md"
                  onClick={() => setShowMobileDetails(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {selectedTicket && (
              <div className={`${isMd ? "p-6" : "p-4"} space-y-6 overflow-y-auto no-scrollbar h-[calc(100vh-65px)]`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-inner uppercase shrink-0">
                    {selectedTicket.customer.name.charAt(0)}
                  </div>
                  <div className="w-full min-w-0">
                    <h4 className="font-bold text-foreground text-lg break-words">{selectedTicket.customer.name}</h4>
                    {selectedTicket.customer.language && (
                      <span className="text-xs font-semibold px-2 py-1 bg-muted text-muted-foreground rounded-sm border border-border mt-1 inline-block truncate max-w-full">
                        Speaks: {selectedTicket.customer.language}
                      </span>
                    )}
                  </div>
                </div>

                <hr className="border-border" />

                <ul className="space-y-5">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Ticket</p>
                      <p className="font-medium text-foreground truncate">{selectedTicket.referenceNumber}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      {getStatusIndicator(selectedTicket.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Status</p>
                      <p className="font-medium text-foreground truncate">
                        {selectedTicket.status === "OPEN" ? "Open" : "Closed"}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Priority</p>
                      <p className="mt-0.5">
                        <TicketPriorityBadge priority={selectedTicket.priority} />
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Customer Rating</p>
                      <p className="font-medium text-foreground truncate">
                        {selectedTicket.satisfactionScore != null
                          ? `${selectedTicket.satisfactionScore}/5`
                          : "Not rated"}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Email Address</p>
                      <p className="font-medium text-foreground truncate">{selectedTicket.customer.email}</p>
                    </div>
                  </li>
                  {selectedTicket.customer.metadata ? (
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase font-bold text-muted-foreground truncate">Source</p>
                        <p className="font-medium text-foreground truncate">{selectedTicket.customer.metadata}</p>
                      </div>
                    </li>
                  ) : null}
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Customer Since</p>
                      <p className="font-medium text-foreground truncate">
                        {formatDate(selectedTicket.customer.createdAt)}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}

      {showMobileDetails && !isLg && (
        <button
          type="button"
          className="fixed inset-0 bg-foreground/20 z-40 backdrop-blur-sm"
          onClick={() => setShowMobileDetails(false)}
        />
      )}
    </div>
  );
}

interface ChatWindowProps {
  ticket: ProjectTicketSummary;
  projectId: string;
  role: string | null;
  memberId: string | null;
  isMd: boolean | null;
  onBack: () => void;
  onToggleDetails: () => void;
}

function ChatWindow({ ticket, projectId, role, memberId, isMd, onBack, onToggleDetails }: ChatWindowProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusAction, setStatusAction] = useState<"CLOSED" | "OPEN" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const { data: messages, isLoading: messagesLoading } = useQuery(ticketMessageQueries.getByTicket(ticket.id));

  const list = messages ?? [];

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Auto-scroll to bottom when messages change, if user is near bottom.
  // Also resets scroll position on ticket switch.
  const prevTicketIdRef = useRef(ticket.id);
  useEffect(() => {
    if (prevTicketIdRef.current !== ticket.id) {
      prevTicketIdRef.current = ticket.id;
      isNearBottomRef.current = true;
      scrollToBottom(false);
      return;
    }
    if (isNearBottomRef.current) {
      scrollToBottom(list.length > 0);
    }
  }, [list.length, scrollToBottom, ticket.id]);

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatusFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ticketInboxQueries.listPrefix(variables.data.projectId),
      });
    },
    onError: () => toast("Failed to update status."),
  });

  const assignMutation = useMutation({
    mutationFn: assignTicketFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketInboxQueries.listPrefix(projectId) });
    },
    onError: () => toast("Failed to assign ticket."),
  });

  const canEditStatus = hasOrgRole(role, ORG_ROLE.ADMIN) || ticket.assignedAgentId === memberId;

  // Agents can pick up an unassigned ticket straight from the chat window. Admins
  // assign from the Tickets page instead, so the button is agent-only.
  const canTakeTicket = !hasOrgRole(role, ORG_ROLE.ADMIN) && ticket.assignedAgentId === null && memberId !== null;

  return (
    <div className="relative flex flex-1 flex-col min-h-0 h-full overflow-hidden">
      <header className={`h-16 flex justify-between items-center ${isMd ? "px-6" : "px-3"} bg-muted/50 z-20 gap-2 shrink-0 relative`}>
        <div className={`flex items-center ${isMd ? "gap-3" : "gap-2"} flex-1 min-w-0`}>
          {!isMd && (
            <button
              type="button"
              className="flex items-center gap-1.5 p-1.5 -ml-1 text-muted-foreground shrink-0 hover:bg-muted rounded-md transition-colors"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Conversations</span>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-foreground truncate">{ticket.customer.name}</h1>
              <div className="shrink-0">
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {getStatusIndicator(ticket.status)}
              <span className="truncate">
                {ticket.referenceNumber} • {ticket.status === "OPEN" ? "Active" : "Closed"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEditStatus && (
            <button
              type="button"
              onClick={() => setStatusAction(ticket.status === "OPEN" ? "CLOSED" : "OPEN")}
              disabled={updateStatusMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-sm bg-background border border-border hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {updateStatusMutation.isPending && <Loader2 className="animate-spin size-3.5" />}
              {ticket.status === "OPEN" ? "Close" : "Reopen"}
            </button>
          )}
          {canTakeTicket && (
            <button
              type="button"
              onClick={() =>
                assignMutation.mutate({ data: { projectId, ticketId: ticket.id, assignedAgentId: memberId } })
              }
              disabled={assignMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-sm bg-background border border-border hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {assignMutation.isPending && <Loader2 className="animate-spin size-3.5" />}
              Take
            </button>
          )}
          <button
            type="button"
            className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm shrink-0 transition-colors cursor-pointer"
            onClick={onToggleDetails}
            title="Toggle ticket details"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Body: message pane (z-0, absolutely filled + scrollable) with the
          input bar layered on top (z-10, pinned to the bottom). Using absolute
          positioning here means the input's position is independent of flex
          height propagation from ancestors — it can never get pushed down by
          message content growth, even if some outer container fails to cap
          its height. */}
      <div className="relative flex-1 min-h-0">
        {/* Message History — z-0, sits underneath the input bar */}
        <div
          ref={scrollRef}
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          }}
          className={`no-scrollbar absolute inset-0 z-0 overflow-y-auto ${isMd ? "p-6" : "p-4"} pb-24 md:pb-28 space-y-6`}
        >
          <AgentMessageList messages={list} isLoading={messagesLoading} />
        </div>

        {/* Chat Input — z-10, raised slightly off the bottom edge, always on top of messages */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-background border-t border-border">
          {ticket.status === "CLOSED" ? (
            <div className="p-3">
              <div className="text-center p-3 text-sm text-muted-foreground bg-muted rounded-lg border border-border">
                This ticket is closed. Reopen it to continue the conversation.
              </div>
            </div>
          ) : (
            <ReplyInput
              ticketId={ticket.id}
              projectId={projectId}
              customerName={ticket.customer.name}
              customerLanguage={ticket.customer.language}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ticketMessageQueries.getByTicket(ticket.id).queryKey,
                });
                queryClient.invalidateQueries({
                  queryKey: ticketInboxQueries.listPrefix(projectId),
                });
              }}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={statusAction !== null}
        onClose={() => setStatusAction(null)}
        title={statusAction === "CLOSED" ? "Close this ticket?" : "Reopen this ticket?"}
        message={
          statusAction === "CLOSED"
            ? "The customer won't be able to send messages on this conversation once it's closed."
            : "Reopening this ticket lets the customer send messages on this conversation again."
        }
        confirmLabel={statusAction === "CLOSED" ? "Close" : "Reopen"}
        cancelLabel="Cancel"
        variant="default"
        isPending={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusAction) return;
          updateStatusMutation.mutate({
            data: {
              projectId,
              ticketId: ticket.id,
              status: statusAction,
            },
          });
          setStatusAction(null);
        }}
      />
    </div>
  );
}

const AgentMessageList = ({ messages, isLoading }: { messages: TicketMessage[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full">
        <EmptyState
          icon={
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-full">
              <MessageCircle className="text-blue-500 dark:text-blue-400" size={32} />
            </div>
          }
          title="Waiting for the customer"
          description="Replies from the customer will appear here."
          className="h-full p-6"
        />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col space-y-0.5">
      {messages.map((msg, index) => {
        const isStart = !isSameGroup(messages[index - 1], msg);
        const isEnd = !isSameGroup(msg, messages[index + 1]);
        return <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />;
      })}
    </div>
  );
};
