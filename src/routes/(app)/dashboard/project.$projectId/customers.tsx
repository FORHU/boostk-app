import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, Calendar, Hash, Info, Mail, Search, Tag, X } from "lucide-react";

import type { TicketMessage } from "prisma/generated/client";
import { useState } from "react";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketPriorityBadge } from "@/components/ui/ticket-priority";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { useViewport } from "@/hooks/use-viewport";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { projectCustomerQueries } from "@/modules/customer/customer.queries";

function CustomersLoadingFallback() {
  return (
    <div className="flex h-screen w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* CUSTOMER LIST SIDEBAR SKELETON */}
      <aside className="border-r border-border bg-background flex-col w-full md:w-80 flex">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/20">
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

// Chat Bubble Grouping Helper
const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

// MAIN UI COMPONENT

function ProjectCustomersPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showDesktopDetails, setShowDesktopDetails] = useState(true);

  const { data: customers } = useSuspenseQuery(projectCustomerQueries.allByProjectId(projectId));

  const { isMd, isLg, isMounted } = useViewport();

  if (!isMounted) {
    return <CustomersLoadingFallback />;
  }

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) ?? customers[0] ?? null;
  const activeTicket = activeCustomer?.tickets?.[0] ?? null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
  );

  const getStatusIndicator = (status: string) => {
    return status === "OPEN" ? (
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></span>
    ) : (
      <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0"></span>
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/20 text-foreground font-sans">
      {/* CUSTOMER LIST SIDEBAR */}
      <aside
        className={`border-r border-border bg-background flex-col ${isMd ? "w-80 flex" : `w-full ${activeCustomerId ? "hidden" : "flex"}`}`}
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
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
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
                  className={`w-full text-left p-3 border rounded-md cursor-pointer flex flex-col gap-1 transition-all ${activeCustomer?.id === customer.id ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-background border-transparent hover:bg-muted/50"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-foreground truncate">{customer.name}</span>
                      {/* Source label from the widget's `?ref=`; lets one shared inbox be
                          scanned per client project without opening each conversation. */}
                      {customer.metadata ? (
                        <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground max-w-24 truncate">
                          {customer.metadata}
                        </span>
                      ) : null}
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
          className={`flex-1 flex flex-col mb-8 bg-background relative transition-all duration-300 ease-in-out ${isMd || activeCustomerId || customers.length === 0 ? "flex" : "hidden"}`}
        >
          <header className={`h-16 flex justify-between items-center ${isMd ? "px-6" : "px-3"} bg-muted/50 z-10 gap-2`}>
            <div className={`flex items-center ${isMd ? "gap-3" : "gap-2"} flex-1 min-w-0`}>
              {!isMd && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 p-1.5 -ml-1 text-muted-foreground shrink-0 hover:bg-muted rounded-md transition-colors"
                  onClick={() => setActiveCustomerId(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm">Customers</span>
                </button>
              )}
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
            {!isLg && (
              <button
                type="button"
                className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-sm shrink-0 transition-colors"
                onClick={() => setShowMobileDetails(true)}
              >
                <Info className="w-5 h-5" />
              </button>
            )}
          </header>

          {/* Message History */}
          <div className={`flex-1 overflow-y-auto ${isMd ? "p-6" : "p-4"} space-y-6 mt-3`}>
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
              <div className="flex flex-col space-y-0.5">
                {activeTicket.ticketMessages.map((msg, index, list) => {
                  const isStart = !isSameGroup(list[index - 1], msg);
                  const isEnd = !isSameGroup(msg, list[index + 1]);

                  return (
                    <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="bg-background border-t border-border">
            {activeTicket?.status === "CLOSED" ? (
              <div className="p-3">
                <div className="text-center p-3 text-sm text-muted-foreground bg-muted rounded-lg border border-border">
                  This ticket is closed. Reopen it to continue the conversation.
                </div>
              </div>
            ) : !activeTicket ? (
              <div className="p-3">
                <div className="text-center p-3 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                  Select or create a ticket to send a message.
                </div>
              </div>
            ) : (
              <ReplyInput
                ticketId={activeTicket.id}
                projectId={projectId}
                customerName={activeCustomer.name}
                customerLanguage={activeCustomer.language}
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: projectCustomerQueries.allByProjectId(projectId).queryKey,
                  });
                }}
              />
            )}
          </div>
        </main>
      )}

      {/* CUSTOMER DETAILS */}
      <aside
        className={`flex h-full transition-all duration-300 ease-in-out ${
          isLg
            ? `relative shadow-none ${showDesktopDetails ? "w-72" : "w-0"}`
            : `fixed inset-y-0 right-0 z-50 ${showMobileDetails ? "translate-x-0 shadow-2xl" : "translate-x-full"}`
        }`}
      >
        {/* Toggle Folder Tab (Desktop Only) */}
        {isLg && (
          <button
            type="button"
            onClick={() => setShowDesktopDetails((prev) => !prev)}
            className="absolute -left-[31px] top-9 -translate-y-1/2 w-8 h-22 bg-background border border-border border-r-0 rounded-l-md items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] group flex"
            title={showDesktopDetails ? "Hide Customer Details" : "Show Customer Details"}
          >
            <span
              className="text-xs font-bold tracking-[0.2em] rotate-180 group-hover:text-foreground transition-colors"
              style={{ writingMode: "vertical-rl" }}
            >
              DETAIL
            </span>
          </button>
        )}

        <div className="w-72 max-w-[85vw] bg-background border-l border-border h-full flex flex-col shrink-0">
          <div className={`${isMd ? "p-5" : "p-4"} border-b border-border/50 flex justify-between items-center`}>
            <h3 className="text-sm font-bold text-foreground uppercase truncate pr-2">Customer Profile</h3>
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

          {activeCustomer && (
            <div className={`${isMd ? "p-6" : "p-4"} space-y-6 overflow-y-auto h-[calc(100vh-65px)]`}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-inner uppercase shrink-0">
                  {activeCustomer.name.charAt(0)}
                </div>
                <div className="w-full min-w-0">
                  <h4 className="font-bold text-foreground text-lg break-words">{activeCustomer.name}</h4>
                  {activeCustomer.language && (
                    <span className="text-xs font-semibold px-2 py-1 bg-muted text-muted-foreground rounded-sm border border-border mt-1 inline-block truncate max-w-full">
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
                    <p className="text-xs uppercase font-bold text-muted-foreground truncate">Email Address</p>
                    <p className="font-medium text-foreground truncate">{activeCustomer.email}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase font-bold text-muted-foreground truncate">Project</p>
                    <p className="font-medium text-foreground truncate">{activeCustomer.project.name}</p>
                  </div>
                </li>
                {/* Only rendered when the widget link carried `?ref=` — most chats won't have one. */}
                {activeCustomer.metadata ? (
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Source</p>
                      <p className="font-medium text-foreground truncate">{activeCustomer.metadata}</p>
                    </div>
                  </li>
                ) : null}
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase font-bold text-muted-foreground truncate">Ticket</p>
                    <p className="font-medium text-foreground truncate">{activeTicket?.referenceNumber || "None"}</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase font-bold text-muted-foreground truncate">Customer Since</p>
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
