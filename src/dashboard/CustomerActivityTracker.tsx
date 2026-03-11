// src/dashboard/CustomerActivityTracker.tsx
// Admin page: real-time customer wishlist & cart tracker.
// - Two tabs: Wishlist | Cart
// - Each tab lists unique customers with item counts
// - Clicking a customer opens a detail dialog
// - Real-time updates via socket.io (toggle-able)
// - Gated by CUSTOMER_ACTIVITY_TRACKER feature flag

import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../utils/api";
import socket from "../utils/socket";
import toast from "react-hot-toast";
import {
  HeartIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  SignalIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";
import { domainUrl } from "../utils/constant";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrackedCustomer {
  id: string;
  username: string;
  email: string | null;
  phone: string;
  avatar: string | null;
  createdAt: string;
  wishlistCount: number;
  cartCount: number;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  discount: number;
  sizes: string[];
  code: string;
  category?: { name: string } | null;
  // wishlist-specific
  addedAt?: string;
  // cart-specific
  quantity?: number;
}

type Tab = "wishlist" | "cart";

// ── Helpers ───────────────────────────────────────────────────────────────────
const imgSrc = (img: string | null | undefined) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${domainUrl.replace("/api", "")}/${img}`;
};

const formatDate = (d: string | undefined) => {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
};

// ── Customer Row ──────────────────────────────────────────────────────────────
const CustomerRow = ({
  customer,
  tab,
  isNew,
  onClick,
}: {
  customer: TrackedCustomer;
  tab: Tab;
  isNew: boolean;
  onClick: () => void;
}) => {
  const count = tab === "wishlist" ? customer.wishlistCount : customer.cartCount;
  const avatar = imgSrc(customer.avatar);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left hover:shadow-md hover:border-indigo-300 ${
        isNew ? "border-indigo-400 bg-indigo-50 animate-pulse-once" : "border-gray-200 bg-white"
      }`}
    >
      {/* Avatar */}
      {avatar ? (
        <img src={avatar} alt={customer.username} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">{customer.username.charAt(0).toUpperCase()}</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{customer.username}</p>
        <p className="text-xs text-gray-500 truncate">{customer.email ?? customer.phone}</p>
      </div>

      {/* Badge */}
      <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
        tab === "wishlist"
          ? "bg-rose-100 text-rose-600"
          : "bg-amber-100 text-amber-700"
      }`}>
        {tab === "wishlist" ? (
          <HeartIcon className="w-3.5 h-3.5" />
        ) : (
          <ShoppingCartIcon className="w-3.5 h-3.5" />
        )}
        {count} {tab === "wishlist" ? "item" : "item"}{count !== 1 ? "s" : ""}
      </span>

      {isNew && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
      )}
    </button>
  );
};

// ── Detail Dialog ─────────────────────────────────────────────────────────────
const DetailDialog = ({
  customer,
  tab,
  onClose,
}: {
  customer: TrackedCustomer;
  tab: Tab;
  onClose: () => void;
}) => {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState<string>("0.00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = tab === "wishlist"
      ? `/admin/tracker/customers/${customer.id}/wishlist`
      : `/admin/tracker/customers/${customer.id}/cart`;

    api.get(endpoint)
      .then((res) => {
        setItems(res.data.items ?? []);
        if (tab === "cart") setTotal(res.data.total ?? "0.00");
      })
      .catch(() => toast.error("Failed to load details"))
      .finally(() => setLoading(false));
  }, [customer.id, tab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          {tab === "wishlist" ? (
            <div className="p-2 rounded-xl bg-rose-100">
              <HeartIcon className="w-5 h-5 text-rose-600" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-amber-100">
              <ShoppingCartIcon className="w-5 h-5 text-amber-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">{customer.username}'s {tab === "wishlist" ? "Wishlist" : "Cart"}</h3>
            <p className="text-xs text-gray-500 truncate">{customer.email ?? customer.phone}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No items in {tab}</p>
            </div>
          ) : (
            items.map((item) => {
              const src = imgSrc(item.image);
              const discountedPrice = item.discount > 0
                ? item.price * (1 - item.discount / 100)
                : item.price;

              return (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
                  {/* Image */}
                  {src ? (
                    <img src={src} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      <ShoppingCartIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category?.name ?? ""} · {item.code}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-gray-900">₹{discountedPrice.toFixed(0)}</span>
                      {item.discount > 0 && (
                        <>
                          <span className="text-xs text-gray-400 line-through">₹{item.price.toFixed(0)}</span>
                          <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">-{item.discount}%</span>
                        </>
                      )}
                    </div>
                    {tab === "cart" && item.quantity && (
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    )}
                    {tab === "wishlist" && item.addedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(item.addedAt)}</p>
                    )}
                  </div>

                  {/* Stock badge */}
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                    item.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {item.stock > 0 ? `${item.stock} left` : "OOS"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Cart total footer */}
        {tab === "cart" && !loading && items.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Cart Total</span>
              <span className="text-lg font-bold text-gray-900">₹{total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomerActivityTracker() {
  const [tab, setTab] = useState<Tab>("wishlist");
  const [customers, setCustomers] = useState<TrackedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<TrackedCustomer | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const realtimeRef = useRef(realtimeEnabled);
  realtimeRef.current = realtimeEnabled;

  // ── Fetch all customers ───────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ customers: TrackedCustomer[] }>("/admin/tracker/customers");
      setCustomers(res.data.customers ?? []);
      setViewedIds(new Set());
    } catch {
      toast.error("Failed to load customer activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Socket real-time updates ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleWishlistUpdate = (data: { userId: string; wishlistCount: number }) => {
      if (!realtimeRef.current) return;

      setCustomers((prev) => {
        const existing = prev.find((c) => c.id === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.id === data.userId ? { ...c, wishlistCount: data.wishlistCount } : c,
          );
        }
        // New customer — trigger a full refresh to get their info
        fetchCustomers();
        return prev;
      });

      setNewActivityIds((prev) => new Set(prev).add(data.userId));
      setTimeout(() => {
        setNewActivityIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }, 8000);
    };

    const handleCartUpdate = (data: { userId: string; cartCount: number }) => {
      if (!realtimeRef.current) return;

      setCustomers((prev) => {
        const existing = prev.find((c) => c.id === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.id === data.userId ? { ...c, cartCount: data.cartCount } : c,
          );
        }
        fetchCustomers();
        return prev;
      });

      setNewActivityIds((prev) => new Set(prev).add(data.userId));
      setTimeout(() => {
        setNewActivityIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }, 8000);
    };

    socket.on("customer-wishlist-update", handleWishlistUpdate);
    socket.on("customer-cart-update", handleCartUpdate);

    return () => {
      socket.off("customer-wishlist-update", handleWishlistUpdate);
      socket.off("customer-cart-update", handleCartUpdate);
    };
  }, [fetchCustomers]);

  // ── Filtered list by tab ─────────────────────────────────────────────────
  const filteredCustomers = customers.filter((c) =>
    tab === "wishlist" ? c.wishlistCount > 0 : c.cartCount > 0,
  );

  const wishlistTotal = customers.filter((c) => c.wishlistCount > 0 && !viewedIds.has(c.id)).length;
  const cartTotal = customers.filter((c) => c.cartCount > 0 && !viewedIds.has(c.id)).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Activity Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor customer wishlists and carts in real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time toggle */}
          <button
            onClick={() => {
              setRealtimeEnabled((v) => !v);
              toast(realtimeEnabled ? "Real-time updates paused" : "Real-time updates enabled", {
                icon: realtimeEnabled ? "⏸" : "▶️",
              });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              realtimeEnabled
                ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
            title={realtimeEnabled ? "Disable real-time updates" : "Enable real-time updates"}
          >
            {realtimeEnabled ? (
              <SignalIcon className="w-4 h-4" />
            ) : (
              <SignalSlashIcon className="w-4 h-4" />
            )}
            {realtimeEnabled ? "Live" : "Paused"}
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {(["wishlist", "cart"] as Tab[]).map((t) => {
          const count = t === "wishlist" ? wishlistTotal : cartTotal;
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "wishlist" ? (
                <HeartIcon className={`w-4 h-4 ${isActive ? "text-rose-500" : ""}`} />
              ) : (
                <ShoppingCartIcon className={`w-4 h-4 ${isActive ? "text-amber-500" : ""}`} />
              )}
              <span className="capitalize">{t}</span>
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-bold px-1.5 ${
                isActive
                  ? t === "wishlist" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          {tab === "wishlist" ? (
            <HeartIcon className="w-12 h-12 text-gray-300 mb-4" />
          ) : (
            <ShoppingCartIcon className="w-12 h-12 text-gray-300 mb-4" />
          )}
          <h3 className="text-base font-semibold text-gray-600">No customers with {tab} items</h3>
          <p className="text-sm text-gray-400 mt-1">
            Customers will appear here when they add products to their {tab}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              tab={tab}
              isNew={newActivityIds.has(customer.id)}
              onClick={() => {
                setSelectedCustomer(customer);
                setViewedIds((prev) => new Set(prev).add(customer.id));
              }}
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {selectedCustomer && (
        <DetailDialog
          customer={selectedCustomer}
          tab={tab}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
