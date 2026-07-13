import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCheck,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  Languages,
  Loader2,
  Mail,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketPriorityBadge } from "@/components/ui/ticket-priority";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { projectCustomerQueries } from "@/modules/customer/customer.queries";
import { createAgentTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";

function CustomersLoadingFallback() {
  return (
    <div className="flex h-screen w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* CUSTOMER LIST SIDEBAR SKELETON */}
      <aside className="border-r border-border bg-background flex-col w-full md:w-80 flex">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-9 w-full rounded-[8px]" />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {[...Array(6)].map((id) => (
            <div key={id} className="p-3 border border-transparent rounded-[8px] flex flex-col gap-2">
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
                <Skeleton className="h-5 w-16 rounded-[4px] shrink-0" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="lg:hidden w-9 h-9 rounded-[4px] shrink-0" />
        </header>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/20">
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-16 w-[80%] md:w-[60%] rounded-[16px] rounded-tl-none" />
            <Skeleton className="h-3 w-16 mt-1 ml-1" />
          </div>

          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-12 w-[70%] md:w-[45%] rounded-[16px] rounded-tr-none" />
            <Skeleton className="h-3 w-20 mt-1 mr-1" />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-24 w-[85%] md:w-[65%] rounded-[16px] rounded-tl-none" />
            <Skeleton className="h-3 w-16 mt-1 ml-1" />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 md:p-4 bg-background border-t border-border">
          <div className="flex items-end gap-2 bg-muted/50 border border-input rounded-[10px] p-1.5 md:p-2">
            <Skeleton className="w-9 h-9 rounded-[8px] shrink-0" />
            <Skeleton className="flex-1 h-9 bg-transparent" />
            <Skeleton className="w-9 h-9 rounded-[8px] shrink-0" />
          </div>
        </div>
      </main>

      {/* CUSTOMER DETAILS SKELETON (Desktop Only) */}
      <aside className="hidden lg:flex w-72 bg-background border-l border-border h-full flex-col shrink-0">
        <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
          <div className="flex flex-col items-center text-center gap-3">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="w-full flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-24 rounded-[4px]" />
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

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/customers")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({
        to: "/dashboard/organizations",
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED },
      });
    }
  },
  pendingComponent: CustomersLoadingFallback,
  component: ProjectCustomersPage,
});

// MAIN UI COMPONENT

function ProjectCustomersPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOriginalLanguage, setShowOriginalLanguage] = useState<Record<string, boolean>>({});

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showDesktopDetails, setShowDesktopDetails] = useState(true);

  const [messageInput, setMessageInput] = useState("");
  const { data: customers } = useSuspenseQuery(projectCustomerQueries.allByProjectId(projectId));

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) ?? customers[0] ?? null;
  const activeTicket = activeCustomer?.tickets?.[0] ?? null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const replyMutation = useMutation({
    mutationFn: createAgentTicketMessageFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectCustomerQueries.allByProjectId(projectId).queryKey,
      });
      setMessageInput("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeTicket) return;

    replyMutation.mutate({
      data: {
        ticketId: activeTicket.id,
        content: messageInput.trim(),
        contentType: "TEXT",
      },
    });
  };

  const toggleTranslation = (messageId: string) => {
    setShowOriginalLanguage((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const getStatusIndicator = (status: string) => {
    return status === "OPEN" ? (
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></span>
    ) : (
      <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0"></span>
    );
  };

  return (
    <div className="flex h-screen w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* CUSTOMER LIST SIDEBAR */}
      <aside
        className={`border-r border-border bg-background flex-col w-full md:w-80 md:flex ${activeCustomerId ? "hidden" : "flex"}`}
      >
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Customers Chats</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No customers found.</div>
          ) : (
            filteredCustomers.map((customer) => {
              const latestTicket = customer.tickets[0];
              const latestMessage = latestTicket?.ticketMessages[latestTicket.ticketMessages.length - 1];

              return (
                <button
                  type="button"
                  key={customer.id}
                  onClick={() => setActiveCustomerId(customer.id)}
                  className={`w-full text-left p-3 border rounded-[8px] cursor-pointer flex flex-col gap-1 transition-all ${activeCustomer?.id === customer.id ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-background border-transparent hover:bg-muted/50"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-foreground truncate">{customer.name}</span>
                    </div>
                    {latestTicket && (
                      <span className="text-xs text-muted-foreground shrink-0 pl-1">
                        {new Date(latestTicket.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {latestTicket ? (
                    <div className="flex justify-between items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                        {latestMessage?.content || "No messages yet."}
                      </p>
                      <div className="shrink-0">
                        <TicketPriorityBadge priority={latestTicket.priority} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">No tickets opened.</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ACTIVE CHAT AREA*/}
      {activeCustomer && (
        <main
          className={`flex-1 flex flex-col mb-8 bg-background relative transition-all duration-300 ease-in-out ${!activeCustomerId && customers.length > 0 ? "hidden md:flex" : "flex"}`}
        >
          <header className="h-16 flex justify-between items-center px-3 md:px-6 bg-muted/50 z-10 gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <button
                type="button"
                className="md:hidden p-1.5 -ml-1 text-muted-foreground shrink-0 hover:bg-muted rounded-md transition-colors"
                onClick={() => setActiveCustomerId(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-foreground truncate">{activeCustomer.name}</h1>
                  {activeTicket && (
                    <div className="shrink-0">
                      <TicketPriorityBadge priority={activeTicket.priority} />
                    </div>
                  )}
                </div>
                {activeTicket ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {getStatusIndicator(activeTicket.status)}
                    <span className="truncate">
                      {activeTicket.referenceNumber} • {activeTicket.status === "OPEN" ? "Active" : "Closed"}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">No active tickets</p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="lg:hidden p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-[4px] shrink-0 transition-colors"
              onClick={() => setShowMobileDetails(true)}
            >
              <Info className="w-5 h-5" />
            </button>
          </header>

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 mt-3 ">
            {!activeTicket ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-4 p-4 text-center">
                <Briefcase className="w-12 h-12 opacity-20 shrink-0" />
                <p>This customer does not have any support tickets.</p>
              </div>
            ) : activeTicket.ticketMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
                <p>No messages in this ticket yet.</p>
              </div>
            ) : (
              activeTicket.ticketMessages.map((msg) => {
                const isAgent = msg.userId !== null;
                const displayContent =
                  msg.translatedContent && !showOriginalLanguage[msg.id] ? msg.translatedContent : msg.content;

                return (
                  <div key={msg.id} className={`flex flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] md:max-w-[70%] px-4 py-3 shadow-sm text-sm ${
                        isAgent
                          ? "bg-primary text-primary-foreground rounded-[16px] rounded-tr-none"
                          : "bg-card border border-border text-card-foreground rounded-[16px] rounded-tl-none"
                      }`}
                    >
                      {msg.contentType === "TEXT" && (
                        <p className="whitespace-pre-wrap break-words">{displayContent}</p>
                      )}

                      {msg.contentType === "IMAGE" && (
                        <div className="flex flex-col items-center gap-2 bg-muted rounded-[8px] p-2 max-w-full">
                          <ImageIcon className="w-12 h-12 opacity-50 text-muted-foreground shrink-0" />
                          <span className="text-xs italic text-muted-foreground truncate w-full text-center">
                            Image Attachment
                          </span>
                        </div>
                      )}

                      {msg.contentType === "FILE" && (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-[8px] border max-w-full overflow-hidden ${isAgent ? "bg-primary-foreground/10 border-transparent" : "bg-muted/50 border-border"}`}
                        >
                          <FileText className="w-8 h-8 shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-semibold truncate">{msg.content}</span>
                            <span className="text-xs opacity-70 truncate">Click to download</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Translations */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap ${isAgent ? "mr-1 justify-end" : "ml-1"}`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isAgent && <CheckCheck className="w-3 h-3 text-primary shrink-0" />}

                      {msg.translatedContent && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(msg.id)}
                          className="flex items-center gap-1 hover:text-primary transition-colors bg-muted px-1.5 py-0.5 rounded-[4px] max-w-full truncate"
                        >
                          <Languages className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {showOriginalLanguage[msg.id]
                              ? `Translated to ${activeCustomer.language || "your language"}`
                              : `Show Original (${msg.sourceLang})`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 md:p-4 bg-background border-t border-border">
            {activeTicket?.status === "CLOSED" ? (
              <div className="text-center p-3 text-sm text-muted-foreground bg-muted rounded-[10px] border border-border">
                This ticket is closed. Reopen it to continue the conversation.
              </div>
            ) : !activeTicket ? (
              <div className="text-center p-3 text-sm text-muted-foreground bg-muted/50 rounded-[10px] border border-dashed border-border">
                Select or create a ticket to send a message.
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 bg-muted/50 border border-input rounded-[10px] p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-primary transition-all"
              >
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-[8px] shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Reply to ${activeCustomer.name}...`}
                  disabled={replyMutation.isPending}
                  className="flex-1 min-w-0 bg-transparent resize-none outline-none py-2 px-1 text-sm disabled:opacity-60 placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={replyMutation.isPending || !messageInput.trim()}
                  className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[8px] shadow-sm disabled:opacity-50 shrink-0"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            )}
          </div>
        </main>
      )}

      {/* CUSTOMER DETAILS */}
      <aside
        className={`fixed inset-y-0 right-0 z-20 flex h-full transition-all duration-300 ease-in-out ${
          showMobileDetails ? "translate-x-0 shadow-2xl" : "translate-x-full"
        } lg:translate-x-0 lg:relative lg:shadow-none ${showDesktopDetails ? "lg:w-72" : "lg:w-0"}`}
      >
        {/* Toggle Folder Tab (Desktop Only) */}
        <button
          type="button"
          onClick={() => setShowDesktopDetails((prev) => !prev)}
          className="hidden lg:flex absolute -left-[31px] top-9 -translate-y-1/2 w-8 h-22 bg-background border border-border border-r-0 rounded-l-[8px] items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] group"
          title={showDesktopDetails ? "Hide Customer Details" : "Show Customer Details"}
        >
          <span
            className="text-[10px] font-bold tracking-[0.2em] rotate-180 group-hover:text-foreground transition-colors"
            style={{ writingMode: "vertical-rl" }}
          >
            DETAIL
          </span>
        </button>

        <div className="w-72 max-w-[85vw] bg-background border-l border-border h-full flex flex-col shrink-0">
          <div className="p-4 md:p-5 border-b border-border/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground uppercase truncate pr-2">Customer Profile</h3>
            <button
              type="button"
              className="lg:hidden text-muted-foreground hover:text-foreground shrink-0 p-1 bg-muted/50 rounded-md"
              onClick={() => setShowMobileDetails(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeCustomer && (
            <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-inner uppercase shrink-0">
                  {activeCustomer.name.charAt(0)}
                </div>
                <div className="w-full min-w-0">
                  <h4 className="font-bold text-foreground text-lg break-words">{activeCustomer.name}</h4>
                  {activeCustomer.language && (
                    <span className="text-xs font-semibold px-2 py-1 bg-muted text-muted-foreground rounded-[4px] border border-border mt-1 inline-block truncate max-w-full">
                      Speaks: {activeCustomer.language}
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-border" />

              <ul className="space-y-5">
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Email Address</p>
                    <p className="font-medium text-foreground truncate">{activeCustomer.email}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Project</p>
                    <p className="font-medium text-foreground truncate">{activeCustomer.project.name}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Ticket</p>
                    <p className="font-medium text-foreground truncate">{activeTicket?.referenceNumber || "None"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Customer Since</p>
                    <p className="font-medium text-foreground truncate">
                      {new Date(activeCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </aside>

      {showMobileDetails && (
        <button
          type="button"
          className="fixed inset-0 bg-foreground/20 z-10 lg:hidden backdrop-blur-sm"
          onClick={() => setShowMobileDetails(false)}
        />
      )}
    </div>
  );
}
