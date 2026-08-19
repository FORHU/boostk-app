"use client";

import { useNavigate } from "@tanstack/react-router";
import { BellIcon, MessageSquareIcon, TicketIcon } from "lucide-react";
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
import { formatRelative } from "@/lib/format-date";
import { EventType } from "@/lib/notifier/core";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (ticketId: string, isIntake?: boolean) => void;
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

export function NotificationBell({ notifications, unreadCount, markAsRead }: NotificationBellProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
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
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />}
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
                      const isIntake = item.data?.isIntake === true;
                      const ticketId = item.data?.ticketId;
                      if (typeof ticketId === "string") {
                        markAsRead(ticketId, isIntake);
                      }
                      if (isIntake) {
                        navigate({
                          to: "/dashboard/triage",
                          search: { selectedTicketId: typeof ticketId === "string" ? ticketId : undefined },
                        });
                        return;
                      }
                      const projectSlug = item.data?.projectSlug;
                      if (typeof projectSlug !== "string") return;
                      navigate({
                        to: "/dashboard/project/$projectSlug/tickets",
                        params: { projectSlug },
                        search: {
                          statusFilter: "ALL",
                          sort: "newest",
                          selectedTicketId: typeof ticketId === "string" ? ticketId : undefined,
                        },
                      });
                    }}
                    className="flex items-start gap-2 py-2"
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", !item.read && "text-primary")} />
                    <span className="grid flex-1 gap-0.5">
                      <span className={cn("text-sm leading-snug", !item.read && "font-medium")}>{title}</span>
                      {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
                      <span className="text-xs text-muted-foreground">{formatRelative(item.timestamp)}</span>
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
