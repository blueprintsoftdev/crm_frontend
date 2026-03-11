// src/users/CustomerManagementPage.tsx
// Shows all CUSTOMER accounts with search, edit, and delete capabilities.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UsersIcon, PlusIcon } from "@heroicons/react/24/outline";
import Listusers from "./Listusers";

export default function CustomerManagementPage() {
  const location = useLocation();
  const dashPrefix = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : "/admin-dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Customer Management
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Customer Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View, search, edit, and manage all customer accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Customer list */}
      <Listusers roleFilter="CUSTOMER" />
    </div>
  );
}
