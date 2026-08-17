import { ChevronLeft, ChevronRight } from "lucide-react";

export function TicketPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
