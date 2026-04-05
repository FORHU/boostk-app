import type { TicketMessage } from "prisma/generated/client";
import { cn } from "@/lib/utils";

interface TicketChatMessageBubbleProps {
  msg: TicketMessage;
  isStart: boolean;
  isEnd: boolean;
}

const getRadiusClasses = (isCustomer: boolean, isStart: boolean, isEnd: boolean) => {
  if (isStart && isEnd) return "rounded-2xl";
  if (isCustomer) {
    if (isStart) return "rounded-2xl rounded-br-none";
    if (isEnd) return "rounded-2xl rounded-tr-none";
    return "rounded-2xl rounded-tr-none rounded-br-none";
  } else {
    if (isStart) return "rounded-2xl rounded-bl-none";
    if (isEnd) return "rounded-2xl rounded-tl-none !mb-2";
    return "rounded-2xl rounded-tl-none rounded-bl-none";
  }
};

const TicketChatMessageBubble = ({ msg, isStart, isEnd }: TicketChatMessageBubbleProps) => {
  const isCustomer = msg.customerId !== null;

  return (
    <div className={cn("flex flex-col", isCustomer ? "items-end" : "items-start")}>
      {isStart && <p className="text-[10px] text-muted-foreground my-1">{msg.createdAt.toLocaleTimeString()}</p>}
      <div
        className={cn(
          "mb-0.5 max-w-[60%] px-4 py-2 text-sm shadow-sm w-fit",
          getRadiusClasses(isCustomer, isStart, isEnd),
          isCustomer ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        )}
        style={{ "--radius": "0.325rem" } as React.CSSProperties}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
      </div>
    </div>
  );
};

export default TicketChatMessageBubble;
