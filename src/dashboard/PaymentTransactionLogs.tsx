// src/dashboard/PaymentTransactionLogs.tsx
// Payment Transaction Logs — Admin & Super Admin.
// Shows every payment lifecycle event with Razorpay IDs, gateway response,
// signature verification status, and full order detail in a side-drawer.

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import {
  CreditCardIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentUser {
  id: string;
  username: string;
  email: string | null;
  phone: string;
  role?: string;
}

interface PaymentOrder {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingCharge: number;
  discountAmount: number;
  finalAmount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  shippingAddress: Record<string, string>;
  createdAt: string;
}

interface PaymentLog {
  id: string;
  orderId: string;
  event: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  gatewayResponse: Record<string, unknown> | null;
  signatureValid: boolean | null;
  ipAddress: string | null;
  createdAt: string;
  user: PaymentUser;
  order: Omit<PaymentOrder, "razorpayOrderId" | "razorpayPaymentId" | "razorpaySignature" | "shippingAddress" | "createdAt" | "totalAmount" | "shippingCharge" | "discountAmount" | "paymentStatus" | "paymentMethod">;
}

interface DetailLog extends PaymentLog {
  order: PaymentOrder;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Summary {
  paid: number;
  failed: number;
  pending: number;
  refunded: number;
  totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; color: string }> = {
  ORDER_CREATED:   { label: "Order Created",    color: "bg-blue-100 text-blue-700" },
  PAYMENT_SUCCESS: { label: "Payment Success",  color: "bg-green-100 text-green-700" },
  PAYMENT_FAILED:  { label: "Payment Failed",   color: "bg-red-100 text-red-700" },
  ORDER_POD:       { label: "Pay on Delivery",  color: "bg-yellow-100 text-yellow-700" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  PAID:     { label: "Paid",     color: "bg-green-100 text-green-700" },
  PENDING:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700" },
  FAILED:   { label: "Failed",   color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Refunded", color: "bg-purple-100 text-purple-700" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const money = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const truncate = (s: string | null | undefined, n = 18) =>
  s ? (s.length > n ? `${s.slice(0, n)}…` : s) : "—";

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({
  label, value, icon: Icon, color,
}: { label: string; value: string | number; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// ─── Detail Drawer ────────────────────────────────────────────────────────────

const DetailDrawer = ({
  logId,
  onClose,
}: { logId: string; onClose: () => void }) => {
  const [log, setLog] = useState<DetailLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/payment-logs/${logId}`)
      .then((r) => { if (!cancelled) setLog(r.data.log); })
      .catch(() => toast.error("Failed to load log detail"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logId]);

  const evt = log ? (EVENT_META[log.event] ?? { label: log.event, color: "bg-gray-100 text-gray-700" }) : null;
  const sta = log ? (STATUS_META[log.paymentStatus] ?? { label: log.paymentStatus, color: "bg-gray-100 text-gray-700" }) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <DocumentMagnifyingGlassIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Transaction Detail</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : !log ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Log not found</div>
        ) : (
          <div className="p-6 space-y-6 text-sm">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${evt!.color}`}>{evt!.label}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sta!.color}`}>{sta!.label}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {log.paymentMethod === "ONLINE" ? "Online" : "Pay on Delivery"}
              </span>
            </div>

            {/* Amount */}
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-xs text-indigo-600 font-medium">Amount</p>
              <p className="text-3xl font-bold text-indigo-700">{money(log.amount)}</p>
            </div>

            {/* Signature Verification */}
            {log.signatureValid !== null && (
              <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${log.signatureValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {log.signatureValid
                  ? <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                  : <ShieldExclamationIcon className="w-5 h-5 shrink-0" />}
                <span className="font-medium text-sm">
                  Razorpay signature {log.signatureValid ? "verified ✓" : "INVALID — possible tamper attempt ✗"}
                </span>
              </div>
            )}

            {/* Razorpay IDs */}
            <Section title="Razorpay Identifiers">
              <Row label="Order ID" value={log.razorpayOrderId ?? "—"} mono />
              <Row label="Payment ID" value={log.razorpayPaymentId ?? "—"} mono />
              <Row label="Signature" value={log.razorpaySignature ? truncate(log.razorpaySignature, 30) : "—"} mono />
            </Section>

            {/* Order Info */}
            <Section title="Order Info">
              <Row label="Order Ref" value={`#${log.orderId.slice(-6).toUpperCase()}`} />
              <Row label="Order Status" value={log.order.orderStatus} />
              <Row label="Final Amount" value={money(log.order.finalAmount)} />
              {log.order.shippingAddress && (
                <Row
                  label="Delivery To"
                  value={`${log.order.shippingAddress.city}, ${log.order.shippingAddress.state} ${log.order.shippingAddress.zipCode}`}
                />
              )}
            </Section>

            {/* Customer */}
            <Section title="Customer">
              <Row label="Name" value={log.user.username} />
              <Row label="Email" value={log.user.email ?? "—"} />
              <Row label="Phone" value={log.user.phone} />
            </Section>

            {/* Gateway Response */}
            {log.gatewayResponse && (
              <Section title="Raw Gateway Response">
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-auto max-h-48 text-gray-700">
                  {JSON.stringify(log.gatewayResponse, null, 2)}
                </pre>
              </Section>
            )}

            {/* Meta */}
            <Section title="Meta">
              <Row label="IP Address" value={log.ipAddress ?? "—"} mono />
              <Row label="Currency" value={log.currency} />
              <Row label="Logged At" value={fmt(log.createdAt)} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
    <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-200">
      {children}
    </div>
  </div>
);

const Row = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between items-center px-3 py-2">
    <span className="text-gray-500 text-xs">{label}</span>
    <span className={`text-gray-900 text-xs text-right break-all max-w-[60%] ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentTransactionLogs() {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const featureEnabled = isSuperAdmin || isEnabled("PAYMENT_LOGS");

  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (methodFilter) params.set("method", methodFilter);
      if (eventFilter) params.set("event", eventFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const { data } = await api.get(`/payment-logs?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch {
      toast.error("Failed to load payment logs");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter, eventFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handleReset = () => {
    setSearch(""); setStatusFilter(""); setMethodFilter("");
    setEventFilter(""); setFromDate(""); setToDate("");
  };

  if (!featureEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
        <CreditCardIcon className="w-12 h-12 text-gray-300" />
        <p className="text-lg font-medium">Payment Logs are disabled</p>
        <p className="text-sm">Ask your Super Admin to enable this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CreditCardIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payment Transaction Logs</h1>
            <p className="text-sm text-gray-500">Razorpay IDs, gateway responses, and signature verification</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <SummaryCard
            label="Revenue"
            value={money(summary.totalRevenue)}
            icon={CreditCardIcon}
            color="bg-indigo-100 text-indigo-600"
          />
          <SummaryCard
            label="Paid"
            value={summary.paid}
            icon={CheckCircleIcon}
            color="bg-green-100 text-green-600"
          />
          <SummaryCard
            label="Pending"
            value={summary.pending}
            icon={ClockIcon}
            color="bg-yellow-100 text-yellow-600"
          />
          <SummaryCard
            label="Failed"
            value={summary.failed}
            icon={XCircleIcon}
            color="bg-red-100 text-red-600"
          />
          <SummaryCard
            label="Refunded"
            value={summary.refunded}
            icon={ArrowUturnLeftIcon}
            color="bg-purple-100 text-purple-600"
          />
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by Razorpay ID, customer name, email, or order ref…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All</option>
              <option value="ONLINE">Online</option>
              <option value="POD">Pay on Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event</label>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="PAYMENT_FAILED">Payment Failed</option>
              <option value="ORDER_POD">Pay on Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-full flex justify-end">
            <button onClick={handleReset}
              className="text-xs text-indigo-600 hover:underline font-medium">
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Ref</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Razorpay ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sig. Valid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    No payment logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const evt = EVENT_META[log.event] ?? { label: log.event, color: "bg-gray-100 text-gray-700" };
                  const sta = STATUS_META[log.paymentStatus] ?? { label: log.paymentStatus, color: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${evt.color}`}>
                          {evt.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        #{log.orderId.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{log.user.username}</p>
                        <p className="text-xs text-gray-500">{log.user.email ?? log.user.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.paymentMethod === "ONLINE" ? "Online" : "POD"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {truncate(log.razorpayPaymentId ?? log.razorpayOrderId)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sta.color}`}>
                          {sta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {money(log.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {log.signatureValid === null ? (
                          <span className="text-xs text-gray-400">N/A</span>
                        ) : log.signatureValid ? (
                          <ShieldCheckIcon className="w-4 h-4 text-green-500" title="Signature valid" />
                        ) : (
                          <ShieldExclamationIcon className="w-4 h-4 text-red-500" title="Signature INVALID" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLogId(log.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>
              {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedLogId && (
        <DetailDrawer logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
      )}
    </div>
  );
}
