import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useId, useRef } from "react";
import type { StagedAttachment } from "@/hooks/use-attachment-upload";
import { cn } from "@/lib/utils";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES } from "@/modules/attachment/attachment.schema";
import { formatFileSize } from "@/modules/attachment/attachment.utils";

/** Human-readable cap, derived from the constant the server enforces so they cannot drift. */
const MAX_LABEL = formatFileSize(ATTACHMENT_MAX_BYTES);

/**
 * Tells the visitor what will be accepted, before they pick something that won't be.
 *
 * The limit was previously discoverable only by hitting it — you picked a 12MB photo,
 * waited, and got a toast. Stating it up front costs one line and turns a failure into
 * a constraint. Kept deliberately quiet: it is guidance, not a warning.
 */
export function AttachmentHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-[10px] leading-tight text-gray-500 mt-1.5 px-1", className)}>
      Images and documents up to {MAX_LABEL}. Large photos are resized automatically.
    </p>
  );
}

interface AttachmentButtonProps {
  onSelect: (file: File) => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

/**
 * Paperclip that opens the file picker. Rendered inside a form, so it is explicitly
 * `type="button"` — otherwise clicking it would submit the composer.
 */
export function AttachmentButton({ onSelect, disabled, isUploading, className }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  return (
    <>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          // Reset so picking the same file twice in a row still fires `change`.
          e.target.value = "";
        }}
      />
      <button
        type="button"
        aria-label={`Attach a file, up to ${MAX_LABEL}`}
        title={`Attach a file (up to ${MAX_LABEL})`}
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "p-2.5 rounded-xl shrink-0 transition-all active:scale-95 disabled:opacity-50",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          className,
        )}
      >
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
      </button>
    </>
  );
}

interface AttachmentPreviewProps {
  attachment: StagedAttachment;
  onRemove: () => void;
  disabled?: boolean;
}

/** Chip shown above the composer once a file has uploaded, before it is sent. */
export function AttachmentPreview({ attachment, onRemove, disabled }: AttachmentPreviewProps) {
  const isImage = attachment.contentType === "IMAGE";

  return (
    <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-muted rounded-lg w-fit max-w-full">
      {isImage && attachment.objectUrl ? (
        <img src={attachment.objectUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded bg-background flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium truncate max-w-[180px]">{attachment.filename}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${attachment.filename}`}
        className="p-1 rounded-full hover:bg-background text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-50 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
