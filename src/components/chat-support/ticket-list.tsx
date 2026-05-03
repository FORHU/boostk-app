import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { setSelectedTicket } from "@/components/chat-support/store";
import { ticketQueries } from "@/modules/ticket/query.queries";
import type { TicketWithCustomer } from "@/modules/ticket/ticket.types";

export const TicketList = ({ projectId }: { projectId: string }) => {
  const { data: tickets } = useSuspenseQuery(ticketQueries.getProjectTickets(projectId));

  //   const filteredTickets = tickets.filter((ticket) => {
  //     const status = ticketStatuses[ticket.id] || ticket.status;
  //     return status !== "";
  //   });

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    if (e.deltaY !== 0) {
      const isAtStart = el.scrollLeft === 0;
      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      const tryingToScrollLeft = e.deltaY < 0;
      const tryingToScrollRight = e.deltaY > 0;

      if (isAtStart && tryingToScrollLeft) return;
      if (isAtEnd && tryingToScrollRight) return;

      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const handleSelectTicket = (ticket: TicketWithCustomer) => {
    console.log("ticket : ", ticket);

    setSelectedTicket(ticket);
  };

  return (
    <div className="h-20 flex flex-row items-center shrink-0">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="px-2 h-full flex flex-row gap-2 overflow-x-auto items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
      >
        {tickets.length === 0 ? (
          <div className="px-10 text-sm font-medium whitespace-nowrap">No active conversations found</div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="h-full py-2">
              <button
                type="button"
                onClick={() => handleSelectTicket(ticket)}
                className={`group relative px-4 py-1.5 h-full min-w-[200px] max-w-[240px] flex items-center justify-between rounded-lg border cursor-pointer transition-all text-left`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-medium">{ticket.customer.name}</span>

                  <span className="truncate text-xs text-slate-500">#{ticket.referenceNumber.slice(0, 10)}</span>
                </div>

                {/* TODO!!! */}
                {/* {(ticketTags[ticket.id] || []).slice(0, 1).map((tag) => (
                      <span key={tag} className="text-[7px] bg-[#eaf1fb] text-[#0037b0] px-1 rounded font-bold">
                        {tag}
                      </span>
                    ))} */}
                {/* {(ticketStatuses[ticket.id] || ticket.status) === "OPEN" && (
                  <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                )} */}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
