import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TicketSort } from "@/modules/ticket/ticket.schema";

export function TicketSortSelect({
  sort,
  onSortChange,
}: {
  sort: TicketSort;
  onSortChange: (sort: TicketSort) => void;
}) {
  const sortOptions: { label: string; value: TicketSort }[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Priority", value: "priority" },
  ];

  const activeLabel = sortOptions.find((o) => o.value === sort)?.label ?? "Newest first";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Sort tickets"
      >
        {activeLabel}
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)}>
            {option.label}
            {option.value === sort && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
