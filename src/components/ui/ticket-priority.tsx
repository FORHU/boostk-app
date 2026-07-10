import { Loader2 } from "lucide-react";

export type TicketPriorityType = "LOW" | "MEDIUM" | "HIGH"; 

export function getPriorityBadgeClasses(priority: string | null | undefined) {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
    case "MEDIUM":
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400";
    case "LOW":
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

export function TicketPriorityBadge({ priority }: { priority?: string | null }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClasses(priority)}`}>
      {priority || "UNASSIGNED"}
    </span>
  );
}

interface TicketPrioritySelectProps {
  priority: string | null | undefined;
  isPending: boolean;
  onPriorityChange: (newPriority: TicketPriorityType) => void;
}

export function TicketPrioritySelect({ priority, isPending, onPriorityChange }: TicketPrioritySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={priority || ""}
        disabled={isPending}
        onChange={(e) => onPriorityChange(e.target.value as TicketPriorityType)}
        className="text-xs bg-muted rounded-[4px] px-2 py-1 outline-none border border-transparent focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        <option value="" disabled>Set Priority</option>
        <option value="LOW">Low Priority</option>
        <option value="MEDIUM">Medium Priority</option>
        <option value="HIGH">High Priority</option>
      </select>
      {isPending && <Loader2 className="animate-spin text-muted-foreground" size={14} />}
    </div>
  );
}