import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Maximize, MessageCircle, Minimize, Star, User, X } from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { useState } from "react";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketPrioritySelect, type TicketPriorityType } from "@/components/ui/ticket-priority";
import { useToast } from "@/components/ui/toast";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { memberQueries } from "@/modules/members/member.queries";
import {
  assignTicketFn,
  projectTicketQueries,
  updateTicketPriorityFn,
  updateTicketStatusFn,
} from "@/routes/(app)/dashboard/project.$projectId/tickets";

const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

export function TicketDetailPanel({
  projectId,
  organizationId,
  ticketId,
  onClose,
  onBack,
  memberId,
  canEditAnyTicket,
}: {
  projectId: string;
  organizationId: string;
  ticketId: string | null;
  onClose: () => void;
  onBack?: () => void;
  memberId: string | null;
  canEditAnyTicket: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [statusAction, setStatusAction] = useState<"CLOSED" | "OPEN" | null>(null);
  const { toast } = useToast();

  const { data: ticket, isLoading } = useQuery({
    ...projectTicketQueries.detailById(projectId, ticketId || ""),
    enabled: !!ticketId,
  });

  const queryClient = useQueryClient();

  const agentsQuery = useQuery({
    ...memberQueries.orgAgents(organizationId),
    enabled: !!organizationId,
  });
  const agents = (agentsQuery.data ?? []).filter((member) => hasOrgRole(member.role, ORG_ROLE.AGENT));
  const assignableAgents = canEditAnyTicket ? agents : agents.filter((member) => member.id === memberId);

  const assignMutation = useMutation({
    mutationFn: assignTicketFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update assignee."),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update status."),
  });

  const updatePriorityMutation = useMutation({
    mutationFn: updateTicketPriorityFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update priority."),
  });

  if (!ticketId) return null;

  const canEditPriority = canEditAnyTicket || ticket?.assignedAgentId === memberId;

  return (
    <div
      className={
        onBack
          ? "h-full flex flex-col"
          : "fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity"
      }
    >
      <div
        className={`bg-background dark:bg-muted h-full flex flex-col w-full ${
          onBack ? "" : "animate-in slide-in-from-right duration-300 transition-all ease-in-out max-w-lg"
        } ${isExpanded ? "max-w-full" : ""}`}
      >
        <header className="flex-none bg-blue-600 dark:bg-blue-800 p-4 text-white flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 -ml-1 text-blue-100 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            {/* Identifies the customer on the other end, not BOOSTK — person icon. */}
            <div className="bg-blue-400/30 p-2 rounded-lg">
              <User size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold leading-none">
                {isLoading ? "Loading..." : ticket?.customer?.name || "Customer Ticket"}
              </h2>
              <span className="text-[10px] text-blue-200 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    ticket?.status === "OPEN" ? "bg-green-400" : "bg-gray-400"
                  }`}
                ></span>
                {ticket?.status === "OPEN" ? "Open" : "Closed"}
              </span>
              {!isLoading && ticket && canEditPriority && (
                <TicketPrioritySelect
                  priority={ticket.priority}
                  isPending={updatePriorityMutation.isPending}
                  onPriorityChange={(newPriority: TicketPriorityType) => {
                    updatePriorityMutation.mutate({
                      data: { projectId, ticketId, priority: newPriority },
                    });
                  }}
                />
              )}
              {!isLoading && ticket && ticket.satisfactionScore != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-100">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  Rated {ticket.satisfactionScore}/5
                </span>
              )}
              {!isLoading && ticket && (
                <div className="flex items-center gap-2">
                  <select
                    value={ticket.assignedAgentId ?? ""}
                    disabled={assignMutation.isPending}
                    onChange={(e) => {
                      assignMutation.mutate({
                        data: {
                          projectId,
                          ticketId,
                          assignedAgentId: e.target.value || null,
                        },
                      });
                    }}
                    className="text-xs bg-white/10 text-white rounded-[4px] px-2 py-1 outline-none border border-transparent focus:border-white/50 focus:ring-1 focus:ring-white/50 disabled:opacity-50 cursor-pointer"
                    title="Assign this ticket to an agent"
                  >
                    {canEditAnyTicket || ticket.assignedAgentId === null || ticket.assignedAgentId === memberId ? (
                      <option value="" style={{ color: "black", backgroundColor: "white" }}>
                        Unassigned
                      </option>
                    ) : null}
                    {assignableAgents.map((agent) => (
                      <option key={agent.id} value={agent.id} style={{ color: "black", backgroundColor: "white" }}>
                        {agent.user?.name || agent.user?.email}
                      </option>
                    ))}
                  </select>
                  {assignMutation.isPending && <Loader2 className="animate-spin text-blue-200" size={14} />}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canEditPriority && (
              <button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  if (!ticketId) return;
                  setStatusAction(ticket?.status === "OPEN" ? "CLOSED" : "OPEN");
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-sm bg-white/15 hover:bg-white/25 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="animate-spin size-3.5" />
                ) : ticket?.status === "OPEN" ? (
                  "Close Ticket"
                ) : (
                  "Reopen Ticket"
                )}
              </button>
            )}
            {!onBack && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
                  title={isExpanded ? "Collapse panel" : "Expand panel"}
                >
                  {isExpanded ? <Minimize className="size-[1.125rem]" /> : <Maximize className="size-[1.125rem]" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
                  title="Close panel"
                >
                  <X className="size-5" />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 scroll-smooth pb-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 size-6" />
            </div>
          ) : !ticket?.ticketMessages || ticket.ticketMessages.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
          ) : (
            <div className="flex flex-col space-y-0.5">
              {ticket.ticketMessages.map((msg, index, list) => {
                const isStart = !isSameGroup(list[index - 1], msg);
                const isEnd = !isSameGroup(msg, list[index + 1]);

                return (
                  <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />
                );
              })}
            </div>
          )}
        </div>
        {!isLoading && ticket && (
          <ReplyInput
            ticketId={ticketId}
            projectId={projectId}
            customerName={ticket.customer?.name}
            customerLanguage={ticket.customer?.language}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: projectTicketQueries.detailById(projectId, ticketId).queryKey,
              });
            }}
          />
        )}
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
          if (!ticketId || !statusAction) return;
          updateStatusMutation.mutate({
            data: {
              projectId,
              ticketId,
              status: statusAction,
            },
          });
          setStatusAction(null);
        }}
      />
    </div>
  );
}
