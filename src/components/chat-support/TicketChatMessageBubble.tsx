import { Download, FileText } from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/modules/attachment/attachment.utils";

/** Metadata joined onto IMAGE/FILE messages. Bytes are fetched separately from `content`. */
export type MessageAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

/** A message as the chat queries return it — plain rows, plus the attachment join. */
export type TicketMessageWithAttachment = TicketMessage & { attachment?: MessageAttachment | null };

interface TicketChatMessageBubbleProps {
  msg: TicketMessageWithAttachment;
  isStart: boolean;
  isEnd: boolean;
  /** Whose screen this renders on. Decides which language is shown. Defaults to the customer widget. */
  viewer?: "agent" | "customer";
}

const getRadiusClasses = (isOwn: boolean, isStart: boolean, isEnd: boolean) => {
  if (isStart && isEnd) return "rounded-2xl";
  if (isOwn) {
    if (isStart) return "rounded-2xl rounded-br-none";
    if (isEnd) return "rounded-2xl rounded-tr-none";
    return "rounded-2xl rounded-tr-none rounded-br-none";
  } else {
    if (isStart) return "rounded-2xl rounded-bl-none";
    if (isEnd) return "rounded-2xl rounded-tl-none !mb-2";
    return "rounded-2xl rounded-tl-none rounded-bl-none";
  }
};

/**
 * Image attachment. `content` is the attachment URL, which is access-controlled, so the
 * browser sends cookies for it exactly as it would for any same-origin request.
 * Clicking opens the full-size file in a new tab.
 */
const ImageAttachment = ({ url, attachment }: { url: string; attachment: MessageAttachment | null | undefined }) => (
  <a href={url} target="_blank" rel="noreferrer" className="block">
    <img
      src={url}
      alt={attachment?.filename ?? "Attachment"}
      loading="lazy"
      className="rounded-lg max-h-64 w-auto max-w-full object-cover hover:opacity-95 transition-opacity"
    />
  </a>
);

/** Non-image attachment: name, size, and a download affordance. */
const FileAttachment = ({
  url,
  attachment,
  isOwn,
}: {
  url: string;
  attachment: MessageAttachment | null | undefined;
  isOwn: boolean;
}) => (
  <a
    href={url}
    download={attachment?.filename}
    className={cn(
      "flex items-center gap-2.5 rounded-lg px-1 py-0.5 transition-opacity hover:opacity-80",
      isOwn ? "text-primary-foreground" : "text-secondary-foreground",
    )}
  >
    <div className={cn("p-2 rounded-lg shrink-0", isOwn ? "bg-white/20" : "bg-background/70")}>
      <FileText className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium truncate max-w-[180px]">{attachment?.filename ?? "Attachment"}</p>
      {attachment && <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>}
    </div>
    <Download className="w-4 h-4 shrink-0 opacity-70" />
  </a>
);

const TicketChatMessageBubble = ({ msg, isStart, isEnd, viewer = "customer" }: TicketChatMessageBubbleProps) => {
  // A message is "own" when this viewer wrote it. Sender writes in `content`;
  // the other side reads `translatedContent` (their language), original kept below.
  const isOwn = viewer === "agent" ? msg.userId !== null : msg.customerId !== null;
  const primary = isOwn ? msg.content : (msg.translatedContent ?? msg.content);
  const original = !isOwn && msg.translatedContent ? msg.content : null;

  // Attachments are never translated, so `content` is the URL for both viewers.
  const isImage = msg.contentType === "IMAGE";
  const isFile = msg.contentType === "FILE";
  const isAttachment = isImage || isFile;

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {isStart && <p className="text-[10px] text-muted-foreground my-1">{msg.createdAt.toLocaleTimeString()}</p>}
      <div
        className={cn(
          "mb-0.5 max-w-[60%] text-sm shadow-sm w-fit",
          getRadiusClasses(isOwn, isStart, isEnd),
          // Images sit flush in their bubble; text and files keep the usual padding.
          isImage ? "p-1" : "px-4 py-2",
          isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        )}
        style={{ "--radius": "0.325rem" } as React.CSSProperties}
      >
        {isImage && <ImageAttachment url={msg.content} attachment={msg.attachment} />}
        {isFile && <FileAttachment url={msg.content} attachment={msg.attachment} isOwn={isOwn} />}

        {!isAttachment && (
          <>
            <p className="whitespace-pre-wrap wrap-break-word">{primary}</p>
            {original && (
              <p className="mt-1 border-t border-current/15 pt-1 text-xs italic opacity-70 whitespace-pre-wrap wrap-break-word">
                {original}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketChatMessageBubble;
