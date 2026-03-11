import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions } from "../context/StaffPermissionContext";

import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  TruckIcon,
} from "@heroicons/react/20/solid";

import {
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// --- API Endpoints ---
const ADMIN_ALL_ORDERS_ENDPOINT = '/order/all';

interface OrderItem {
  product: { id: string; name: string; image?: string } | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user?: { username?: string; email?: string };
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  shippingCharge: number;
  finalAmount: number;
  orderStatus: string;
  items?: OrderItem[];
}

const ADMIN_UPDATE_STATUS_ENDPOINT = '/order/update';

// Helper: Status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "PROCESSING":
    case "CONFIRMED":
      return <ClockIcon className="size-4" aria-hidden="true" />;
    case "SHIPPED":
      return <TruckIcon className="size-4" aria-hidden="true" />;
    case "DELIVERED":
      return <CheckCircleIcon className="size-4" aria-hidden="true" />;
    case "CANCELLED":
      return <XCircleIcon className="size-4" aria-hidden="true" />;
    default:
      return <ClockIcon className="size-4" aria-hidden="true" />;
  }
};

// Helper: Status badge styles & animation
const getStatusClasses = (status: string) => {
  switch (status) {
    case "PROCESSING":
    case "CONFIRMED":
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm",
        dot: "h-2 w-2 rounded-full bg-amber-400 animate-pulse",
      };
    case "SHIPPED":
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 shadow-sm",
        dot: "h-2 w-2 rounded-full bg-sky-400 animate-pulse",
      };
    case "DELIVERED":
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm",
        dot: "h-2 w-2 rounded-full bg-emerald-400",
      };
    case "CANCELLED":
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 shadow-sm",
        dot: "h-2 w-2 rounded-full bg-rose-400",
      };
    default:
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm",
        dot: "h-2 w-2 rounded-full bg-slate-400",
      };
  }
};

const statusOptions = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
// Display helper: "PROCESSING" → "Processing"
const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const formatDateTime = (value: string | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrderManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = useStaffPermissions();
  const isStaff = user.role === "STAFF";
  const canUpdateOrder = !isStaff || hasPermission("ORDER_UPDATE");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- Fetch ALL Orders (Admin, cookie-based) ---
  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ADMIN_ALL_ORDERS_ENDPOINT, {
        // withCredentials: true,
      });
      setOrders(res.data.order || []);
    } catch (err) {
      const _e = err as any;
      console.error("Error fetching all orders:", err);
      const status = _e.response?.status;
      if (status === 403) {
        setError("Failed to fetch orders: You do not have Admin permissions.");
      } else {
        setError(
          "Failed to fetch orders. Please check backend connection and API endpoint."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // --- Update status (cookie-based) ---
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.orderStatus === newStatus) return;

    const originalOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      )
    );

    // Also update in drawer if currently open for this order
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, orderStatus: newStatus } : prev
    );

    try {
      await api.put(
        `${ADMIN_UPDATE_STATUS_ENDPOINT}/${orderId}`,
        { orderStatus: newStatus },
        // { withCredentials: true }
      );
    } catch (err) {
      const _e = err as any;
      console.error("Failed to update order status:", err);
      alert(
        `Failed to update status for order #${orderId.slice(
          -8
        )}. Reverting change.`
      );
      setOrders(originalOrders);
      const revertOrder = originalOrders.find((o) => o.id === orderId);
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? (revertOrder ?? null) : prev
      );
    }
  };

  // --- Metrics (for header cards) ---
  const metrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        delivered: 0,
        processing: 0,
      };
    }

    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.finalAmount ?? o.totalAmount ?? 0),
      0
    );
    const delivered = orders.filter((o) => o.orderStatus === "DELIVERED")
      .length;
    const processing = orders.filter((o) => o.orderStatus === "PROCESSING" || o.orderStatus === "CONFIRMED")
      .length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      delivered,
      processing,
    };
  }, [orders]);

  const openDrawer = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  // --- Render states ---
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="animate-pulse space-y-3">
              <div className="h-7 w-48 rounded-md bg-slate-200" />
              <div className="h-4 w-72 rounded-md bg-slate-200" />
            </div>
            <div className="hidden md:flex gap-3 animate-pulse">
              <div className="h-10 w-32 rounded-lg bg-slate-200" />
              <div className="h-10 w-32 rounded-lg bg-slate-200" />
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-4 w-20 rounded-md bg-slate-200" />
                <div className="mt-3 h-7 w-24 rounded-md bg-slate-200" />
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="h-5 w-40 rounded-md bg-slate-200 animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-6 py-4 animate-pulse"
                >
                  <div className="h-4 w-24 rounded-md bg-slate-200" />
                  <div className="h-4 w-40 rounded-md bg-slate-200" />
                  <div className="h-4 w-32 rounded-md bg-slate-200" />
                  <div className="h-4 w-20 rounded-md bg-slate-200" />
                  <div className="ml-auto h-8 w-24 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
            <XCircleIcon className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-rose-800 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <InformationCircleIcon className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            No orders yet
          </h2>
          <p className="text-sm text-slate-600">
            There are currently no orders placed. New orders will appear here
            automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-[1600px] px-3 py-8 sm:px-4 lg:px-6 xl:px-8 2xl:px-12 lg:pb-16">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Admin Order Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor, track and update every order in real time with a
              centralized overview.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchAllOrders}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ClockIcon className="mr-1.5 size-4 text-slate-400" />
              Refresh Orders
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="
  mt-6 
  grid gap-4

  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-4

  xl:gap-6 
">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total Orders
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {metrics.totalOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              ₹{metrics.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Processing
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">
              {metrics.processing}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Delivered
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">
              {metrics.delivered}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All Orders
              </h2>
              <p className="text-xs text-slate-500">
                Click a row to view customer details and items.
              </p>
            </div>
          </div>

         <div className="overflow-x-auto max-w-full">

            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Order
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Placed At
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Update
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => {
                  const shortId = `#${order.id.slice(-8)}`;
                  const statusStyle = getStatusClasses(order.orderStatus);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td
                        className="whitespace-nowrap px-4 py-3 text-xs font-mono text-slate-700 cursor-pointer"
                        onClick={() => openDrawer(order)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-semibold">{shortId}</span>
                        </span>
                      </td>

                      <td
                        className="whitespace-nowrap px-4 py-3 cursor-pointer"
                        onClick={() => openDrawer(order)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserIcon className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {order.user?.username || "N/A"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {formatDateTime(order.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                        ₹{(order.finalAmount ?? order.totalAmount)?.toFixed(2) ?? "0.00"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <div className={statusStyle.container}>
                          <span className={statusStyle.dot} />
                          {getStatusIcon(order.orderStatus)}
                          <span className="">
                            {statusLabel(order.orderStatus || "UNKNOWN")}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <select
                          value={order.orderStatus}
                          disabled={!canUpdateOrder || order.orderStatus === "CANCELLED"}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value)
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            !canUpdateOrder
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                              : order.orderStatus === "CANCELLED"
                              ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {!statusOptions.includes(order.orderStatus) && (
                            <option value={order.orderStatus}>
                              {order.orderStatus}
                            </option>
                          )}
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/invoice/${order.id}`)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                            title="View Invoice"
                          >
                            Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => openDrawer(order)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                          >
                            View
                            <ChevronRightIcon className="ml-1.5 size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drawer: Customer & Order Details */}
        {drawerOpen && selectedOrder && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeDrawer}
            />
            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-200 ease-out">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Order
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      #{selectedOrder.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/invoice/${selectedOrder.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                    >
                      Invoice
                    </button>
                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  {/* Customer */}
                  <section className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-slate-50">
                        <UserIcon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedOrder.user?.username || "N/A"}
                        </p>
                        <p className="text-xs text-slate-600">
                          {selectedOrder.user?.email || "No email provided"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        <p className="font-medium text-slate-500">
                          Placed At
                        </p>
                        <p className="mt-0.5">
                          {formatDateTime(selectedOrder.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">
                          Total Amount
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-900">
                          ₹
                          {(selectedOrder.finalAmount ?? selectedOrder.totalAmount)?.toFixed(2) ?? "0.00"}
                        </p>
                        {selectedOrder.discountAmount > 0 && (
                          <p className="text-[11px] text-green-600 font-semibold mt-0.5">
                            Saved ₹{selectedOrder.discountAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Status controls */}
                  <section className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Order Status
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        {(() => {
                          const s = getStatusClasses(
                            selectedOrder.orderStatus
                          );
                          return (
                            <div className={s.container}>
                              <span className={s.dot} />
                              {getStatusIcon(selectedOrder.orderStatus)}
                              <span className="">
                                {statusLabel(selectedOrder.orderStatus || "UNKNOWN")}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <select
                        value={selectedOrder.orderStatus}
                        disabled={!canUpdateOrder || selectedOrder.orderStatus === "CANCELLED"}
                        onChange={(e) =>
                          handleUpdateStatus(selectedOrder.id, e.target.value)
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                          !canUpdateOrder
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                            : selectedOrder.orderStatus === "CANCELLED"
                            ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {!statusOptions.includes(selectedOrder.orderStatus) && (
                          <option value={selectedOrder.orderStatus}>
                            {selectedOrder.orderStatus}
                          </option>
                        )}
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {/* Items */}
                  <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Order Items
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.items?.length || 0} items
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item: OrderItem, index: number) => {
                        const isProductUnavailable = !item.product;
                        const subtotal =
                          (item.price || 0) * (item.quantity || 0);

                        return (
                          <div
                            key={index}
                            className="flex gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                              {isProductUnavailable ? (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-rose-50 text-[10px] font-semibold text-rose-700">
                                  <XCircleIcon className="mb-1 size-5" />
                                  <span>PRODUCT</span>
                                  <span>DELETED</span>
                                </div>
                              ) : (
                                <img
                                  src={
                                    item.product!.image ||
                                    "https://placehold.co/96x96/f3f4f6/6b7280?text=No+Image"
                                  }
                                  alt={item.product!.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[13px] font-medium text-slate-900">
                                    {isProductUnavailable
                                      ? "Product Unavailable"
                                      : item.product!.name}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    Unit: ₹{(item.price || 0).toFixed(2)} · Qty:{" "}
                                    {item.quantity}
                                  </p>
                                </div>
                                <p className="text-[13px] font-semibold text-slate-900">
                                  ₹{subtotal.toFixed(2)}
                                </p>
                              </div>

                              {selectedOrder.orderStatus === "CANCELLED" &&
                                isProductUnavailable && (
                                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 border border-rose-200">
                                    <XCircleIcon className="size-3" />
                                    <span>
                                      Auto-cancelled: Product/Category deleted
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
