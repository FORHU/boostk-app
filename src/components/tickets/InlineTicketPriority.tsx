import { Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TicketPriorityBadge, type TicketPriorityType } from "@/components/ui/ticket-priority";

export function InlineTicketPriority({
  priority,
  canEdit,
  isPending,
  onPriorityChange,
}: {
  priority: TicketPriorityType;
  canEdit: boolean;
  isPending: boolean;
  onPriorityChange: (priority: TicketPriorityType) => void;
}) {
  const options: TicketPriorityType[] = ["LOW", "MEDIUM", "HIGH"];

  if (!canEdit) {
    return <TicketPriorityBadge priority={priority} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Change priority"
        className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <TicketPriorityBadge priority={priority} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onPriorityChange(option)}>
            <TicketPriorityBadge priority={option} />
            {option === priority && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
