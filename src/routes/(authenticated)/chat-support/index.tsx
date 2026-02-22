import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, CircleUser, Globe, Mail, MoreVertical, Phone, Send, Star } from "lucide-react";
import { TopBar } from "../../../components/TopBar";
import { getProjectTickets } from "../../../modules/ticket/ticket.serverFn";

export const Route = createFileRoute("/(authenticated)/chat-support/")({
  component: RouteComponent,
  loader: async () => {
    // We can prefetch here if we want, but for simplicity we'll just use useQuery in the component
    return {};
  },
});

function RouteComponent() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["project-tickets"],
    queryFn: () => getProjectTickets(),
  });

  // For demonstration, we'll pretend the first ticket is "active"
  const activeTicket = tickets?.[0];

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-gray-900 overflow-hidden">
      <TopBar breadcrumbs={[{ label: "Chat Support" }]} />
      {/* Top Tabs Bar */}
      <div className="h-14 bg-gray-50/80 backdrop-blur-md border-b border-gray-200 flex items-end px-2 shrink-0">
        <div className="flex gap-1 h-full pt-2">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading tickets...</div>
          ) : (
            tickets?.slice(0, 3).map((ticket, idx) => (
              <div
                key={ticket.id}
                className={`
                group relative px-5 py-2.5 min-w-[200px] max-w-[240px] flex items-center justify-between
                rounded-t-lg border border-b-0 cursor-pointer transition-colors
                ${
                  idx === 0
                    ? "bg-white border-gray-200 z-10 before:absolute before:-bottom-px before:left-0 before:right-0 before:h-px before:bg-white"
                    : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-600"
                }
              `}
              >
                <div className="flex flex-col truncate">
                  <span className={`text-sm font-semibold truncate ${idx === 0 ? "text-blue-600" : ""}`}>
                    {ticket.customer?.name || "Unknown Customer"}
                  </span>
                  <span className="text-xs text-gray-500 truncate">Ticket #{ticket.referenceId.slice(0, 8)}</span>
                </div>
                <div className="w-5 h-5 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  &times;
                </div>
              </div>
            ))
          )}
          <button
            type="button"
            className="h-10 w-10 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md ml-1 self-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Main 3 Columns */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Left Column: Ticket Properties (Zendesk style) */}
        <div className="w-[320px] border-r border-gray-200 flex flex-col bg-gray-50/30 overflow-y-auto">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ticket Details</h2>
            <p className="text-xs text-gray-500">Manage properties and routing</p>
          </div>

          <div className="p-5 space-y-6">
            <div className="space-y-4">
              {/* Requester */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Requester
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {activeTicket?.customer?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {activeTicket?.customer?.name || "Select requester..."}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Assignee
                </div>
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
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Priority
                </div>
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

        {/* Middle Column: Chat Box */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Chat Support</h1>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                ROOM_{activeTicket?.referenceId || "LOADING..."}
              </div>
            </div>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
            >
              <Star size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            {/* System Message */}
            <div className="flex justify-center">
              <span className="text-xs font-medium text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                Today
              </span>
            </div>

            {/* Agent Message (Mock) */}
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 mb-1 mr-1">Chloe Moody</span>
              <div className="max-w-[80%] bg-blue-500 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                <p className="text-[15px] leading-relaxed">안녕하세요! 연락 주셔서 감사합니다! 어떻게 도와드릴까요?</p>
                <div className="mt-3 pt-3 border-t border-blue-400/30">
                  <p className="text-xs text-blue-100 italic">
                    original: Hello! Thanks for reaching out! How can I assist you today?
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 mr-1">10:29 AM</span>
            </div>

            {/* Customer Message (Mock) */}
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-500 mb-1 ml-1">{activeTicket?.customer?.name || "Customer"}</span>
              <div className="max-w-[80%] bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                <p className="text-[15px] leading-relaxed">
                  Hey Chloe, thanks for your words. I really appreciate that. I need help in my billing information.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    글로이, 좋은 말씀 감사합니다. 정말 감사드려요. 결제 정보 관련해서 도움이 필요해요.
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 ml-1">10:30 AM</span>
            </div>

            {/* AI Suggestions (Mock) */}
            <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Star size={12} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-600 tracking-wider">AI SUGGESTIONS</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="text-left bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-gray-700"
                >
                  Could you please elaborate on your question?
                </button>
                <button
                  type="button"
                  className="text-left bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-gray-700"
                >
                  Let me check that information for you now.
                </button>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <span className="text-xl leading-none">☺</span>
              </button>
              <textarea
                placeholder="Type Something...."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] py-2 text-sm text-gray-700 placeholder-gray-400"
                rows={1}
              />
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                Send <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details (Zendesk style) */}
        <div className="w-[320px] border-l border-gray-200 flex flex-col bg-white overflow-y-auto">
          {/* Header */}
          <div className="h-16 border-b border-gray-200 flex items-center px-6">
            <h2 className="text-sm font-bold text-gray-900">Customer Info</h2>
          </div>

          {/* Profile Summary */}
          <div className="p-6 flex flex-col items-center border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 mb-3 border-2 border-white shadow-sm">
              {activeTicket?.customer?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("") || "CU"}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{activeTicket?.customer?.name || "Loading..."}</h3>
            <p className="text-sm text-gray-500 mt-1">Shop Owner</p>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors border border-gray-200"
              >
                <Mail size={16} />
              </button>
              <button
                type="button"
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors border border-gray-200"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors border border-gray-200"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* About Customer */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-400 tracking-wider">ABOUT CUSTOMER</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500 mb-0.5">Store Name</p>
                  <p className="text-sm font-medium text-gray-900">Royal Enterprise</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <Globe size={16} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500 mb-0.5">Store URL</p>
                  <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                    royalenterprise.com
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {activeTicket?.customer?.email || "No email provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mx-6" />

          {/* Notes */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-400 tracking-wider">NOTES</h4>
              <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                + Add Note
              </button>
            </div>

            <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl relative">
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "I've sent you a Calendly link. So we can meet tomorrow morning."
              </p>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">Jan 02, 2021</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
