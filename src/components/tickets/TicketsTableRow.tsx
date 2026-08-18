import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { InlineAssigneeEditor } from "@/components/tickets/InlineAssigneeEditor";
import { InlineTicketPriority } from "@/components/tickets/InlineTicketPriority";
import { useToast } from "@/components/ui/toast";
import { formatRelative } from "@/lib/format-date";
import type { getProjectTicketsFn } from "@/modules/ticket/ticket.functions";
import {
  assignTicketFn,
  projectTicketQueries,
  updateTicketPriorityFn,
  updateTicketStatusFn,
} from "@/routes/(app)/dashboard/project.$projectSlug/tickets";

function getStatusBadgeClasses(status: string) {
  switch (status.toUpperCase()) {
    case "OPEN":
      return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
    case "CLOSED":
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export const TICKET_TABLE_COLUMNS = [
  { key: "referenceNumber", label: "Reference Number", width: "12%" },
  { key: "priority", label: "Priority", width: "10%" },
  { key: "status", label: "Status", width: "10%" },
  { key: "rating", label: "Rating", width: "9%" },
  { key: "customerName", label: "Customer Name", width: "24%" },
  { key: "assignee", label: "Assigned Agent", width: "20%" },
  { key: "createdAt", label: "Created", width: "15%" },
] as const;

export type TicketRow = Awaited<ReturnType<typeof getProjectTicketsFn>>["tickets"][number];

export function TicketsTableRow({
  ticket,
  projectId,
  agents,
  canEditAnyTicket,
  memberId,
  onOpenTicket,
}: {
  ticket: TicketRow;
  projectId: string;
  agents: { id: string; name?: string | null }[];
  canEditAnyTicket: boolean;
  memberId: string | null;
  onOpenTicket: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: projectTicketQueries.listPrefix(projectId) });
    queryClient.invalidateQueries({ queryKey: projectTicketQueries.detailById(projectId, ticket.id).queryKey });
  };

  const updatePriorityMutation = useMutation({
    mutationFn: updateTicketPriorityFn,
    onSuccess: invalidateTicket,
    onError: () => toast("Failed to update priority."),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatusFn,
    onSuccess: invalidateTicket,
    onError: () => {
      toast("Failed to update status.");
      invalidateTicket();
    },
  });

  const assignMutation = useMutation({
    mutationFn: assignTicketFn,
    onSuccess: invalidateTicket,
    onError: () => toast("Failed to update assignee."),
  });

  const canEditPriority = canEditAnyTicket || ticket.assignedAgentId === memberId;
  const canEditStatus = canEditPriority;

  const assignableAgents = canEditAnyTicket ? agents : agents.filter((agent) => agent.id === memberId);
  const canUnassign = canEditAnyTicket || ticket.assignedAgentId === null || ticket.assignedAgentId === memberId;

  const [displayStatus, setDisplayStatus] = useState(ticket.status);

  useEffect(() => {
    setDisplayStatus(ticket.status);
  }, [ticket.status]);

  return (
    <tr className="h-14 hover:bg-muted transition-colors">
      <td className="px-6 py-4 text-sm">
        <button
          type="button"
          onClick={onOpenTicket}
          title={`Open ticket ${ticket.referenceNumber}`}
          className="max-w-full truncate rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {ticket.referenceNumber}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <InlineTicketPriority
          priority={ticket.priority}
          canEdit={canEditPriority}
          isPending={updatePriorityMutation.isPending}
          onPriorityChange={(priority) =>
            updatePriorityMutation.mutate({ data: { projectId, ticketId: ticket.id, priority } })
          }
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {canEditStatus ? (
          <button
            type="button"
            title={displayStatus === "OPEN" ? "Mark as closed" : "Reopen ticket"}
            disabled={updateStatusMutation.isPending}
            onClick={() => {
              const next = displayStatus === "OPEN" ? "CLOSED" : "OPEN";
              setDisplayStatus(next);
              updateStatusMutation.mutate({
                data: { projectId, ticketId: ticket.id, status: next },
              });
            }}
            className={`cursor-pointer rounded-full px-2 py-1 text-xs font-semibold transition-colors duration-300 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${getStatusBadgeClasses(displayStatus)}`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={displayStatus}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {displayStatus}
              </motion.span>
            </AnimatePresence>
          </button>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(ticket.status)}`}>
            {ticket.status}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {ticket.satisfactionScore != null ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
            title={`Customer rating: ${ticket.satisfactionScore}/5`}
          >
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {ticket.satisfactionScore}/5
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-6 py-4 truncate text-sm" title={ticket.customer?.name}>
        {ticket.customer?.name}
      </td>
      <td className="px-6 py-4 overflow-hidden">
        <InlineAssigneeEditor
          assignedAgentId={ticket.assignedAgentId}
          assignedAgentName={ticket.assignedAgent?.user?.name}
          agents={assignableAgents}
          canUnassign={canUnassign}
          isPending={assignMutation.isPending}
          onAssign={(assignedAgentId) =>
            assignMutation.mutate({ data: { projectId, ticketId: ticket.id, assignedAgentId } })
          }
        />
      </td>
      <td className="px-6 py-4 truncate text-sm" title={formatRelative(ticket.createdAt)}>
        {formatRelative(ticket.createdAt)}
      </td>
    </tr>
  );
}
