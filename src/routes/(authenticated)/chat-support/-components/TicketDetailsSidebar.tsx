import { CircleUser } from "lucide-react";

export function TicketDetailsSidebar({ ticket }: { ticket: any }) {
  return (
    <div className="w-[320px] border-r border-gray-200 flex flex-col bg-gray-50/30 overflow-y-auto">
      <div className="h-16 border-b border-gray-200 flex flex-col justify-center px-6 bg-white shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Ticket Details</h2>
        <p className="text-xs text-gray-500">Manage properties and routing</p>
      </div>

      <div className="p-5 space-y-6">
        <div className="space-y-4">
          {/* Requester */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Requester</div>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {ticket?.customer?.name?.charAt(0) || "U"}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {ticket?.customer?.name || "Select requester..."}
              </span>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Assignee</div>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
              <CircleUser size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">Chloe Moody (You)</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-4">
          {/* Status */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</div>
            <select className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="SOLVED">Solved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</div>
            <select className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tags</div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600">
                billing
                <button type="button" className="hover:text-red-500">
                  &times;
                </button>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600">
                support
                <button type="button" className="hover:text-red-500">
                  &times;
                </button>
              </span>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50"
              >
                + Add tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
