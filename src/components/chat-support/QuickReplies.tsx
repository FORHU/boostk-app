import { ChevronDown, ChevronUp, X, Zap } from "lucide-react";
import { forwardRef, useState } from "react";
import type { QuickReplyTemplate } from "./TemplateManagerModal";

interface QuickRepliesProps {
  templates: QuickReplyTemplate[];
  onSelectReply: (text: string) => void;
  onClose: () => void;
  onManage: () => void;
}

export const QuickReplies = forwardRef<HTMLDivElement, QuickRepliesProps>(
  ({ templates, onSelectReply, onClose, onManage }, ref) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
      setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
    };

    // Group flat templates by category
    const groups = templates.reduce<Record<string, QuickReplyTemplate[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {});

    return (
      <div
        ref={ref}
        className="mb-4 bg-white shadow-2xl border border-gray-200 overflow-hidden w-[350px]"
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
          {Object.entries(groups).map(([category, messages]) => (
            <div key={category} className="mb-2">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex justify-between items-center p-3 text-left font-semibold text-sm text-gray-700 hover:bg-gray-50 rounded-[5px] transition-colors"
              >
                <span className="uppercase tracking-wider text-[#0037b0] text-xs">{category}</span>
                {expandedCategories[category] ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {expandedCategories[category] && (
                <div className="pl-2 pr-1 pb-2 space-y-2">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => onSelectReply(msg.text)}
                      className="w-full text-left p-3 rounded-[5px] bg-gray-50 hover:bg-[#0037b0]/10 border border-transparent hover:border-[#0037b0]/30 transition-all"
                    >
                      <p className="text-xs font-semibold text-gray-800 mb-1">{msg.title}</p>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{msg.text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(groups).length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6 font-medium">
              No templates yet — click Manage to add some.
            </p>
          )}
        </div>

        <div className="px-5 py-3 bg-gray-50 text-center border-t border-gray-100">
          <button
            type="button"
            onClick={onManage}
            className="w-full flex flex-row items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#E3EAFB] border border-[#A4BDEC] text-[#0D53C9] hover:bg-[#d0ddf5] transition-colors text-xs font-medium"
            style={{ borderRadius: "5px" }}
          >
            Manage templates
          </button>
        </div>
      </div>
    );
  }
);

QuickReplies.displayName = "QuickReplies";
