import { Building2, Globe, Mail, MoreVertical, Phone } from "lucide-react";

export function CustomerInfoSidebar({ ticket }: { ticket: any }) {
  return (
    <div className="w-[320px] border-l border-gray-200 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex flex-col justify-center px-6 bg-white shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Customer Info</h2>
        <p className="text-xs text-gray-500">{ticket?.customer?.name}</p>
      </div>

      {/* Profile Summary */}
      <div className="p-6 flex flex-col items-center border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 mb-3 border-2 border-white shadow-sm">
          {ticket?.customer?.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("") || "CU"}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{ticket?.customer?.name || "Loading..."}</h3>
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
              <p className="text-sm font-medium text-gray-900">{ticket?.customer?.email || "No email provided"}</p>
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
  );
}
