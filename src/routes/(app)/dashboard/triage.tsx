import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  CircleSlash,
  Inbox,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Star,
} from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { useEffect, useMemo, useState } from "react";
import z from "zod";
import type { TicketMessageWithAttachment } from "@/components/chat-support/TicketChatMessageBubble";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useNotification } from "@/contexts/notification-context";
import { useSocket } from "@/hooks/use-socket";
import { formatRelative } from "@/lib/format-date";
import { EventType } from "@/lib/notifier/core";
import { closeIntakeTicketFn, createTriageMessageFn, routeIntakeTicketFn } from "@/modules/intake/intake.functions";
import { intakeQueries } from "@/modules/intake/intake.queries";
import type { TriageFilter } from "@/modules/intake/intake.schema";

/**
 * BOOSTK-wide triage inbox.
 *
 * Every conversation here arrived through the public /chat route and has no organization
 * yet. Access is gated by `requirePlatformStaffMiddleware` on the server functions this
 * page calls — org roles grant nothing, so an org owner cannot reach another tenant's
 * intake by loading this URL.
 */
const triageSearchSchema = z.object({
  selectedTicketId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/(app)/dashboard/triage")({
  validateSearch: (search) => triageSearchSchema.parse(search),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(intakeQueries.queue());
    context.queryClient.ensureQueryData(intakeQueries.targets());
  },
  component: RouteComponent,
});

/**
 * One line summarising a conversation for the queue list.
 *
 * For an attachment `content` holds the /api/attachments/:id URL rather than text, so
 * printing it directly showed staff a bare URL where the preview should be. Prefers the
 * support-language translation, since the raw text is unreadable to staff when the
 * visitor writes in a language they do not speak.
 */
const queuePreview = (item: {
  latestMessage: { content: string; translatedContent: string | null; contentType: string } | null;
  customer: { metadata: string | null };
}) => {
  const msg = item.latestMessage;
  if (!msg) return item.customer.metadata ?? "No messages yet";
  if (msg.contentType === "IMAGE") return "📷 Photo";
  if (msg.contentType === "FILE") return "📎 File";
  return msg.translatedContent ?? msg.content;
};

const TABS: { value: TriageFilter; label: string }[] = [
  { value: "waiting", label: "Waiting" },
  { value: "forwarded", label: "Forwarded" },
  { value: "closed", label: "Closed" },
];

/** Human label for a close reason, which is stored as a raw slug on `triageNote`. */
const CLOSE_REASON: Record<string, string> = {
  resolved: "Resolved",
  no_fit: "No fit",
  spam: "Spam",
};

// Two messages belong to the same visual group when same sender within 30s.
const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

function RouteComponent() {
  const queryClient = useQueryClient();
  const { selectedTicketId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(selectedTicketId ?? null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TriageFilter>("waiting");

  const { authSession } = Route.useRouteContext();
  const { lastMessage } = useSocket({ userId: authSession?.user.id });
  const { markAsRead } = useNotification();
  const { data: queue, isLoading } = useQuery(intakeQueries.queue(search || undefined, filter));

  // New intake chats and their messages arrive on the staff member's personal channel
  // via publishToPlatformStaff.
  useEffect(() => {
    if (lastMessage?.event === EventType.CHAT_MESSAGE || lastMessage?.event === EventType.TICKET_CREATED) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    }
  }, [lastMessage, queryClient]);

  // Sync the URL search param into local state when it changes (e.g. deep-link from bell).
  useEffect(() => {
    if (selectedTicketId) setSelectedId(selectedTicketId);
  }, [selectedTicketId]);

  const selectTicket = (id: string | null) => {
    setSelectedId(id);
    navigate({ search: { selectedTicketId: id ?? undefined }, replace: true });
    if (id) markAsRead(id, true);
  };

  const items = queue?.items ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-80 shrink-0 border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Inbox size={18} className="text-primary" />
              Global intake
            </h2>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 flex-1">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setFilter(tab.value);
                    selectTicket(null);
                  }}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    filter === tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
            />
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto p-2 space-y-2">
          {items.length === 0 ? (
            <EmptyState
              title={
                filter === "waiting"
                  ? "Nothing waiting."
                  : filter === "forwarded"
                    ? "Nothing forwarded yet."
                    : "Nothing closed yet."
              }
              description={
                filter === "waiting"
                  ? "New chats appear here instantly."
                  : filter === "forwarded"
                    ? "Conversations you route to a project appear here."
                    : "Conversations you resolve or dismiss appear here."
              }
              size="sm"
              className="p-4"
            />
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTicket(item.id)}
                className={`w-full text-left p-3 border rounded-md cursor-pointer flex flex-col gap-1 transition-all ${
                  selectedId === item.id
                    ? "bg-primary/5 border-primary/20 shadow-sm"
                    : "bg-background border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {item.customer.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-foreground truncate">{item.customer.name}</span>
                    {item.customer.language ? (
                      <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.customer.language}
                      </span>
                    ) : null}
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.status === "OPEN"
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 pl-1">{formatRelative(item.updatedAt)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">{queuePreview(item)}</p>
                  <div className="shrink-0">
                    {item.routedTo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                        <Building2 size={10} className="shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {item.routedTo.organizationName} / {item.routedTo.projectName}
                        </span>
                      </span>
                    ) : item.triageNote ? (
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {CLOSE_REASON[item.triageNote] ?? item.triageNote}
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.satisfactionScore != null && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 w-fit">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {item.satisfactionScore}/5
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden bg-muted/20">
        {selectedId ? (
          <TriageDetail key={selectedId} intakeTicketId={selectedId} onDone={() => selectTicket(null)} />
        ) : (
          <EmptyState
            icon={
              <div className="bg-primary/10 p-4 rounded-full">
                <Inbox className="text-primary" size={32} />
              </div>
            }
            title="Select a conversation"
            description="Read it and route it to a project."
            className="h-full p-6"
          />
        )}
      </main>
    </div>
  );
}

function TriageComposer({ intakeTicketId, disabled }: { intakeTicketId: string; disabled: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const sendMutation = useMutation({
    mutationFn: createTriageMessageFn,
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Failed to send.", "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMutation.mutate({ data: { intakeTicketId, content: trimmed } });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-none bg-background border-t border-border px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
    >
      <div className="flex items-end gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reply to the visitor…"
          disabled={disabled || sendMutation.isPending}
          className="flex-1 min-w-0 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 placeholder:text-muted-foreground transition-all"
        />
        <button
          type="submit"
          disabled={!content.trim() || disabled || sendMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-xl shadow-sm active:scale-95 disabled:opacity-50 shrink-0 transition-all"
        >
          {sendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Sent as BOOSTK support, translated into the visitor's language. Ask what they need before routing.
      </p>
    </form>
  );
}

function TriageDetail({ intakeTicketId, onDone }: { intakeTicketId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: thread, isLoading } = useQuery(intakeQueries.thread(intakeTicketId));
  const { data: targets } = useQuery(intakeQueries.targets());

  // The picker resets by remounting — the caller keys this component on the selected
  // conversation, so a project chosen for the previous chat can never be submitted
  // against this one.
  const [organizationId, setOrganizationId] = useState("");
  const [projectId, setProjectId] = useState("");

  const projects = useMemo(
    () => targets?.find((org) => org.id === organizationId)?.projects ?? [],
    [targets, organizationId],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: intakeQueries.all });

  const routeMutation = useMutation({
    mutationFn: routeIntakeTicketFn,
    onSuccess: async () => {
      toast("Conversation routed.", "success");
      await invalidate();
      onDone();
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Failed to route.", "error"),
  });

  const closeMutation = useMutation({
    mutationFn: closeIntakeTicketFn,
    onSuccess: async () => {
      toast("Conversation closed.", "success");
      await invalidate();
      onDone();
    },
    onError: (error) => toast(error instanceof Error ? error.message : "Failed to close.", "error"),
  });

  const isBusy = routeMutation.isPending || closeMutation.isPending;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 flex-none flex items-center justify-between px-6 bg-muted/50 z-10 border-b border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-inner uppercase shrink-0">
            {thread.customer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-foreground truncate">{thread.customer.name}</h1>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  thread.status === "OPEN"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="truncate">
                {thread.referenceNumber} · {thread.customer.email}
                {thread.customer.phone ? ` · ${thread.customer.phone}` : ""}
                {thread.customer.language ? ` · ${thread.customer.language}` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {thread.satisfactionScore != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              Rated {thread.satisfactionScore}/5
            </span>
          )}
        </div>
      </header>

      {/* The intake form's subject is recorded as the visitor's first message, so it
          appears in the thread below — translated — instead of being repeated here
          untranslated. Only older conversations, created before that change, still
          carry it solely on `metadata`. */}
      {thread.customer.metadata && thread.ticketMessages.length === 0 && (
        <div className="px-6 py-2 bg-background border-b border-border">
          <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">{thread.customer.metadata}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 mt-3">
        {thread.ticketMessages.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full">
            <EmptyState
              icon={
                <div className="bg-primary/10 p-4 rounded-full">
                  <MessageCircle className="text-primary" size={32} />
                </div>
              }
              title="Waiting for the visitor"
              description="No messages yet — the visitor filled in the form but hasn't written anything."
              className="h-full p-6"
            />
          </motion.div>
        ) : (
          <div className="flex flex-col space-y-0.5">
            {thread.ticketMessages.map((msg: TicketMessageWithAttachment, index: number) => {
              const isStart = !isSameGroup(thread.ticketMessages[index - 1], msg);
              const isEnd = !isSameGroup(msg, thread.ticketMessages[index + 1]);
              return <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />;
            })}
          </div>
        )}
      </div>

      {/* Reply composer. Triage usually cannot route on the opening message alone —
          "help with my booking" names no project — so staff qualify here first. It also
          covers conversations that fit no project and just need an answer. Hidden once
          routed: from that point the receiving org's agents own the conversation. */}
      {!thread.routedTicket && <TriageComposer intakeTicketId={intakeTicketId} disabled={isBusy} />}

      <footer className="flex-none bg-background border-t border-border p-4">
        {thread.routedTicket ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Building2 size={14} />
            Already routed to {thread.routedTicket.project.name} ({thread.routedTicket.referenceNumber}).
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <select
                value={organizationId}
                onChange={(e) => {
                  setOrganizationId(e.target.value);
                  setProjectId(""); // the old project belongs to a different org
                }}
                disabled={isBusy}
                className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">Select organization…</option>
                {targets?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isBusy || !organizationId}
                className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">{organizationId ? "Select project…" : "Pick an organization first"}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {organizationId && projects.length === 0 && (
              <p className="text-xs text-amber-700 flex items-center gap-1 mb-3">
                <AlertTriangle size={12} />
                This organization has no projects yet.
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!projectId || isBusy}
                onClick={() => routeMutation.mutate({ data: { intakeTicketId, organizationId, projectId } })}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {routeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Route to project
              </button>

              {/* Three distinct outcomes for a chat that is never routed. They are stored
                  on `triageNote`, so the queue can later be reported on honestly — "no
                  project for this" is very different from spam. */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => closeMutation.mutate({ data: { intakeTicketId, reason: "resolved" } })}
                title="Answered here — no routing needed"
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                Resolved
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => closeMutation.mutate({ data: { intakeTicketId, reason: "no_fit" } })}
                title="Belongs to no organization we work with"
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <CircleSlash size={16} />
                No fit
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => closeMutation.mutate({ data: { intakeTicketId, reason: "spam" } })}
                title="Spam — close without routing"
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Ban size={16} />
                Spam
              </button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
