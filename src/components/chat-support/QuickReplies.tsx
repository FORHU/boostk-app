import { ChevronDown, ChevronUp, X, Zap } from "lucide-react";
import { forwardRef, useState } from "react";

interface QuickReply {
  title: string;
  text: string;
}

interface QuickReplyCategory {
  category: string;
  messages: QuickReply[];
}

interface QuickRepliesProps {
  onSelectReply: (text: string) => void;
  onClose: () => void;
}

// Hardcoded data – replace with API call later
const defaultCategories: QuickReplyCategory[] = [
  {
    category: "Greetings",
    messages: [
      { title: "Standard Intro", text: "Hello! How can I help you today with your project?" },
      { title: "Friendly Opening", text: "Hi there! Thanks for reaching out. I'm happy to assist you." },
    ],
  },
  {
    category: "Support",
    messages: [
      {
        title: "Issue Logged",
        text: "We've received your report and our tech team is looking into it. We'll update you shortly.",
      },
      { title: "Meeting Request", text: "Would you like to schedule a quick 15-min sync to discuss this further?" },
      {
        title: "Hold Request",
        text: "Great question! I will find the answer for you. Is it okay if I place you on a brief hold?",
      },
      {
        title: "Paraphrase Issue",
        text: "From what I understand, the issue you're experiencing is [paraphrase the issue]. Is that correct?",
      },
      {
        title: "Acknowledgment",
        text: "Thank you for bringing that to our attention. We understand it's important to you.",
      },
      { title: "Alternative Offer", text: "While we are unable to do that, here's what we can do instead." },
    ],
  },
  {
    category: "Sales",
    messages: [
      {
        title: "Pricing Sheet",
        text: "I've attached our updated premium pricing tier for your review. Let me know if you have questions.",
      },
      {
        title: "Proposal Ready",
        text: "The draft for the editorial partnership is ready for your review. When would be a good time to discuss?",
      },
    ],
  },
  {
    category: "Closing",
    messages: [
      { title: "Sign Off", text: "Let me know if there is anything else you need from our team. Have a great day!" },
      {
        title: "Follow-up",
        text: "I'll follow up with you in a few days to ensure everything is resolved. Feel free to reply anytime.",
      },
    ],
  },
];

export const QuickReplies = forwardRef<HTMLDivElement, QuickRepliesProps>(({ onSelectReply, onClose }, ref) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div
      ref={ref}
      className="mb-4 bg-white shadow-2xl border border-gray-200 overflow-hidden max-w-md w-full"
      style={{ borderRadius: "5px" }}
    >
      <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0037b0] flex items-center gap-2">
          <Zap size={14} className="text-[#0037b0]" />
          Quick Replies
        </h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {defaultCategories.map((group) => (
          <div key={group.category} className="mb-2">
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex justify-between items-center p-3 text-left font-semibold text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="uppercase tracking-wider text-[#0037b0] text-xs">{group.category}</span>
              {expandedCategories[group.category] ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>
            {expandedCategories[group.category] && (
              <div className="pl-2 pr-1 pb-2 space-y-2">
                {group.messages.map((msg) => (
                  <button
                    key={msg.title}
                    type="button"
                    onClick={() => onSelectReply(msg.text)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-[#0037b0]/10 border border-transparent hover:border-[#0037b0]/30 transition-all"
                  >
                    <p className="text-xs font-semibold text-gray-800 mb-1">{msg.title}</p>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{msg.text}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-gray-50 text-center border-t border-gray-100">
        <button
          type="button"
          className="w-full flex flex-row items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#E3EAFB] border border-[#A4BDEC] text-[#0D53C9] hover:bg-[#d0ddf5] transition-colors text-xs font-medium"
          style={{ borderRadius: "5px" }}
        >
          Manage templates
        </button>
      </div>
    </div>
  );
});

QuickReplies.displayName = "QuickReplies";
