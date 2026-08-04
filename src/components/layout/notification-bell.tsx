"use client";

import { useNavigate } from "@tanstack/react-router";
import { BellIcon, MessageSquareIcon, TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationItem } from "@/hooks/use-notifications";
import { EventType } from "@/lib/notifier/core";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function describeNotification(item: NotificationItem): { title: string; subtitle: string } {
  const data = item.data ?? {};

  if (item.event === EventType.TICKET_CREATED) {
    return {
      title: `New ticket${data.referenceNumber ? ` #${data.referenceNumber}` : ""} from ${
        data.customerName ?? "a customer"
      }`,
      subtitle: data.projectName ?? "",
    };
  }

  const sender = data.sender === "agent" ? "Agent" : (data.customerName ?? "Customer");
  return {
    title: `${sender} on ticket${data.referenceNumber ? ` #${data.referenceNumber}` : ""}`,
    subtitle: typeof data.content === "string" ? data.content : "",
  };
}

export function NotificationBell({ notifications, unreadCount, markAllRead }: NotificationBellProps) {
  const navigate = useNavigate();

  const handleOpenChange = (open: boolean) => {
    if (open) markAllRead();
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="relative aria-expanded:bg-muted cursor-pointer border-none bg-transparent p-0 outline-none"
          />
        }
      >
        <BellIcon className="size-4 text-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full border-0 bg-destructive px-1 text-[10px] leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 min-w-80 rounded-lg" side="top" align="end" sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((item) => {
                const { title, subtitle } = describeNotification(item);
                const Icon = item.event === EventType.TICKET_CREATED ? TicketIcon : MessageSquareIcon;

                return (
                  <DropdownMenuItem
                    key={item.localId}
                    onClick={() => {
                      const projectId = item.data?.projectId;
                      if (typeof projectId === "string") {
                        navigate({
                          to: "/dashboard/project/$projectId/tickets",
                          params: { projectId },
                          search: { statusFilter: "ALL" },
                        });
                      }
                    }}
                    className="flex items-start gap-2 py-2"
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", !item.read && "text-primary")} />
                    <span className="grid flex-1 gap-0.5">
                      <span className={cn("text-sm leading-snug", !item.read && "font-medium")}>{title}</span>
                      {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
