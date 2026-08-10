import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Mail, MessageSquare, User } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getFieldInvalid } from "@/lib/form-utils";
import { startIntakeChatFn } from "@/modules/intake/intake.functions";
import { type StartIntakeChatInput, StartIntakeChatSchema } from "@/modules/intake/intake.schema";

/**
 * Opens a conversation on the public global chat.
 *
 * Deliberately narrower than TicketCustomerForm: there is no `projectId` (nobody has
 * picked one yet — that is triage's job) and no reference-number field, since resuming
 * an intake chat happens through the cookie rather than a code the visitor keeps.
 * `subject` replaces them, giving triage something to route on without opening the thread.
 */
export default function IntakeCustomerForm() {
  const router = useRouter();
  const { toast } = useToast();

  const startIntakeChatMutation = useMutation({
    mutationFn: startIntakeChatFn,
    onSuccess: async () => {
      await router.invalidate();
    },
    onError: (error) =>
      // Rate-limit rejections arrive here too, and their message is written for the
      // visitor — surface it rather than a generic failure.
      toast(error instanceof Error ? error.message : "Failed to start the conversation. Please try again.", "error"),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
    } as StartIntakeChatInput,
    validators: {
      onChange: StartIntakeChatSchema,
      onSubmit: StartIntakeChatSchema,
    },
    onSubmit: async ({ value }) => {
      await startIntakeChatMutation.mutateAsync({ data: value });
    },
  });

  return (
    <motion.div
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] w-full mx-auto"
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <form.Field name="name">
            {(field) => {
              const isInvalid = getFieldInvalid(field, form);

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>

                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-gray-400" />
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Full Name"
                      className="pl-9"
                    />
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const isInvalid = getFieldInvalid(field, form);

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>

                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                    <Input
                      id={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Email Address"
                      className="pl-9"
                    />
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </div>

        <div className="mb-3">
          <form.Field name="subject">
            {(field) => {
              const isInvalid = getFieldInvalid(field, form);

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>What can we help with?</FieldLabel>

                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-3 text-gray-400" />
                    <Input
                      id={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Briefly, what is this about?"
                      className="pl-9"
                    />
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-indigo-200"
              >
                {isSubmitting ? "Starting..." : "Start Conversation"}
                <ArrowRight size={16} />
              </button>
            </Field>
          )}
        </form.Subscribe>
      </form>
    </motion.div>
  );
}
