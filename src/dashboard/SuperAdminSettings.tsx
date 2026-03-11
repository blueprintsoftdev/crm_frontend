// src/dashboard/SuperAdminSettings.tsx
// Feature flag management panel — visible only to SUPER_ADMIN.
// Displays all 7 features as toggles; changes are saved in real-time via PATCH request.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useFeatureFlags, type FeatureFlag } from "../context/FeatureFlagContext";
import api from "../utils/api";

// ── Feature descriptions shown in the UI ────────────────────────────────────
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  USER_MANAGEMENT: "Allow Admin to view, add, and manage admin accounts.",
  CATEGORY_MANAGEMENT: "Allow Admin to create, edit, and delete product categories.",
  PRODUCT_MANAGEMENT: "Allow Admin to add, update, and remove products.",
  ORDER_MANAGEMENT: "Allow Admin to view all orders and update order statuses.",
  COUPON_MANAGEMENT: "Allow Admin to create and manage discount coupons.",
  NOTIFICATION_MANAGEMENT: "Allow Admin to view and manage system notifications.",
  REPORTS_ANALYTICS: "Allow Admin to access the dashboard summary, revenue charts, and analytics.",
  STAFF_MANAGEMENT: "Allow Admin to create and manage staff members with limited permissions.",
  STAFF_PERMISSION_MANAGEMENT: "Allow Admin to assign and edit permissions for each staff member. When disabled, the permissions section is locked in the staff form.",
  WAREHOUSE_SETTINGS: "Allow Admin to view warehouse location settings. When disabled, shipping is free for all orders.",
  AUDIT_LOG: "Allow Admin to access the audit log showing all admin and system actions.",
  CUSTOMER_ACTIVITY_TRACKER: "Allow Admin to monitor real-time customer wishlist and cart activity. Shows which customers have added products and provides live count updates.",
  PAYMENT_LOGS: "Allow Admin to view detailed payment transaction logs including Razorpay IDs, gateway responses, and signature verification results.",
};

// Features that are children of another feature (visually nested).
const CHILD_OF: Record<string, string> = {
  STAFF_PERMISSION_MANAGEMENT: "STAFF_MANAGEMENT",
};

export default function SuperAdminSettings() {
  const { user } = useAuth();
  const { flags, refresh, loading } = useFeatureFlags();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<string | null>(null);
  const [localFlags, setLocalFlags] = useState<FeatureFlag[]>([]);

  // Guard: only Super Admin can access this page
  useEffect(() => {
    if (!user.isAuthenticated) return;
    if (user.role !== "SUPER_ADMIN") {
      navigate("/super-admin-dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Sync local state with context flags
  useEffect(() => {
    if (flags.length > 0) {
      setLocalFlags(flags);
    } else if (user.role === "SUPER_ADMIN") {
      // Super Admin has all flags enabled by default in context; fetch them directly
      api.get<FeatureFlag[]>("/super-admin/features").then((res) => {
        setLocalFlags(res.data);
      });
    }
  }, [flags, user.role]);

  const handleToggle = async (feature: string, current: boolean) => {
    const newValue = !current;
    // Optimistic update
    setLocalFlags((prev) =>
      prev.map((f) => (f.feature === feature ? { ...f, isEnabled: newValue } : f)),
    );
    setSaving(feature);

    try {
      await api.patch(`/super-admin/features/${feature}`, { isEnabled: newValue });
      await refresh(); // Sync context
    } catch (err) {
      // Revert on error
      setLocalFlags((prev) =>
        prev.map((f) => (f.feature === feature ? { ...f, isEnabled: current } : f)),
      );
      console.error("Failed to update feature flag", err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
          <ShieldCheckIcon className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Enable or disable features for the Admin. Changes take effect immediately.
            Super Admin access is never affected by these settings.
          </p>
        </div>
      </div>

      {loading && localFlags.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          Loading feature flags…
        </div>
      ) : (
        <div className="space-y-3">
          {localFlags.map((flag) => {
            const parentFeature = CHILD_OF[flag.feature];
            const isChild = Boolean(parentFeature);
            // When parent is disabled, child toggle is also forced off & greyed out
            const parentDisabled =
              isChild &&
              localFlags.find((f) => f.feature === parentFeature)?.isEnabled === false;

            return (
              <div
                key={flag.feature}
                className={`flex items-start justify-between bg-white rounded-xl border shadow-sm px-5 py-4 hover:shadow-md transition-shadow ${
                  isChild
                    ? "ml-8 border-l-4 border-l-indigo-200 border-gray-200"
                    : "border-gray-200"
                } ${parentDisabled ? "opacity-50" : ""}`}
              >
                {/* Left: label + description */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    {isChild && (
                      <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">↳</span>
                    )}
                    <span className="font-semibold text-gray-900 text-sm">
                      {flag.label}
                    </span>
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        flag.isEnabled && !parentDisabled
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {flag.isEnabled && !parentDisabled ? "Enabled" : "Disabled"}
                    </span>
                    {parentDisabled && (
                      <span className="text-xs text-gray-400 italic">(parent disabled)</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {FEATURE_DESCRIPTIONS[flag.feature] ?? ""}
                  </p>
                </div>

                {/* Right: toggle */}
                <button
                  type="button"
                  disabled={saving === flag.feature || Boolean(parentDisabled)}
                  onClick={() => handleToggle(flag.feature, flag.isEnabled)}
                  aria-pressed={flag.isEnabled && !parentDisabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    flag.isEnabled && !parentDisabled ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                >
                  <span className="sr-only">
                    {flag.isEnabled ? "Disable" : "Enable"} {flag.label}
                  </span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      flag.isEnabled && !parentDisabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 text-center">
        These settings are stored in the database and persist across all sessions.
      </p>
    </div>
  );
}
