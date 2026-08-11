import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  CircleSlash,
  Inbox,
  Loader2,
  Paperclip,
  Send,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useSocket } from "@/hooks/use-socket";
import { EventType } from "@/lib/notifier/core";
import { closeIntakeTicketFn, createTriageMessageFn, routeIntakeTicketFn } from "@/modules/intake/intake.functions";
import { intakeQueries } from "@/modules/intake/intake.queries";

/**
 * BOOSTK-wide triage inbox.
 *
 * Every conversation here arrived through the public /chat route and has no organization
 * yet. Access is gated by `requirePlatformStaffMiddleware` on the server functions this
 * page calls — org roles grant nothing, so an org owner cannot reach another tenant's
 * intake by loading this URL.
 */
export const Route = createFileRoute("/(app)/dashboard/triage")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(intakeQueries.queue());
    context.queryClient.ensureQueryData(intakeQueries.targets());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { authSession } = Route.useRouteContext();
  const { data: queue, isLoading } = useQuery(intakeQueries.queue(search || undefined));
  // Intake events fan out to each staff member's personal `user:<id>` room — there is no
  // project room to join, since an untriaged chat belongs to no organization.
  const { lastMessage } = useSocket({ userId: authSession?.user.id });

  // New intake chats and their messages arrive on the staff member's personal channel
  // via publishToPlatformStaff.
  useEffect(() => {
    if (lastMessage?.event === EventType.CHAT_MESSAGE || lastMessage?.event === EventType.TICKET_CREATED) {
      queryClient.invalidateQueries({ queryKey: intakeQueries.all });
    }
  }, [lastMessage, queryClient]);

  const items = queue?.items ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-80 shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-bold text-gray-900 flex items-center gap-2">
            <Inbox size={18} className="text-blue-600" />
            Global intake
            {items.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {items.length}
              </span>
            )}
          </h1>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="mt-3 w-full bg-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={20} />
            </div>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">Nothing waiting. New chats appear here instantly.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedId === item.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">{item.customer.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{item.customer.email}</p>
                {/* Prefer the support-language version: the raw text is unreadable to
                    staff when the visitor writes in a language they do not speak. */}
                <p className="text-xs text-gray-400 truncate mt-1">
                  {item.latestMessage?.translatedContent ??
                    item.latestMessage?.content ??
                    item.customer.metadata ??
                    "No messages yet"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden bg-slate-50">
        {selectedId ? (
          <TriageDetail key={selectedId} intakeTicketId={selectedId} onDone={() => setSelectedId(null)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <Inbox size={40} className="text-gray-300 mb-3" />
            <p className="text-sm">Select a conversation to read it and route it to a project.</p>
          </div>
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
    <form onSubmit={handleSubmit} className="flex-none bg-white border-t border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reply to the visitor…"
          disabled={disabled || sendMutation.isPending}
          className="flex-1 min-w-0 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!content.trim() || disabled || sendMutation.isPending}
          className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-95 disabled:opacity-50 shrink-0"
        >
          {sendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">
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
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  if (!thread) {
    return <div className="h-full flex items-center justify-center text-sm text-gray-500">Conversation not found.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex-none bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <User size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm truncate">{thread.customer.name}</h2>
            <p className="text-xs text-gray-500 truncate">
              {thread.customer.email}
              {thread.customer.phone ? ` · ${thread.customer.phone}` : ""}
              {thread.customer.language ? ` · ${thread.customer.language}` : ""}
            </p>
          </div>
          <span className="ml-auto text-xs text-gray-400 font-mono">{thread.referenceNumber}</span>
        </div>
        {/* The intake form's subject is recorded as the visitor's first message, so it
            appears in the thread below — translated — instead of being repeated here
            untranslated. Only older conversations, created before that change, still
            carry it solely on `metadata`. */}
        {thread.customer.metadata && thread.ticketMessages.length === 0 && (
          <p className="mt-2 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {thread.customer.metadata}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {thread.ticketMessages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No messages yet — the visitor filled in the form but hasn't written anything.
          </p>
        ) : (
          thread.ticketMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.customerId ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[70%] rounded-2xl text-sm overflow-hidden ${
                  msg.contentType === "IMAGE" ? "p-1" : "px-4 py-2"
                } ${msg.customerId ? "bg-white border border-gray-200 text-gray-800" : "bg-blue-600 text-white"}`}
              >
                {/* For attachments `content` is the /api/attachments/:id URL, not text —
                    rendering it raw showed staff a bare link instead of the screenshot a
                    visitor sent. Translations never apply to these. */}
                {msg.contentType === "IMAGE" ? (
                  <a href={msg.content} target="_blank" rel="noreferrer">
                    <img
                      src={msg.content}
                      alt={msg.attachment?.filename ?? "Attachment"}
                      className="rounded-xl max-h-64 w-auto object-contain"
                    />
                  </a>
                ) : msg.contentType === "FILE" ? (
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 underline underline-offset-2"
                  >
                    <Paperclip size={14} className="shrink-0" />
                    <span className="truncate">{msg.attachment?.filename ?? "Attachment"}</span>
                  </a>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.translatedContent && (
                      <p
                        className={`mt-1 pt-1 border-t text-xs ${
                          msg.customerId ? "border-gray-100 text-gray-500" : "border-blue-400 text-blue-100"
                        }`}
                      >
                        {msg.translatedContent}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply composer. Triage usually cannot route on the opening message alone —
          "help with my booking" names no project — so staff qualify here first. It also
          covers conversations that fit no project and just need an answer. Hidden once
          routed: from that point the receiving org's agents own the conversation. */}
      {!thread.routedTicket && <TriageComposer intakeTicketId={intakeTicketId} disabled={isBusy} />}

      <footer className="flex-none bg-white border-t border-gray-200 p-4">
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
                className="bg-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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
                className="bg-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
