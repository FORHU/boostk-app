import { Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InlineAssigneeEditor({
  assignedAgentId,
  assignedAgentName,
  agents,
  canUnassign,
  isPending,
  onAssign,
}: {
  assignedAgentId: string | null;
  assignedAgentName?: string | null;
  agents: { id: string; name?: string | null }[];
  canUnassign: boolean;
  isPending: boolean;
  onAssign: (assignedAgentId: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Assign this ticket to an agent"
        className="flex w-full max-w-full items-center gap-1 truncate cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin shrink-0" />
        ) : assignedAgentName ? (
          <span className="truncate">{assignedAgentName}</span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {canUnassign && (
          <DropdownMenuItem onClick={() => onAssign(null)}>
            <span className="text-muted-foreground">Unassigned</span>
            {assignedAgentId === null && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        )}
        {agents.map((agent) => (
          <DropdownMenuItem key={agent.id} onClick={() => onAssign(agent.id)}>
            <span className="truncate">{agent.name ?? "Unknown agent"}</span>
            {assignedAgentId === agent.id && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
