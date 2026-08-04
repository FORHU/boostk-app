import type { TicketMessage } from "prisma/generated/client";
import { formatRelative } from "@/lib/format-date";
import { cn } from "@/lib/utils";

interface TicketChatMessageBubbleProps {
  msg: TicketMessage;
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

const TicketChatMessageBubble = ({ msg, isStart, isEnd, viewer = "customer" }: TicketChatMessageBubbleProps) => {
  // A message is "own" when this viewer wrote it. Sender writes in `content`;
  // the other side reads `translatedContent` (their language), original kept below.
  const isOwn = viewer === "agent" ? msg.userId !== null : msg.customerId !== null;
  const primary = isOwn ? msg.content : (msg.translatedContent ?? msg.content);
  const original = !isOwn && msg.translatedContent ? msg.content : null;

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {isStart && <p className="text-[10px] text-muted-foreground my-1">{formatRelative(msg.createdAt)}</p>}
      <div
        className={cn(
          "mb-0.5 max-w-[60%] px-4 py-2 text-sm shadow-sm w-fit",
          getRadiusClasses(isOwn, isStart, isEnd),
          isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        )}
        style={{ "--radius": "0.325rem" } as React.CSSProperties}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{primary}</p>
        {original && (
          <p className="mt-1 border-t border-current/15 pt-1 text-xs italic opacity-70 whitespace-pre-wrap wrap-break-word">
            {original}
          </p>
        )}
      </div>
    </div>
  );
};

export default TicketChatMessageBubble;
