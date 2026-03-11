// src/dashboard/StaffDashboardHome.tsx
// Dashboard home page for STAFF role.
// Shows order & revenue summary widgets, order status pie chart,
// 7-day revenue bar chart, and top products — permission-aware.

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useStaffPermissions } from "../context/StaffPermissionContext";

// ── Types ──────────────────────────────────────────────────────────────────

interface DashSummary {
  orders:     { total: number; thisMonth: number; processing: number; growthPct: number };
  revenue:    { total: number; thisMonth: number; growthPct: number };
  products:   { total: number };
  categories: { total: number };
}

interface StatusPoint  { status: string; count: number; [key: string]: unknown }
interface RevenuePoint { date: string; revenue: number; orders: number }
interface TopProduct {
  product: { id: string; name: string; image: string; price: number } | null;
  totalRevenue: number;
  totalQuantitySold: number;
  orderCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PIE_COLORS: Record<string, string> = {
  PROCESSING: "#F59E0B",
  CONFIRMED:  "#6366F1",
  SHIPPED:    "#3B82F6",
  DELIVERED:  "#10B981",
  CANCELLED:  "#EF4444",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const GrowthBadge = ({ pct }: { pct: number }) => {
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, growth, accent, icon,
}: {
  label: string; value: string | number; sub?: string; growth?: number; accent: string; icon: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      {growth != null && <GrowthBadge pct={growth} />}
    </div>
    <div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
    </div>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

// ── Order-status pill ──────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  PROCESSING: "bg-amber-100  text-amber-700",
  CONFIRMED:  "bg-indigo-100 text-indigo-700",
  SHIPPED:    "bg-blue-100   text-blue-700",
  DELIVERED:  "bg-green-100  text-green-700",
  CANCELLED:  "bg-red-100    text-red-700",
};

// ── Custom bar-chart tooltip ───────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "revenue" ? formatCurrency(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function StaffDashboardHome() {
  const { hasPermission } = useStaffPermissions();

  const canViewOrders   = hasPermission("ORDER_VIEW");
  const canViewProducts = hasPermission("PRODUCT_VIEW");

  const [summary,      setSummary]      = useState<DashSummary | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [orderStatus,  setOrderStatus]  = useState<StatusPoint[]>([]);
  const [topProducts,  setTopProducts]  = useState<TopProduct[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/staff/dashboard");
        setSummary(res.data.summary);
        setRevenueChart(res.data.revenueChart ?? []);
        setOrderStatus((res.data.orderStatus ?? []).filter((s: StatusPoint) => s.count > 0));
        setTopProducts(res.data.topProducts ?? []);
      } catch {
        toast.error("Failed to load dashboard data", { id: "staff-dash" });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of store activity</p>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {canViewOrders && (
            <StatCard
              label="Total Orders"
              value={summary.orders.total.toLocaleString()}
              sub={`${summary.orders.processing} processing`}
              growth={summary.orders.growthPct}
              accent="text-blue-600"
              icon="📦"
            />
          )}
          {canViewOrders && (
            <StatCard
              label="Total Revenue"
              value={formatCurrency(summary.revenue.total)}
              sub={`${formatCurrency(summary.revenue.thisMonth)} this month`}
              growth={summary.revenue.growthPct}
              accent="text-emerald-600"
              icon="💰"
            />
          )}
          {canViewOrders && (
            <StatCard
              label="Orders This Month"
              value={summary.orders.thisMonth.toLocaleString()}
              sub={`vs last 30 days`}
              accent="text-purple-600"
              icon="🗓️"
            />
          )}
          {canViewProducts && (
            <StatCard
              label="Products"
              value={summary.products.total.toLocaleString()}
              sub={`${summary.categories.total} categories`}
              accent="text-orange-600"
              icon="🛍️"
            />
          )}
        </div>
      )}

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      {canViewOrders && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue bar chart — 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue – Last 7 Days</h2>
            {revenueChart.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueChart} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="revenue" fill="#5e785a" radius={[6, 6, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Order status pie — 1/3 width */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Order Status</h2>
            {orderStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    label={false}
                  >
                    {orderStatus.map((entry) => (
                      <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">
                        {value.charAt(0) + value.slice(1).toLowerCase()}
                      </span>
                    )}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, String(name).charAt(0) + String(name).slice(1).toLowerCase()]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Order Status Summary strip ──────────────────────────────────── */}
      {canViewOrders && orderStatus.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {orderStatus.map((s) => (
            <div key={s.status} className={`rounded-xl p-4 flex flex-col items-center gap-1 ${statusStyles[s.status] ?? "bg-gray-100 text-gray-700"}`}>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide">
                {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Top Products ────────────────────────────────────────────────── */}
      {canViewProducts && topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Top Products by Revenue</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {topProducts.map((tp, i) => (
              <li key={tp.product?.id ?? i} className="flex items-center gap-4 px-5 py-3">
                {/* Rank */}
                <span className="w-6 text-center text-sm font-bold text-gray-400">#{i + 1}</span>
                {/* Image */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {tp.product?.image ? (
                    <img src={tp.product.image} alt={tp.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🛍</div>
                  )}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tp.product?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{tp.totalQuantitySold} units · {tp.orderCount} orders</p>
                </div>
                {/* Revenue */}
                <p className="text-sm font-semibold text-emerald-600 shrink-0">{formatCurrency(tp.totalRevenue)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── No-permission empty state ───────────────────────────────────── */}
      {!canViewOrders && !canViewProducts && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-gray-500 text-sm">
            Your current permissions don't include order or product access.<br />
            Contact your admin to get analytics access.
          </p>
        </div>
      )}

    </div>
  );
}
