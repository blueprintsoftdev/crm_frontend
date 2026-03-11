import { useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  triggeredBy?: { id: string; username: string; email: string } | null;
  order?: { id: string; finalAmount: number; orderStatus: string } | null;
}

type FilterType = "all" | "unread" | "read";

const typeLabel: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  ORDER_CONFIRMED: "Order Confirmed",
  ORDER_SHIPPED: "Order Shipped",
  ORDER_DELIVERED: "Order Delivered",
  ORDER_CANCELLED: "Order Cancelled",
  PAYMENT_RECEIVED: "Payment Received",
};

const typeBadge: Record<string, string> = {
  ORDER_PLACED: "bg-blue-100 text-blue-700",
  ORDER_CONFIRMED: "bg-purple-100 text-purple-700",
  ORDER_SHIPPED: "bg-yellow-100 text-yellow-700",
  ORDER_DELIVERED: "bg-green-100 text-green-700",
  ORDER_CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700",
};

export default function NotificationManagement() {
  // Use shared context so that mark-read here immediately updates the bell badge count
  const { notifications: allNotifications, markAsRead: ctxMarkAsRead, markAllRead: ctxMarkAllRead } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [clearing, setClearing] = useState(false);

  // Cast context notifications to local Notification type (shapes are compatible)
  const notifications = allNotifications as unknown as Notification[];

  const markRead = async (id: string) => {
    try {
      await ctxMarkAsRead(id);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await ctxMarkAllRead();
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete all admin notifications? This cannot be undone.")) return;
    setClearing(true);
    try {
      await api.delete("/notifications/clear-all");
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            disabled={clearing || notifications.length === 0}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40"
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
        {(["all", "unread", "read"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
              filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {filter === "unread" ? "No unread notifications" : "No notifications"}
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"
              }`}
            >
              {/* Unread dot */}
              <div className="mt-1.5 flex-shrink-0">
                <div
                  className={`w-2 h-2 rounded-full ${n.isRead ? "bg-gray-200" : "bg-blue-500"}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      typeBadge[n.type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {typeLabel[n.type] ?? n.type}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                </div>

                <p className="text-sm text-gray-800">{n.message}</p>

                {n.triggeredBy && (
                  <p className="text-xs text-gray-400 mt-1">
                    By {n.triggeredBy.username} ({n.triggeredBy.email})
                  </p>
                )}

                {n.order && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Order #{n.order.id.slice(-8).toUpperCase()} ·{" "}
                    <span className="font-medium">₹{n.order.finalAmount}</span> ·{" "}
                    {n.order.orderStatus}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => deleteOne(n.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
