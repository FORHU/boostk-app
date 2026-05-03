import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const availableTags = ["Sales", "Support", "Billing", "Urgent", "Technical", "Feature Request", "Feedback"] as const;
export type TicketTag = (typeof availableTags)[number];

interface TicketTagsProps {
  ticketTags: TicketTag[];
  onUpdateTags: (tags: TicketTag[]) => void;
}

export const TicketTags = ({ ticketTags, onUpdateTags }: TicketTagsProps) => {
  return (
    <div className="w-full">
      <Combobox multiple value={ticketTags} onValueChange={(val) => onUpdateTags(val as TicketTag[])}>
        <ComboboxChips className="relative p-2 bg-background border border-input rounded-md transition-all shadow-none focus-within:ring-0 focus-within:ring-blue-500 focus-within:border-blue-500">
          {ticketTags.length === 0 && (
            <p className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold uppercase tracking-wider pointer-events-none">
              No tags assigned
            </p>
          )}

          {ticketTags.map((tag) => (
            <ComboboxChip
              key={tag}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-semibold rounded-full border-none px-2.5 py-1 h-auto transition-colors"
            >
              {tag}
            </ComboboxChip>
          ))}

          <ComboboxChipsInput
            placeholder={ticketTags.length === 0 ? "" : "Add..."}
            className="text-sm font-medium text-foreground placeholder:text-muted-foreground ml-1"
          />
        </ComboboxChips>

        <ComboboxContent className="-ml-2 w-52 bg-popover border border-border rounded-md shadow-md z-50 p-1">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
            Select Category
          </p>
          <ComboboxList>
            {availableTags.map((tag) => (
              <ComboboxItem
                key={tag}
                value={tag}
                className="px-3 py-2 text-sm rounded-sm font-medium text-foreground data-highlighted:bg-blue-100 data-highlighted:text-blue-900 cursor-pointer transition-colors"
              >
                {tag}
              </ComboboxItem>
            ))}
          </ComboboxList>

          <ComboboxEmpty className="px-3 py-2 text-sm font-medium text-muted-foreground text-center">
            No tags found
          </ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
