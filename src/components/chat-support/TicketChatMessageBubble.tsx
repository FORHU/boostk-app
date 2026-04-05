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
    <>
      {isStart && (
        <p className="text-[10px] text-muted-foreground text-right my-1">{msg.createdAt.toLocaleTimeString()}</p>
      )}
      <div
        className={cn(
          `mb-0.5 max-w-[60%] px-4 py-2 text-sm shadow-sm ${getRadiusClasses(isCustomer, isStart, isEnd)}`,
          isCustomer ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-secondary text-secondary-foreground",
        )}
        style={{ "--radius": "0.325rem" } as React.CSSProperties}
      >
        <p>{msg.content}</p>
      </div>
    </>
  );
};

export default TicketChatMessageBubble;
