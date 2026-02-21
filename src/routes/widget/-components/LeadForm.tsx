import { useForm } from "@tanstack/react-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Hash, Mail, User } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Invalid email address"),
  referenceNumber: z.string().optional(),
});

interface LeadFormProps {
  onSubmit: (data: z.infer<typeof leadSchema>) => void;
}

export function LeadForm({ onSubmit }: LeadFormProps) {
  const [showRef, setShowRef] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      referenceNumber: "",
    } as z.infer<typeof leadSchema>,
    validators: {
      onChange: leadSchema,
    },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] w-full mx-auto"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-0">
          <form.Field name="name">
            {(field) => (
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                {field.state.meta.errors.length > 0 && (
                  <em className="text-red-500 text-xs mt-1 block px-1">
                    {field.state.meta.errors
                      .map((error: any) => (typeof error === "object" ? error.message : error))
                      .join(", ")}
                  </em>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                {field.state.meta.errors.length > 0 && (
                  <em className="text-red-500 text-xs mt-1 block px-1">
                    {field.state.meta.errors
                      .map((error: any) => (typeof error === "object" ? error.message : error))
                      .join(", ")}
                  </em>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <AnimatePresence mode="wait">
          {showRef ? (
            <motion.div
              key="ref-input"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3"
            >
              <form.Field name="referenceNumber">
                {(field) => (
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Reference Number"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                )}
              </form.Field>
            </motion.div>
          ) : (
            <motion.button
              key="ref-toggle"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowRef(true)}
              className="mt-2 text-[11px] text-indigo-600 font-medium hover:text-indigo-800 transition-colors px-1 block"
            >
              Already have a reference number?
            </motion.button>
          )}
        </AnimatePresence>

        <div className="pt-1">
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-indigo-200"
          >
            Start Conversation <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
