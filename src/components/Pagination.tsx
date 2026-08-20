import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
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
    <div className="flex items-center justify-center gap-2 py-1.5 sm:gap-3 sm:py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-7 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:size-8"
        title="Previous page"
      >
        <ChevronLeft className="size-3.5 sm:size-4" />
      </button>
      <span className="text-xs font-medium tabular-nums sm:text-sm">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-7 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:size-8"
        title="Next page"
      >
        <ChevronRight className="size-3.5 sm:size-4" />
      </button>
    </div>
  );
}
