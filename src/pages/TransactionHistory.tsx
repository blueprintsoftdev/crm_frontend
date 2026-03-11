import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { motion, Variants } from "framer-motion";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  ArrowLeft,
  Banknote,
  Wifi,
} from "lucide-react";
import { BeatLoader } from "react-spinners";

// ── Types ────────────────────────────────────────────────────────────────────

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
  items: TransactionItem[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { cls: string; icon: React.ReactElement }> = {
    PAID: {
      cls: "bg-green-50 text-green-700 border-green-200 ring-green-600/20",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    PENDING: {
      cls: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-600/10",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    FAILED: {
      cls: "bg-red-50 text-red-700 border-red-200 ring-red-600/10",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };
  const { cls, icon } = cfg[status] ?? cfg["PENDING"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ring-1 ring-inset ${cls}`}
    >
      {icon} {status}
    </span>
  );
};

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const isOnline = method === "ONLINE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
        isOnline
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
      {isOnline ? "Online" : "Pay on Delivery"}
    </span>
  );
};

// ── Animations ────────────────────────────────────────────────────────────────

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/order/my-transactions?page=${p}&limit=10`);
      setTransactions(res.data.transactions ?? []);
      setPagination(res.data.pagination ?? null);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <BeatLoader color="#000" size={14} />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          Loading Transactions...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transaction History
            </h1>
            <p className="text-xs text-gray-400">
              {pagination?.total ?? 0} transaction{(pagination?.total ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        {transactions.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-500 text-sm mb-6">Your payment history will appear here.</p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-black text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-900 transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <motion.div className="space-y-4" variants={container} initial="hidden" animate="visible">
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  variants={item}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer select-none"
                    onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <PaymentStatusBadge status={tx.paymentStatus} />
                          <PaymentMethodBadge method={tx.paymentMethod} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {fmtDate(tx.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          Order #{tx.id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-900">{fmt(tx.finalAmount)}</p>
                        <p className="text-xs text-gray-400">
                          {tx.items.length} item{tx.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded === tx.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
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
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {it.product?.name ?? "Product Unavailable"}
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

                      {/* Payment Breakdown */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                          Payment Breakdown
                        </p>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">{fmt(tx.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-medium">
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
                                  <span className="ml-1 font-mono text-xs bg-green-50 px-1.5 py-0.5 rounded">
                                    {tx.coupon.code}
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">-{fmt(tx.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-gray-900">
                            <span>Total Paid</span>
                            <span>{fmt(tx.finalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Razorpay ref */}
                      {tx.paymentMethod === "ONLINE" && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Payment Reference
                          </p>
                          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1 text-xs font-mono text-gray-600 break-all">
                            {tx.razorpayPaymentId && (
                              <p>
                                <span className="font-sans font-semibold text-gray-500 not-italic mr-1">
                                  Payment ID:
                                </span>
                                {tx.razorpayPaymentId}
                              </p>
                            )}
                            {tx.razorpayOrderId && (
                              <p>
                                <span className="font-sans font-semibold text-gray-500 not-italic mr-1">
                                  Razorpay Order:
                                </span>
                                {tx.razorpayOrderId}
                              </p>
                            )}
                            {!tx.razorpayPaymentId && !tx.razorpayOrderId && (
                              <p className="font-sans text-gray-400 italic">No payment reference available.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* View Order link */}
                      <button
                        onClick={() => navigate(`/invoice/${tx.id}`)}
                        className="w-full py-2.5 border border-gray-900 text-gray-900 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gray-900 hover:text-white transition-all"
                      >
                        View Invoice
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

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
    </div>
  );
}
