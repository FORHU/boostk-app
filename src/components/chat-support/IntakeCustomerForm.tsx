import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Mail, MessageSquare, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { RateLimitBanner } from "@/components/chat-support/rate-limit-banner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useRateLimitNotice } from "@/hooks/use-rate-limit-notice";
import { downscaleImage } from "@/lib/downscale-image";
import { getFieldInvalid } from "@/lib/form-utils";
import { isImageMimeType } from "@/modules/attachment/attachment.schema";
import { formatFileSize } from "@/modules/attachment/attachment.utils";
import { createIntakeMessageFn, startIntakeChatFn } from "@/modules/intake/intake.functions";
import { intakeQueries } from "@/modules/intake/intake.queries";
import { type StartIntakeChatInput, StartIntakeChatSchema } from "@/modules/intake/intake.schema";

/**
 * Opens a conversation on the public global chat.
 *
 * Deliberately narrower than TicketCustomerForm: there is no `projectId` (nobody has
 * picked one yet — that is triage's job) and no reference-number field, since resuming
 * an intake chat happens through the cookie rather than a code the visitor keeps.
 * `subject` replaces them, giving triage something to route on without opening the thread.
 */
export default function IntakeCustomerForm({
  initialSubject = "",
  onCancel,
  stagedFile,
  onClearStagedFile,
}: {
  initialSubject?: string;
  onCancel?: () => void;
  stagedFile?: File | null;
  onClearStagedFile?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const rateLimit = useRateLimitNotice();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create preview URL when staged file arrives
  useEffect(() => {
    if (!stagedFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(stagedFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedFile]);

  const startIntakeChatMutation = useMutation({
    mutationFn: startIntakeChatFn,
    onSuccess: async () => {
      // Query invalidation, not just `router.invalidate()`: this form also renders inside
      // the floating launcher on the landing page, where the conversation comes from
      // `intakeQueries.session()` and no route owns it.
      await queryClient.invalidateQueries({ queryKey: intakeQueries.all });
      await router.invalidate();
    },
    // A 429 becomes the cooldown strip, which says how long and holds the button until
    // then — a toast telling someone to slow down disappears before it can stop them.
    onError: (error) => {
      if (!rateLimit.capture(error)) toast("Failed to start the conversation. Please try again.", "error");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: initialSubject,
    } as StartIntakeChatInput,
    validators: {
      onChange: StartIntakeChatSchema,
      onSubmit: StartIntakeChatSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await startIntakeChatMutation.mutateAsync({ data: value });

      // Upload staged file after ticket is created
      if (stagedFile && result?.ticket) {
        try {
          const file = await downscaleImage(stagedFile);
          const form = new FormData();
          form.append("file", file);
          form.append("ticketId", result.ticket.id);
          form.append("projectId", result.ticket.projectId);

          const response = await fetch("/api/attachments", { method: "POST", body: form });
          const body = (await response.json().catch(() => null)) as {
            id?: string;
            url?: string;
            contentType?: string;
            error?: string;
          } | null;

          if (!response.ok || !body?.id) {
            toast(body?.error ?? "File upload failed. Your message was sent without the attachment.", "error");
            return;
          }

          // Send the attachment as a message
          await createIntakeMessageFn({
            data: {
              content: body.url ?? "",
              contentType: body.contentType as "IMAGE" | "FILE",
              attachmentId: body.id,
              ticketId: result.ticket.id,
            },
          });

          await queryClient.invalidateQueries({ queryKey: intakeQueries.all });
        } catch {
          toast("File upload failed. Your message was sent without the attachment.", "error");
        }
      }
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
        <RateLimitBanner notice={rateLimit} />

        {stagedFile && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-gray-100 rounded-lg w-fit max-w-full">
            {isImageMimeType(stagedFile.type) && objectUrl ? (
              <img src={objectUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{stagedFile.name}</p>
              <p className="text-[10px] text-gray-500">{formatFileSize(stagedFile.size)}</p>
            </div>
            {onClearStagedFile && (
              <button
                type="button"
                onClick={onClearStagedFile}
                aria-label={`Remove ${stagedFile.name}`}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 shrink-0 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

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

        {!initialSubject && (
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
        )}

        {initialSubject && (
          <p className="text-xs text-gray-500 mb-3 text-center">
            Please provide your details so we can get back to you.
          </p>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-semibold text-sm shrink-0"
                >
                  Back
                </button>
              )}
              <Field className="flex-1">
                <button
                  type="submit"
                  disabled={isSubmitting || rateLimit.isLimited}
                  className="w-full bg-brand text-white py-3 rounded-xl hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-md shadow-brand/20"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowRight size={16} />
                </button>
              </Field>
            </div>
          )}
        </form.Subscribe>
      </form>
    </motion.div>
  );
}
