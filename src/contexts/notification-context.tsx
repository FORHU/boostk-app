import { createContext, useContext } from "react";

interface NotificationContextValue {
  markAsRead: (ticketId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  value,
  children,
}: {
  value: NotificationContextValue;
  children: React.ReactNode;
}) {
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within a NotificationProvider");
  return ctx;
}
