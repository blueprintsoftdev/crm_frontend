import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, Clock, CheckCircle, Truck, XCircle,
  CreditCard, Banknote, BarChart2, Activity,
} from "lucide-react";
import api from "../utils/api";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DashboardSummary {
  revenue: { total: number; thisMonth: number; growthPct: number };
  orders: { total: number; thisMonth: number; pending: number; growthPct: number };
  customers: { total: number; thisMonth: number; growthPct: number };
  products: { total: number };
}

interface SalesPoint { date: string; revenue: number; orders: number }
interface OrderStatusPoint { status: string; count: number }
interface CategoryPoint { id: string; name: string; revenue: number; unitsSold: number }
interface TopProduct { product: { id: string; name: string; price: number; image?: string } | null; totalRevenue: number; totalQuantitySold: number }
interface LowStockProduct { id: string; name: string; stock: number; image?: string; category?: { name: string } | null }
interface RecentOrder { id: string; finalAmount: number; orderStatus: string; paymentStatus: string; paymentMethod: string; createdAt: string; user: { username: string; email: string } }
interface PaymentMethod { method: string; count: number; revenue: number }

interface DashboardData {
  summary: DashboardSummary;
  salesChart: SalesPoint[];
  orderStatus: OrderStatusPoint[];
  topCategories: CategoryPoint[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
  paymentMethods: PaymentMethod[];
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RUP = "\u20B9";

const INR = (v: number) =>
  RUP + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);

const shortINR = (v: number) => {
  if (v >= 1_00_000) return `${RUP}${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `${RUP}${(v / 1_000).toFixed(0)}K`;
  return `${RUP}${new Intl.NumberFormat("en-IN").format(Math.round(v))}`;
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const fmtDateTime = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const STATUS_COLORS: Record<string, string> = {
  PROCESSING: "#F59E0B",
  CONFIRMED: "#6366F1",
  SHIPPED: "#3B82F6",
  DELIVERED: "#10B981",
  CANCELLED: "#EF4444",
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    PROCESSING: { label: "Processing", cls: "bg-amber-100 text-amber-700", Icon: Clock },
    CONFIRMED: { label: "Confirmed", cls: "bg-indigo-100 text-indigo-700", Icon: CheckCircle },
    SHIPPED: { label: "Shipped", cls: "bg-blue-100 text-blue-700", Icon: Truck },
    DELIVERED: { label: "Delivered", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
    CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700", Icon: XCircle },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600", Icon: Activity };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.cls}`}>
      <c.Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
};

const GrowthBadge = ({ pct }: { pct: number }) => (
  <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${pct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
    {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
    {Math.abs(pct)}%
  </span>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 mb-2">{fmtDate(label)}</p>
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

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Home = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 seconds
    const timer = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(timer);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-400">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#5e785a] rounded-full animate-spin" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const { summary, salesChart, orderStatus, topCategories, topProducts, lowStockProducts, recentOrders, paymentMethods } = data!;

  const maxCatRevenue = topCategories[0]?.revenue || 1;
  const totalPaymentOrders = paymentMethods.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faf7] via-white to-[#f0f5f0] px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Live Snapshot</p>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-[#5e785a]" />
              Dashboard Overview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => { setLoading(true); fetchDashboard(); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* â”€â”€ Stat Cards â”€â”€ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: shortINR(summary.revenue.total),
              sub: `${shortINR(summary.revenue.thisMonth)} this month`,
              pct: summary.revenue.growthPct,
              Icon: DollarSign,
              accent: "text-emerald-700",
              bg: "bg-emerald-50",
              bar: "from-emerald-400 to-lime-400",
            },
            {
              label: "Total Orders",
              value: summary.orders.total.toLocaleString(),
              sub: `${summary.orders.pending} pending`,
              pct: summary.orders.growthPct,
              Icon: ShoppingCart,
              accent: "text-indigo-700",
              bg: "bg-indigo-50",
              bar: "from-indigo-400 to-blue-400",
            },
            {
              label: "Customers",
              value: summary.customers.total.toLocaleString(),
              sub: `+${summary.customers.thisMonth} this month`,
              pct: summary.customers.growthPct,
              Icon: Users,
              accent: "text-sky-700",
              bg: "bg-sky-50",
              bar: "from-sky-400 to-cyan-400",
            },
            {
              label: "Products",
              value: summary.products.total.toLocaleString(),
              sub: `${lowStockProducts.length} low stock`,
              pct: null,
              Icon: Package,
              accent: "text-amber-700",
              bg: "bg-amber-50",
              bar: "from-amber-400 to-orange-400",
            },
          ].map((c) => (
            <Card key={c.label} className="relative overflow-hidden p-5 hover:shadow-md transition-shadow">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar}`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${c.bg}`}>
                  <c.Icon className={`h-5 w-5 ${c.accent}`} />
                </div>
                {c.pct !== null && <GrowthBadge pct={c.pct} />}
              </div>
              <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </Card>
          ))}
        </div>

        {/* â”€â”€ Row 2: Revenue Chart + Order Status â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sales chart */}
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">Revenue & Orders</h2>
                <p className="text-xs text-gray-400">Last 7 days</p>
              </div>
            </div>
            {salesChart.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">No sales data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={salesChart} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" orientation="left" tickFormatter={shortINR} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
                  <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar yAxisId="rev" dataKey="revenue" fill="#5e785a" radius={[6, 6, 0, 0]} name="Revenue" />
                  <Bar yAxisId="ord" dataKey="orders" fill="#a3c4a0" radius={[6, 6, 0, 0]} name="orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Order Status donut */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Order Status</h2>
            <p className="text-xs text-gray-400 mb-3">All-time breakdown</p>
            {orderStatus.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={orderStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" paddingAngle={3}>
                      {orderStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#d1d5db"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {orderStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: STATUS_COLORS[s.status] ?? "#d1d5db" }} />
                        <span className="text-gray-600 capitalize">{s.status.toLowerCase()}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* â”€â”€ Row 3: Category Performance + Low Stock â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Category Performance */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Category Performance</h2>
            <p className="text-xs text-gray-400 mb-4">Revenue by product category</p>
            {topCategories.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">No category data</div>
            ) : (
              <div className="space-y-3">
                {topCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <span className="text-gray-500">{shortINR(cat.revenue)} &middot; {cat.unitsSold} units</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#5e785a] to-[#a3c4a0] transition-all duration-700"
                        style={{ width: `${Math.round((cat.revenue / maxCatRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Low Stock Alert */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-gray-800">Low Stock Alert</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">Products with &le; 10 units remaining</p>
            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
                All products are well-stocked
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 hover:bg-amber-50 transition">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      {p.category && <p className="text-[10px] text-gray-400">{p.category.name}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-700" : p.stock <= 3 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* â”€â”€ Row 4: Top Products + Payment Methods â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Products */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Top Selling Products</h2>
            <p className="text-xs text-gray-400 mb-4">By total revenue generated</p>
            {topProducts.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">No sales data</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((tp, idx) => (
                  <div key={tp.product?.id ?? idx} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
                    {tp.product?.image ? (
                      <img src={tp.product.image} alt={tp.product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{tp.product?.name ?? "Unknown"}</p>
                      <p className="text-[10px] text-gray-400">{tp.totalQuantitySold} units sold</p>
                    </div>
                    <span className="text-sm font-bold text-[#5e785a] flex-shrink-0">{shortINR(tp.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Methods */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Payment Methods</h2>
            <p className="text-xs text-gray-400 mb-4">Order split by payment type</p>
            <div className="space-y-4">
              {paymentMethods.map((pm) => {
                const pct = Math.round((pm.count / totalPaymentOrders) * 100);
                const isOnline = pm.method === "ONLINE";
                return (
                  <div key={pm.method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isOnline ? <CreditCard className="h-4 w-4 text-indigo-500" /> : <Banknote className="h-4 w-4 text-emerald-500" />}
                        <span className="text-sm font-medium text-gray-700">{isOnline ? "Online Payment" : "Cash on Delivery"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-800">{pct}%</span>
                        <span className="text-[10px] text-gray-400 ml-1">({pm.count} orders)</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${isOnline ? "bg-gradient-to-r from-indigo-500 to-blue-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{shortINR(pm.revenue)} total</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* â”€â”€ Row 5: Recent Orders â”€â”€ */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest 8 orders across all customers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Order ID</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Payment</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-mono text-gray-500">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{order.user.username}</p>
                        <p className="text-gray-400 text-[10px]">{order.user.email}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-800">{INR(order.finalAmount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={order.orderStatus} /></td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${order.paymentMethod === "ONLINE" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {order.paymentMethod === "ONLINE" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                          {order.paymentMethod === "ONLINE" ? "Online" : "COD"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{fmtDateTime(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Home;
