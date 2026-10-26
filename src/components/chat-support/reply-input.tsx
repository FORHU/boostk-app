import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AttachmentButton, AttachmentPreview } from "@/components/chat-support/attachment-picker";
import { useToast } from "@/components/ui/toast";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { createAgentTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";

interface ReplyInputProps {
  ticketId: string;
  /** Required by the upload endpoint, which scopes every attachment to its ticket's project. */
  projectId: string;
  customerName?: string | null;
  customerLanguage?: string | null;
  onSuccess?: () => void;
}

export function ReplyInput({ ticketId, projectId, customerName, customerLanguage, onSuccess }: ReplyInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusRef = useRef(false);

  const onUploadError = useCallback((error: string) => toast(error, "error"), [toast]);
  const { attachment, isUploading, upload, clear } = useAttachmentUpload({
    ticketId,
    projectId,
    onError: onUploadError,
  });

  const replyMutation = useMutation({
    mutationFn: createAgentTicketMessageFn,
    onError: () => {
      toast("Failed to send message. Please try again.", "error");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed && !attachment) return;

    try {
      // One contentType per message, so a file sent with a caption goes as two
      // messages — attachment first, so the text reads as a comment on it.
      if (attachment) {
        await replyMutation.mutateAsync({
          data: {
            content: attachment.url,
            contentType: attachment.contentType,
            attachmentId: attachment.id,
            ticketId,
          },
        });
        clear();
      }

      if (trimmed) {
        await replyMutation.mutateAsync({ data: { content: trimmed, contentType: "TEXT", ticketId } });
      }

      setMessage("");
      onSuccess?.();
      shouldRefocusRef.current = true;
    } catch {
      // onError already surfaced a toast; keep the draft so nothing is lost.
    }
  };

  const placeholder = customerLanguage
    ? `Reply in your language — the customer reads it in ${customerLanguage}`
    : customerName
      ? `Reply to ${customerName}...`
      : "Reply to the customer...";

  const isBusy = replyMutation.isPending || isUploading;

  // Keep focus in the composer after a successful send. The field is disabled while
  // the mutation is in flight, which drops focus; restore it once it is interactive again.
  useEffect(() => {
    if (shouldRefocusRef.current && !replyMutation.isPending) {
      inputRef.current?.focus();
      shouldRefocusRef.current = false;
    }
  }, [replyMutation.isPending]);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-background border-t border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all"
    >
      {attachment && <AttachmentPreview attachment={attachment} onRemove={clear} disabled={replyMutation.isPending} />}

      <div className="flex items-end gap-2">
        <AttachmentButton onSelect={upload} disabled={replyMutation.isPending} isUploading={isUploading} />
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={replyMutation.isPending}
          className="flex-1 min-w-0 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 placeholder:text-muted-foreground transition-all"
        />
        <button
          type="submit"
          disabled={(!message.trim() && !attachment) || isBusy}
          className="p-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm active:scale-95 disabled:opacity-50 shrink-0 transition-all"
        >
          {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
}
