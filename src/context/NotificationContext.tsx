// src/context/NotificationContext.tsx
// Migrated: TanStack Query handles initial fetch + cache invalidation.
// Socket.IO handles real-time push — new notifications are prepended to the
// query cache so the UI updates instantly without an extra network call.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import socket from "../utils/socket";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AdminNotification {
  _id?: string;
  id?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  triggeredBy?: { username?: string; email?: string };
  orderId?: { finalAmount?: number };
  [key: string]: unknown;
}

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  latestNotification: AdminNotification | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const emptyContext: NotificationContextValue = {
  notifications: [],
  unreadCount: 0,
  latestNotification: null,
  markAsRead: async () => {},
  markAllRead: async () => {},
  fetchNotifications: async () => {},
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  // Return a safe no-op default when used outside <NotificationProvider>
  // (e.g. Navbar rendered on customer pages).
  return ctx ?? emptyContext;
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<AdminNotification | null>(null);

  // ── Query: initial fetch ─────────────────────────────────────────────────────
  const { data: notifications = [], refetch } = useQuery<AdminNotification[]>({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const res = await api.get<AdminNotification[]>("/notifications");
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
      return res.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const fetchNotifications = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ── Mark as read ─────────────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      queryClient.setQueryData<AdminNotification[]>(
        ["my-notifications"],
        (prev) =>
          (prev ?? []).map((n) =>
            n._id === id || n.id === id ? { ...n, isRead: true } : n,
          ),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      try {
        await api.put(`/notifications/${id}/read`);
      } catch (err) {
        console.error("Mark as read failed", err);
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      }
    },
    [queryClient],
  );

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    queryClient.setQueryData<AdminNotification[]>(
      ["my-notifications"],
      (prev) => (prev ?? []).map((n) => ({ ...n, isRead: true })),
    );
    setUnreadCount(0);
    try {
      await api.put("/notifications/mark-all-read");
    } catch (err) {
      console.error("Mark all read failed", err);
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    }
  }, [queryClient]);

  // ── Socket.IO real-time push ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleNotification = (notification: AdminNotification) => {
      queryClient.setQueryData<AdminNotification[]>(
        ["my-notifications"],
        (prev) => [notification, ...(prev ?? [])],
      );
      setUnreadCount((prev) => prev + 1);
      setLatestNotification(notification);
    };

    socket.on("new-notification", handleNotification);
    return () => { socket.off("new-notification", handleNotification); };
  }, [queryClient]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, latestNotification, markAsRead, markAllRead, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
