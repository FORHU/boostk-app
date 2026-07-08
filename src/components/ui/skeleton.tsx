import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  hasActionColumn?: boolean;
}

function DataTableSkeleton({
  columnCount = 4,
  rowCount = 3,
  hasActionColumn = false,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="bg-background rounded-[7px] border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                {Array.from({ length: columnCount }).map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: columnCount }).map((_, colIndex) => {
                    const isLastColumn = colIndex === columnCount - 1;

                    return (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        {hasActionColumn && isLastColumn ? (
                          <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded-[5px]" />
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full min-w-[100px] max-w-[200px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      <Skeleton className="h-10 w-full sm:max-w-md rounded-[5px]" />
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Skeleton className="h-10 w-24 rounded-[5px]" />
        <Skeleton className="h-10 w-24 rounded-[5px]" />
      </div>
    </div>
  );
}

interface UsageCardsSkeletonProps {
  count?: number;
  className?: string;
}

function UsageCardsSkeleton({ count = 3, className }: UsageCardsSkeletonProps) {
  return (
    // Added className here so you can override the grid-cols if you have more or less than 3 cards
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-10 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

function TextSkeleton({ lines = 1, className }: TextSkeletonProps) {
  if (lines === 1) {
    return (
      <Skeleton 
        className={cn("h-4 w-full", className)} 
      />
    );
  }

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLastLine = i === lines - 1;
        
        return (
          <Skeleton 
            key={i} 
            className={cn(
              "h-2", 
              isLastLine && !className?.includes("w-") ? "w-2/3" : "w-full",
              className
            )} 
          />
        );
      })}
    </div>
  );
}

export { Skeleton, DataTableSkeleton, ToolbarSkeleton, UsageCardsSkeleton, TextSkeleton };
