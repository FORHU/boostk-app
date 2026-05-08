import { Edit2, Plus, Save, Trash2, X, Zap } from "lucide-react";
import { useState } from "react";

export interface QuickReplyTemplate {
  id: string;
  category: string;
  title: string;
  text: string;
}

interface TemplateManagerModalProps {
  templates: QuickReplyTemplate[];
  onClose: () => void;
  onAdd: (template: QuickReplyTemplate) => void;
  onUpdate: (template: QuickReplyTemplate) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Greetings: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Support: "bg-blue-50 text-blue-700 border-blue-200",
  Sales: "bg-purple-50 text-purple-700 border-purple-200",
  Closing: "bg-orange-50 text-orange-700 border-orange-200",
};

const getCategoryColor = (cat: string) =>
  CATEGORY_COLORS[cat] ?? "bg-slate-50 text-slate-700 border-slate-200";

const uid = () => Math.random().toString(36).substring(2, 10);

type EditingState = {
  id: string | null; // null = creating new
  category: string;
  title: string;
  text: string;
};

const blankEdit = (category: string): EditingState => ({
  id: null,
  category,
  title: "",
  text: "",
});

export function TemplateManagerModal({
  templates,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: TemplateManagerModalProps) {
  // derive unique categories from templates
  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] ?? "Greetings"
  );
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const visibleTemplates = templates.filter(
    (t) => t.category === selectedCategory
  );

  const handleSave = () => {
    if (!editing) return;
    const { id, category, title, text } = editing;
    if (!title.trim() || !text.trim() || !category.trim()) return;

    if (id) {
      onUpdate({ id, category, title, text });
    } else {
      onAdd({ id: uid(), category, title, text });
      // add new category to list if it doesn't exist
      if (!categories.includes(category)) {
        setSelectedCategory(category);
      }
    }
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
    if (editing?.id === id) setEditing(null);
  };

  const handleAddNewCategory = () => {
    setEditing({ id: null, category: "", title: "", text: "" });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white shadow-2xl w-[900px] max-w-[95vw] h-[620px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 rounded-[5px]"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0037b0] flex items-center gap-2">
            <Zap size={14} className="text-[#0037b0]" />
            Quick Replies
            <span className="text-[10px] text-slate-400 font-medium ml-2 normal-case tracking-normal">
              ({templates.length} template{templates.length !== 1 ? "s" : ""} across {categories.length} categories)
            </span>
          </h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditing(blankEdit(selectedCategory))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0037b0] text-white text-[11px] font-bold rounded-[5px] hover:brightness-110 transition-all shadow-sm"
            >
              <Plus size={12} strokeWidth={3} />
              New Template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left: Category list */}
          <div className="w-[200px] shrink-0 border-r border-slate-100 bg-slate-50/60 overflow-y-auto p-3 flex flex-col gap-1">
            <p className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Categories
            </p>
            {categories.map((cat) => {
              const count = templates.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2.5 rounded-[5px] text-[11px] font-bold transition-all flex items-center justify-between group ${
                    selectedCategory === cat
                      ? "bg-[#0037b0] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0 ml-1 ${
                      selectedCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddNewCategory}
              className="w-full text-left px-3 py-2 rounded-[5px] text-[11px] font-bold text-slate-400 hover:text-[#0037b0] hover:bg-white border border-dashed border-slate-200 hover:border-[#7f9bd7] transition-all flex items-center gap-1.5 mt-2"
            >
              <Plus size={10} strokeWidth={3} />
              New category
            </button>
          </div>

          {/* Right: Template list */}
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {/* New template form (when creating) */}
            {editing && editing.id === null && (
              <div className="m-4 p-4 rounded-[5px] border border-[#0037b0]/20 bg-[#eaf1fb]/30 animate-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-black text-[#0037b0] uppercase tracking-widest mb-3">
                  New Template
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors"
                      placeholder="e.g. Support"
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors"
                      placeholder="e.g. Standard Intro"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    rows={1}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors resize-none overflow-y-auto"
                    style={{ minHeight: "36px", maxHeight: "96px" }}
                    placeholder="Type the template message..."
                    value={editing.text}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      setEditing({ ...editing, text: e.target.value });
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0037b0] text-white text-[11px] font-bold rounded-[5px] hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
                    disabled={!editing.title.trim() || !editing.text.trim() || !editing.category.trim()}
                  >
                    <Save size={11} />
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Template rows */}
            {visibleTemplates.length === 0 && editing === null && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Zap size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No templates yet</p>
                <p className="text-[11px] text-slate-300 mt-1">Click "+ New Template" to add one</p>
              </div>
            )}

            <div className="flex flex-col gap-2 p-4">
              {visibleTemplates.map((tmpl) => {
                const isEditingThis = editing?.id === tmpl.id;
                const isConfirmingDelete = deleteConfirmId === tmpl.id;

                if (isEditingThis && editing) {
                  return (
                    <div key={tmpl.id} className="p-4 rounded-[5px] border border-[#0037b0]/30 bg-[#eaf1fb]/30 animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <input
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors"
                            value={editing.category}
                            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Title
                          </label>
                          <input
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors"
                            value={editing.title}
                            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Message
                        </label>
                        <textarea
                          rows={1}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-[5px] outline-none focus:border-[#0037b0] transition-colors resize-none overflow-y-auto"
                          style={{ minHeight: "36px", maxHeight: "96px" }}
                          value={editing.text}
                          onChange={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                            setEditing({ ...editing, text: e.target.value });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0037b0] text-white text-[11px] font-bold rounded-[5px] hover:brightness-110 transition-all shadow-sm"
                        >
                          <Save size={11} />
                          Save changes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-[5px] border border-transparent hover:bg-[#eaf1fb] hover:border-[#A4BDEC] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryColor(tmpl.category)}`}
                          >
                            {tmpl.category}
                          </span>
                          <span className="text-[12px] font-bold text-slate-800">
                            {tmpl.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {tmpl.text}
                        </p>
                      </div>

                      {/* Actions */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-right-2 duration-150">
                          <span className="text-[10px] font-bold text-red-500 whitespace-nowrap">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(tmpl.id)}
                            className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-[5px] hover:bg-red-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-[5px] hover:bg-slate-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => {
                              setEditing({
                                id: tmpl.id,
                                category: tmpl.category,
                                title: tmpl.title,
                                text: tmpl.text,
                              });
                            }}
                            className="w-7 h-7 rounded-[5px] flex items-center justify-center text-slate-400 hover:text-[#0037b0] hover:bg-[#eaf1fb] transition-all"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteConfirmId(tmpl.id)}
                            className="w-7 h-7 rounded-[5px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">
            Changes are saved for this session
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-[5px] hover:shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
