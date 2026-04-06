import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Hash, Mail, User } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getFieldInvalid } from "@/lib/form-utils";
import { socket } from "@/lib/socket";
import { upsertTicketSessionFn } from "@/modules/ticket/ticket.functions";
import { UpsertTicketSessionInput } from "@/modules/ticket/ticket.schema";

export default function TicketCustomerForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const upsertTicketSessionMutation = useMutation({
    mutationFn: upsertTicketSessionFn,
    onSuccess: async (data) => {
      console.log("data", data);
      socket.emit("ticket_created", { projectRoom: `project_${projectId}` });
      queryClient.invalidateQueries();
      await router.invalidate();
    },
    onError: (error: unknown) => {
      console.log("error", error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      metadata: "",
      projectId,
      referenceNumber: "",
    } as UpsertTicketSessionInput,
    validators: {
      onChange: UpsertTicketSessionInput,
      onSubmit: UpsertTicketSessionInput,
    },
    onSubmit: async ({ value }) => {
      await upsertTicketSessionMutation.mutateAsync({ data: value });
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
          <form.Field name="referenceNumber">
            {(field) => {
              const isInvalid = getFieldInvalid(field, form);

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Reference Number (optional)</FieldLabel>

                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-3 text-gray-400" />
                    <Input
                      id={field.name}
                      type="tel"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Reference Number"
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
                {isSubmitting ? "Submitting..." : "Start Conversation"}
                <ArrowRight size={16} />
              </button>
            </Field>
          )}
        </form.Subscribe>
      </form>
    </motion.div>
  );
}
