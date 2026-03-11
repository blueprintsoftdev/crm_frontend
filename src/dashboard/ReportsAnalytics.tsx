import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  RefreshCw,
  Calendar,
  Layers,
  CreditCard,
  Target,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────

interface RangeSummary {
  revenue: { total: number; growthPct: number };
  orders: { total: number; processing: number; growthPct: number };
  customers: { total: number; growthPct: number };
  products: { total: number };
}

interface ProfitSummary {
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPct: number;
  orderCount: number;
  coveragePct: number;
  growth: { revenue: number; profit: number };
}

interface ProfitPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface TopProductProfit {
  product: { id: string; name: string; price: number; purchasePrice?: number | null; image?: string } | null;
  totalRevenue: number;
  totalQuantitySold: number;
  orderCount: number;
  totalCost: number | null;
  grossProfit: number | null;
  marginPct: number | null;
}

interface PaymentBreakdown {
  method: string;
  count: number;
  revenue: number;
}

interface CategoryData {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const INR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const shortINR = (v: number) => {
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${Math.round(v)}`;
};

const STATUS_COLORS: Record<string, string> = {
  PROCESSING: "#F59E0B",
  CONFIRMED: "#6366F1",
  SHIPPED: "#3B82F6",
  DELIVERED: "#10B981",
  CANCELLED: "#EF4444",
};

const PAYMENT_COLORS = ["#6366F1", "#10B981"];

const todayStr = () => new Date().toISOString().split("T")[0];
const nDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

// ── Sub-components ─────────────────────────────────────────────────────────

const GrowthBadge = ({ pct }: { pct: number }) => (
  <span
    className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      pct >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    }`}
  >
    {pct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
    {Math.abs(pct)}%
  </span>
);

const StatCard = ({
  label,
  value,
  sub,
  growth,
  icon: Icon,
  iconBg,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  growth?: number;
  icon: React.ElementType;
  iconBg: string;
  accent: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      {growth != null && <GrowthBadge pct={growth} />}
    </div>
    <p className={`text-2xl font-bold ${accent} mb-1`}>{value}</p>
    <p className="text-sm font-medium text-gray-600">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const SectionCard = ({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.dataKey}:</span>
          <span className="font-semibold" style={{ color: p.color }}>
            {p.dataKey === "orders" ? p.value : shortINR(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Date Presets ───────────────────────────────────────────────────────────

const buildPresets = () => [
  { label: "7D", from: nDaysAgo(7), to: todayStr() },
  { label: "30D", from: nDaysAgo(30), to: todayStr() },
  { label: "90D", from: nDaysAgo(90), to: todayStr() },
  {
    label: "This Month",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: todayStr(),
  },
  {
    label: "This Year",
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: todayStr(),
  },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function ReportsAnalytics() {
  const presets = buildPresets();
  const [from, setFrom] = useState(nDaysAgo(30));
  const [to, setTo] = useState(todayStr());
  const [activePreset, setActivePreset] = useState("30D");

  const [summary, setSummary] = useState<RangeSummary | null>(null);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [profitByDay, setProfitByDay] = useState<ProfitPoint[]>([]);
  const [statusData, setStatusData] = useState<StatusPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductProfit[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentBreakdown[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"revenue" | "profit">("revenue");

  const fetchAll = useCallback(async (f: string, t: string) => {
    setLoading(true);
    try {
      const [sumRes, profitRes, profitDayRes, statusRes, topRes, payRes, catRes] = await Promise.all([
        api.get(`/analytics/summary-range?from=${f}&to=${t}`),
        api.get(`/analytics/profit?from=${f}&to=${t}`),
        api.get(`/analytics/profit-by-day?from=${f}&to=${t}`),
        api.get("/analytics/order-status"),
        api.get(`/analytics/top-products-profit?limit=8&from=${f}&to=${t}`),
        api.get("/analytics/payment-methods"),
        api.get("/analytics/top-categories"),
      ]);
      setSummary(sumRes.data);
      setProfit(profitRes.data);
      setProfitByDay(profitDayRes.data);
      setStatusData(statusRes.data.filter((s: StatusPoint) => s.count > 0));
      setTopProducts(topRes.data);
      setPaymentMethods(payRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRange = () => {
    setActivePreset("");
    fetchAll(from, to);
  };

  const applyPreset = (p: (typeof presets)[0]) => {
    setActivePreset(p.label);
    setFrom(p.from);
    setTo(p.to);
    fetchAll(p.from, p.to);
  };

  const formatXAxis = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
        <p className="text-sm">Loading analytics…</p>
      </div>
    );
  }

  const totalPaymentRevenue = paymentMethods.reduce((a, b) => a + b.revenue, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-gray-700" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Business performance overview · {new Date(from).toLocaleDateString("en-IN")} – {new Date(to).toLocaleDateString("en-IN")}
          </p>
        </div>
        <button
          onClick={() => fetchAll(from, to)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── Date Range Filter ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Date Range</span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activePreset === p.label
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => { setFrom(e.target.value); setActivePreset(""); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={to}
              min={from}
              max={todayStr()}
              onChange={(e) => { setTo(e.target.value); setActivePreset(""); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              onClick={applyRange}
              className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={INR(summary.revenue.total)}
            growth={summary.revenue.growthPct}
            sub="vs previous period"
            icon={DollarSign}
            iconBg="bg-emerald-50"
            accent="text-emerald-600"
          />
          <StatCard
            label="Orders"
            value={summary.orders.total.toLocaleString()}
            sub={`${summary.orders.processing} processing`}
            growth={summary.orders.growthPct}
            icon={ShoppingCart}
            iconBg="bg-blue-50"
            accent="text-blue-600"
          />
          <StatCard
            label="New Customers"
            value={summary.customers.total.toLocaleString()}
            growth={summary.customers.growthPct}
            sub="in selected period"
            icon={Users}
            iconBg="bg-purple-50"
            accent="text-purple-600"
          />
          <StatCard
            label="Total Products"
            value={summary.products.total.toLocaleString()}
            icon={Package}
            iconBg="bg-orange-50"
            accent="text-orange-600"
          />
        </div>
      )}

      {/* ── Profit / Margin Summary Cards ── */}
      {profit && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Gross Profit"
            value={INR(profit.grossProfit)}
            sub={`${profit.marginPct}% margin`}
            growth={profit.growth.profit}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            accent={profit.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <StatCard
            label="Total Cost"
            value={INR(profit.cost)}
            sub={profit.coveragePct < 100 ? `~${profit.coveragePct}% items have cost data` : "Full cost coverage"}
            icon={Target}
            iconBg="bg-amber-50"
            accent="text-amber-600"
          />
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm col-span-2">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-xs text-gray-400">Overall Profit Margin</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className={`text-3xl font-bold ${profit.marginPct >= 20 ? "text-emerald-600" : profit.marginPct >= 10 ? "text-amber-500" : "text-red-500"}`}>
                {profit.marginPct}%
              </span>
              <span className="text-sm text-gray-500 mb-1">gross margin</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  profit.marginPct >= 20 ? "bg-emerald-500" : profit.marginPct >= 10 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(Math.max(profit.marginPct, 0), 100)}%` }}
              />
            </div>
            {profit.coveragePct < 100 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {profit.coveragePct}% of order items have purchase price — add cost data for full accuracy
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Revenue / Profit Trend Chart ── */}
      <SectionCard
        title="Revenue & Profit Trend"
        subtitle="Daily breakdown over selected period"
        action={
          <div className="flex gap-1">
            {(["revenue", "profit"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  chartMode === m ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m === "revenue" ? "Revenue vs Cost" : "Profit"}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          {chartMode === "revenue" ? (
            <AreaChart data={profitByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={shortINR} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revGrad)" dot={false} name="revenue" />
              <Area type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={2} fill="url(#costGrad)" dot={false} name="cost" />
            </AreaChart>
          ) : (
            <AreaChart data={profitByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={shortINR} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2.5} fill="url(#profitGrad)" dot={false} name="profit" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Row: Order Status + Payment Methods ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Status */}
        <SectionCard title="Orders by Status" subtitle="All-time status distribution">
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} orders`]} />
                <Legend formatter={(v) => (
                  <span className="text-xs capitalize">{v.toLowerCase().replace("_", " ")}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Payment Methods + Category bar */}
        <SectionCard title="Payment Methods & Categories" subtitle="Revenue split by payment type">
          <div className="space-y-4 mb-5">
            {paymentMethods.map((pm, i) => (
              <div key={pm.method}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {pm.method === "ONLINE" ? "Online Payment" : "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{INR(pm.revenue)}</p>
                    <p className="text-xs text-gray-400">{pm.count} orders</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: totalPaymentRevenue > 0 ? `${(pm.revenue / totalPaymentRevenue) * 100}%` : "0%",
                      background: PAYMENT_COLORS[i],
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalPaymentRevenue > 0 ? ((pm.revenue / totalPaymentRevenue) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                Top Categories
              </h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={categories.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickFormatter={shortINR} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} width={80} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [INR(v), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Top Products Table ── */}
      <SectionCard
        title="Top Products by Revenue & Profit"
        subtitle={`Top 8 products · ${topProducts.filter((p) => p.grossProfit != null).length} with cost data`}
      >
        {topProducts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No sales data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-3">#</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">Product</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 px-3">Sold</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 px-3">Revenue</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 px-3">Cost</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 px-3">Profit</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 pl-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, idx) => (
                  <tr key={item.product?.id ?? idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3">
                      <span className={`text-xs font-bold ${idx < 3 ? "text-amber-500" : "text-gray-300"}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {item.product?.image ? (
                          <img src={item.product.image} alt={item.product.name ?? ""} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[150px]">{item.product?.name ?? "—"}</p>
                          <p className="text-xs text-gray-400">
                            {item.product?.purchasePrice
                              ? `Cost: ${INR(item.product.purchasePrice)}`
                              : <span className="text-amber-500">No cost set</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 font-medium">{item.totalQuantitySold}</td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">{INR(item.totalRevenue)}</td>
                    <td className="py-3 px-3 text-right text-amber-600">
                      {item.totalCost != null ? INR(item.totalCost) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {item.grossProfit != null ? (
                        <span className={item.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
                          {INR(item.grossProfit)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {item.marginPct != null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.marginPct >= 20 ? "bg-emerald-100 text-emerald-700"
                          : item.marginPct >= 10 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                        }`}>
                          {item.marginPct}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Daily Orders & Revenue Bars ── */}
      {profitByDay.length > 0 && (
        <SectionCard title="Daily Orders & Revenue" subtitle="Grouped bar view">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={profitByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={shortINR} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
              <Bar yAxisId="left" dataKey="revenue" fill="#6366F1" radius={[3, 3, 0, 0]} name="revenue" />
              <Bar yAxisId="right" dataKey="orders" fill="#10B981" radius={[3, 3, 0, 0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* ── Footer note ── */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Profit calculations are based on the <strong>purchase price</strong> set on each product.
          Products without a purchase price show <strong>—</strong> in cost and profit columns.
          Set purchase prices in the product add/edit form for complete margin analysis.
        </p>
      </div>
    </div>
  );
}
