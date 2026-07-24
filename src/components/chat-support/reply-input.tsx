import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react"; // Removed Paperclip
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { createAgentTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";

interface ReplyInputProps {
  ticketId: string;
  customerName?: string | null;
  customerLanguage?: string | null;
  onSuccess?: () => void;
}

export function ReplyInput({ ticketId, customerName, customerLanguage, onSuccess }: ReplyInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const replyMutation = useMutation({
    mutationFn: createAgentTicketMessageFn,
    onSuccess: () => {
      setMessage("");
      onSuccess?.();
    },
    onError: () => {
      toast("Failed to send message. Please try again.", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    replyMutation.mutate({
      data: { content: trimmed, contentType: "TEXT", ticketId },
    });
  };

  const placeholder = customerLanguage
    ? `Reply in your language — the customer reads it in ${customerLanguage}`
    : customerName
      ? `Reply to ${customerName}...`
      : "Reply to the customer...";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 bg-background border-t border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={replyMutation.isPending}
        className="flex-1 min-w-0 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 placeholder:text-muted-foreground transition-all"
      />
      <button
        type="submit"
        disabled={!message.trim() || replyMutation.isPending}
        className="p-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm active:scale-95 disabled:opacity-50 shrink-0 transition-all"
      >
        {replyMutation.isPending ? <Loader2 className="w-5·h-5·animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </form>
  );
}
