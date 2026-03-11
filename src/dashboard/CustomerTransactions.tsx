import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { motion } from "framer-motion";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  User,
  Wifi,
  Banknote,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BeatLoader } from "react-spinners";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TransactionUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
}

interface TransactionItem {
  product: { id: string; name: string; image: string } | null;
  quantity: number;
  price: number;
}

interface Transaction {
  id: string;
  createdAt: string;
  paymentMethod: "ONLINE" | "POD";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  orderStatus: string;
  totalAmount: number;
  shippingCharge: number;
  discountAmount: number;
  finalAmount: number;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  coupon: { code: string } | null;
  user: TransactionUser;
  items: TransactionItem[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { cls: string; icon: React.ReactElement }> = {
    PAID: {
      cls: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    PENDING: {
      cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    FAILED: {
      cls: "bg-red-100 text-red-700 border-red-200",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };
  const { cls, icon } = cfg[status] ?? cfg["PENDING"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {icon} {status}
    </span>
  );
};

const PaymentMethodBadge = ({ method }: { method: string }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
      method === "ONLINE"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-gray-100 text-gray-700 border-gray-200"
    }`}
  >
    {method === "ONLINE" ? <Wifi className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
    {method === "ONLINE" ? "Online" : "POD"}
  </span>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function CustomerTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const fetchTransactions = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("limit", "15");
        if (search) params.set("search", search);
        if (paymentStatus) params.set("paymentStatus", paymentStatus);
        if (paymentMethod) params.set("paymentMethod", paymentMethod);

        const res = await api.get(`/order/customer-transactions?${params.toString()}`);
        setTransactions(res.data.transactions ?? []);
        setPagination(res.data.pagination ?? null);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [search, paymentStatus, paymentMethod],
  );

  useEffect(() => {
    setPage(1);
  }, [search, paymentStatus, paymentMethod]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setPaymentStatus("");
    setPaymentMethod("");
    setPage(1);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const hasFilters = search || paymentStatus || paymentMethod;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Customer Payment History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View all customer transactions. Filter by customer name, payment method or status.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">All Payment Methods</option>
            <option value="ONLINE">Online (Razorpay)</option>
            <option value="POD">Pay on Delivery</option>
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400">
          {pagination ? `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""} found` : ""}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <BeatLoader color="#111" size={12} />
          <p className="mt-3 text-xs text-gray-400 uppercase tracking-widest">Loading…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No transactions found</p>
          {hasFilters && (
            <button onClick={resetFilters} className="mt-3 text-sm text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {tx.user.username}
                            </p>
                            <p className="text-xs text-gray-400">{tx.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        #{tx.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {fmtDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentMethodBadge method={tx.paymentMethod} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={tx.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {fmt(tx.finalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {expanded === tx.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expanded === tx.id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Items */}
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Items Ordered
                              </p>
                              <div className="space-y-2">
                                {tx.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    {it.product?.image ? (
                                      <img
                                        src={it.product.image}
                                        alt={it.product.name}
                                        className="w-9 h-9 object-cover rounded-lg border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {it.product?.name ?? "Deleted Product"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Qty {it.quantity} × {fmt(it.price)}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {fmt(it.quantity * it.price)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                  Payment Breakdown
                                </p>
                                <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{fmt(tx.totalAmount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>
                                      {tx.shippingCharge === 0 ? (
                                        <span className="text-green-600">Free</span>
                                      ) : (
                                        fmt(tx.shippingCharge)
                                      )}
                                    </span>
                                  </div>
                                  {tx.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                      <span>
                                        Coupon
                                        {tx.coupon?.code && (
                                          <span className="ml-1 font-mono text-xs">
                                            ({tx.coupon.code})
                                          </span>
                                        )}
                                      </span>
                                      <span>-{fmt(tx.discountAmount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>{fmt(tx.finalAmount)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Razorpay Ref */}
                              {tx.paymentMethod === "ONLINE" && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                    Payment Reference
                                  </p>
                                  <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs font-mono text-gray-600 break-all space-y-1">
                                    {tx.razorpayPaymentId && (
                                      <p>
                                        <span className="font-sans font-semibold mr-1">Payment ID:</span>
                                        {tx.razorpayPaymentId}
                                      </p>
                                    )}
                                    {tx.razorpayOrderId && (
                                      <p>
                                        <span className="font-sans font-semibold mr-1">Razorpay Order:</span>
                                        {tx.razorpayOrderId}
                                      </p>
                                    )}
                                    {tx.user.phone && (
                                      <p className="font-sans">
                                        <span className="font-semibold mr-1">Phone:</span>
                                        {tx.user.phone}
                                      </p>
                                    )}
                                    {!tx.razorpayPaymentId && !tx.razorpayOrderId && (
                                      <p className="font-sans text-gray-400 italic">
                                        No payment reference.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{tx.user.username}</p>
                        <p className="text-xs text-gray-400">{tx.user.email}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{fmt(tx.finalAmount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <PaymentStatusBadge status={tx.paymentStatus} />
                    <PaymentMethodBadge method={tx.paymentMethod} />
                    <span className="text-xs text-gray-400 ml-auto">{fmtDate(tx.createdAt)}</span>
                  </div>
                </div>

                {expanded === tx.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="space-y-2">
                      {tx.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {it.product?.image ? (
                            <img
                              src={it.product.image}
                              alt={it.product.name}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 text-xs">
                            <p className="font-medium text-gray-800 truncate">
                              {it.product?.name ?? "Deleted Product"}
                            </p>
                            <p className="text-gray-400">
                              Qty {it.quantity} × {fmt(it.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{fmt(tx.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span>
                          {tx.shippingCharge === 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            fmt(tx.shippingCharge)
                          )}
                        </span>
                      </div>
                      {tx.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount {tx.coupon?.code && `(${tx.coupon.code})`}</span>
                          <span>-{fmt(tx.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-gray-100 pt-1">
                        <span>Total</span>
                        <span>{fmt(tx.finalAmount)}</span>
                      </div>
                    </div>
                    {tx.razorpayPaymentId && (
                      <p className="text-xs font-mono text-gray-500 break-all">
                        <span className="font-sans font-semibold">Payment ID:</span>{" "}
                        {tx.razorpayPaymentId}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
