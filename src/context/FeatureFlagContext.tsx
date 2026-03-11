// src/context/FeatureFlagContext.tsx
// Fetches feature flags from the backend on mount (when the user is ADMIN or SUPER_ADMIN).
// Provides `isEnabled(feature)` and `flags` to all consumers.
// SUPER_ADMIN always sees all features as enabled in the UI.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────
export type Feature =
  | "USER_MANAGEMENT"
  | "CATEGORY_MANAGEMENT"
  | "PRODUCT_MANAGEMENT"
  | "ORDER_MANAGEMENT"
  | "COUPON_MANAGEMENT"
  | "NOTIFICATION_MANAGEMENT"
  | "REPORTS_ANALYTICS"
  | "STAFF_MANAGEMENT"
  | "STAFF_PERMISSION_MANAGEMENT"
  | "WAREHOUSE_SETTINGS"
  | "AUDIT_LOG"
  | "CUSTOMER_ACTIVITY_TRACKER"
  | "PAYMENT_LOGS"
  | "PRODUCT_REVIEWS"
  | "HOMEPAGE_MANAGEMENT"
  | "ADMIN_ORDER";

export interface FeatureFlag {
  feature: Feature;
  label: string;
  isEnabled: boolean;
}

interface FeatureFlagContextValue {
  flags: FeatureFlag[];
  isEnabled: (feature: Feature) => boolean;
  refresh: () => Promise<void>;
  loading: boolean;
}

// ── Context ──────────────────────────────────────────────────────────────────
const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export const useFeatureFlags = (): FeatureFlagContextValue => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error("useFeatureFlags must be used inside <FeatureFlagProvider>");
  return ctx;
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    // Only fetch if user is an admin role
    if (!user.isAuthenticated || !["ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) {
      setFlags([]);
      return;
    }

    // SUPER_ADMIN always has full access — no need to hide features in UI
    if (user.role === "SUPER_ADMIN") {
      return; // Super Admin sees everything; isEnabled will always return true
    }

    try {
      setLoading(true);
      const res = await api.get<FeatureFlag[]>("/super-admin/features");
      setFlags(res.data);
    } catch (err) {
      console.error("Failed to load feature flags", err);
    } finally {
      setLoading(false);
    }
  }, [user.isAuthenticated, user.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (feature: Feature): boolean => {
      // Super Admin bypasses feature flags
      if (user.role === "SUPER_ADMIN") return true;
      const flag = flags.find((f) => f.feature === feature);
      // Default to enabled if flag is not yet loaded
      return flag?.isEnabled ?? true;
    },
    [flags, user.role],
  );

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, refresh, loading }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
