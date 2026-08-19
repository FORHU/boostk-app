import { Loader2 } from "lucide-react";

export function TicketsLoadingFallback() {
  return (
    <div className="p-6 flex flex-col min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    </div>
  );
}
