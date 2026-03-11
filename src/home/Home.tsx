import React, { useEffect, useState, useMemo } from "react";
import OrdersBarChart from "./OrdersBarChart";
import api from "../utils/api";

import {
  UsersIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowTrendingDownIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// ---------------- DUMMY STATIC DATA (kept as-is) ----------------

const quickInsights = [
  { label: "Conversion Rate", value: "3.8%", helper: "Storewide" },
  { label: "Average Order Value", value: "₹ 1,420", helper: "Last 30 days" },
  { label: "Repeat Customers", value: "41%", helper: "Returning buyers" },
];

const categoryData = [
  { name: "Sarees", value: 62, amount: "₹ 2.1L" },
  { name: "Kurtis", value: 21, amount: "₹ 0.7L" },
  { name: "Kids Wear", value: 11, amount: "₹ 0.3L" },
  { name: "Others", value: 6, amount: "₹ 0.1L" },
];

const recentSignals = [
  {
    color: "bg-emerald-500",
    title: "Weekend spike in saree orders.",
    detail: "32% higher than the weekday average.",
  },
  {
    color: "bg-sky-500",
    title: "COD conversion improved.",
    detail: "Drop in cart abandonment for COD orders.",
  },
  {
    color: "bg-amber-400",
    title: "High repeat buyers in Kerala.",
    detail: "Region driving majority of repeat orders.",
  },
];

interface DashboardSummary {
  users: { total: number; growth: number };
  orders: { total: number; growth: number };
  products: { total: number; growth: number };
  revenue: { total: number; growth: number };
}

interface SalesChartItem {
  _id: string;
  orders: number;
  revenue: number;
}

interface DashboardData {
  summary: DashboardSummary;
  salesChart: SalesChartItem[];
}

// ---------------- MAIN COMPONENT ----------------

const Home = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin summary
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/summary");
        setDashboard(res.data);
      } catch (err) {
        console.error("Failed to load admin dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Stat cards mapped from backend
  const statCards = useMemo(() => {
    if (!dashboard) return [];

    const { users, orders, products, revenue } = dashboard.summary;

    return [
      {
        label: "Total Users",
        value: users.total.toLocaleString(),
        change: `${users.growth.toFixed(1)}%`,
        trend: users.growth >= 0 ? "up" : "down",
        helper: "vs last month",
        icon: UsersIcon,
      },
      {
        label: "Net Revenue",
        value: `₹ ${Math.round(revenue.total).toLocaleString()}`,
        change: `${revenue.growth.toFixed(1)}%`,
        trend: revenue.growth >= 0 ? "up" : "down",
        helper: "after discounts",
        icon: CurrencyDollarIcon,
      },
      {
        label: "Active Products",
        value: products.total.toLocaleString(),
        change: `${products.growth.toFixed(1)}%`,
        trend: products.growth >= 0 ? "up" : "down",
        helper: "live on store",
        icon: ArchiveBoxIcon,
      },
      {
        label: "Orders (This Month)",
        value: orders.total.toLocaleString(),
        change: `${orders.growth.toFixed(1)}%`,
        trend: orders.growth >= 0 ? "up" : "down",
        helper: "completed orders",
        icon: ShoppingCartIcon,
      },
    ];
  }, [dashboard]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f7faf7] via-[#f4f7f2] to-[#e2eee3] px-4 py-6 md:px-8 flex justify-center">
      <div className="w-full max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7f8f7a]">
              blueprint_crm · Admin
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#263526]">
              Analytics Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Key performance insights for your ecommerce store.
            </p>
          </div>
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon;
            const isUp = item.trend === "up";

            return (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-emerald-50/70 bg-white/80 p-4 shadow-sm backdrop-blur"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400" />

                <div className="flex justify-between">
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#263526]">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-gray-500">{item.helper}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-[11px] ${
                        isUp
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {item.change}
                    </span>
                    <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Chart + Insights */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Orders Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white/90 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-semibold text-[#263526]">
                Orders & Revenue (Last 7 Days)
              </h2>
            </div>

            <OrdersBarChart data={dashboard?.salesChart || []} />

            {/* Category Performance */}
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-[#263526]">
                Category Performance
              </h3>

              <div className="mt-4 space-y-3">
                {categoryData.map((row) => (
                  <div key={row.name}>
                    <div className="flex justify-between text-xs">
                      <span>{row.name}</span>
                      <span>{row.amount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Cards */}
          <div className="space-y-4">
            {/* Store Pulse */}
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ChartPieIcon className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold">Store Pulse</h3>
              </div>

              {quickInsights.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between rounded-xl bg-gray-50 px-3 py-2 mb-2"
                >
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-semibold">{item.value}</p>
                  </div>
                  <p className="text-[11px] text-gray-400">{item.helper}</p>
                </div>
              ))}
            </div>

            {/* Returns & Rating */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
                <ArrowTrendingDownIcon className="h-4 w-4 text-rose-400 mb-2" />
                <p className="text-xl font-semibold">3.2%</p>
                <p className="text-[11px] text-gray-500">Monthly Returns</p>
              </div>

              <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
                <StarIcon className="h-4 w-4 text-amber-400 mb-2" />
                <p className="text-xl font-semibold">4.6 / 5</p>
                <p className="text-[11px] text-gray-500">Avg. Rating</p>
              </div>
            </div>

            {/* Recent Signals */}
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Recent Signals</h3>
              {recentSignals.map((signal) => (
                <div key={signal.title} className="flex gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${signal.color}`} />
                  <div>
                    <p className="text-xs font-medium">{signal.title}</p>
                    <p className="text-[11px] text-gray-500">{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
