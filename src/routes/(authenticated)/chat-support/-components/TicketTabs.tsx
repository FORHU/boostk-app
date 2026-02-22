import { useChatSupportStore } from "../-store/chat-support.store";

export function TicketTabs({ tickets, isLoading }: { tickets: any[]; isLoading: boolean }) {
  const activeTicketId = useChatSupportStore((state) => state.activeTicketId);
  const setActiveTicketId = useChatSupportStore((state) => state.setActiveTicketId);

  return (
    <div className="h-14 bg-gray-50/80 backdrop-blur-md border-b border-gray-200 flex items-end px-2 shrink-0">
      <div className="flex gap-1 h-full pt-2">
        {isLoading ? (
          <div className="px-4 py-2 text-sm text-gray-500">Loading tickets...</div>
        ) : (
          tickets?.slice(0, 3).map((ticket, idx) => {
            const isActive = activeTicketId === ticket.id;
            return (
              <button
                key={ticket.id}
                type="button" // Critical for accessibility
                onClick={() => setActiveTicketId(ticket.id)}
                className={`
    group relative px-5 py-2.5 min-w-[200px] max-w-[240px] flex items-center justify-between
    rounded-t-lg border border-b-0 cursor-pointer transition-colors text-left
    ${
      isActive
        ? "bg-white border-gray-200 z-10 before:absolute before:-bottom-px before:left-0 before:right-0 before:h-px before:bg-white"
        : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-600"
    }
  `}
              >
                <div className="flex flex-col truncate">
                  <span className={`text-sm font-semibold truncate ${isActive ? "text-blue-600" : ""}`}>
                    {ticket.customer?.name || "Unknown Customer"}
                  </span>
                  <span className="text-xs text-gray-500 truncate">Ticket #{ticket.referenceId.slice(0, 8)}</span>
                </div>

                {/* Note: Clicking the close icon needs its own stopPropagation if you add logic there later */}
                <div className="w-5 h-5 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  &times;
                </div>
              </button>
            );
          })
        )}
        <button
          type="button"
          className="h-10 w-10 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md ml-1 self-center"
        >
          +
        </button>
      </div>
    </div>
  );
}
