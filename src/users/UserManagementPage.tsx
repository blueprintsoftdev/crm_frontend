// src/users/UserManagementPage.tsx
// Combined User Management + Staff Management page with tabs.
// "Staff Management" tab is locked (but still visible) when STAFF_MANAGEMENT
// feature is disabled by Super Admin.

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UsersIcon,
  UserGroupIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import { useAuth } from "../context/AuthContext";
import StaffManagement from "../dashboard/StaffManagement";
import Listusers from "./Listusers";
import toast from "react-hot-toast";

type ActiveTab = "users" | "staff";

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");
  const { isEnabled } = useFeatureFlags();
  const { user } = useAuth();
  const location = useLocation();

  // SUPER_ADMIN always sees staff management regardless of the flag
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const staffEnabled = isSuperAdmin || isEnabled("STAFF_MANAGEMENT");

  // Resolve "Add User" link relative to the current dashboard prefix
  const dashPrefix = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : "/admin-dashboard";

  const handleStaffTabClick = () => {
    if (!staffEnabled) {
      toast.error("Staff Management has been disabled by the Super Admin.", {
        id: "staff-locked",
      });
      return;
    }
    setActiveTab("staff");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* ── Page Header ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              User Management
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Admin &amp; Staff Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage admin accounts and staff members from one place.
            </p>
          </div>

          {/* "Add User" button — only shown on the Users tab */}
          {activeTab === "users" && (
            <Link
              to={`${dashPrefix}/manage-user/add-user`}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add User
            </Link>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="User management tabs">
            {/* User Accounts tab */}
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              User Accounts
            </button>

            {/* Staff Management tab — locked style if disabled */}
            <button
              onClick={handleStaffTabClick}
              title={
                !staffEnabled
                  ? "Staff Management is disabled by the Super Admin"
                  : undefined
              }
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "staff"
                  ? "border-slate-900 text-slate-900"
                  : !staffEnabled
                  ? "border-transparent text-gray-400 cursor-not-allowed"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UserGroupIcon className="h-4 w-4" />
              Staff Management
              {!staffEnabled && (
                <>
                
                  <span className="ml-1 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">
                    PRO
                  </span>
                </>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === "users" && <Listusers roleFilter="ADMIN" />}

        {activeTab === "staff" && staffEnabled && <StaffManagement />}

        {activeTab === "staff" && !staffEnabled && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100">
              <LockClosedIcon className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Staff Management Disabled
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                The Super Admin has disabled Staff Management. Contact your Super
                Admin to re-enable this feature.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
