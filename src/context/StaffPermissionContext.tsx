// src/context/StaffPermissionContext.tsx
// Fetches staff permissions from the backend when the authenticated user is STAFF.
// Provides `hasPermission(perm)` and `permissions[]` to the admin dashboard.
// For ADMIN / SUPER_ADMIN the context is a no-op (all permissions treated as true).

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

// ── Permission constants (mirrors backend src/config/staffPermissions.ts) ──
export type StaffPermission =
  | "CATEGORY_VIEW"
  | "CATEGORY_ADD"
  | "CATEGORY_EDIT"
  | "CATEGORY_DELETE"
  | "PRODUCT_VIEW"
  | "PRODUCT_ADD"
  | "PRODUCT_EDIT"
  | "PRODUCT_DELETE"
  | "ORDER_VIEW"
  | "ORDER_UPDATE";

export const PERMISSION_GROUPS = [
  {
    label: "Category Management",
    permissions: [
      { key: "CATEGORY_VIEW" as StaffPermission, label: "View / List Categories" },
      { key: "CATEGORY_ADD" as StaffPermission, label: "Add Category" },
      { key: "CATEGORY_EDIT" as StaffPermission, label: "Edit Category" },
      { key: "CATEGORY_DELETE" as StaffPermission, label: "Delete Category" },
    ],
  },
  {
    label: "Product Management",
    permissions: [
      { key: "PRODUCT_VIEW" as StaffPermission, label: "View / List Products" },
      { key: "PRODUCT_ADD" as StaffPermission, label: "Add Product" },
      { key: "PRODUCT_EDIT" as StaffPermission, label: "Edit Product" },
      { key: "PRODUCT_DELETE" as StaffPermission, label: "Delete Product" },
    ],
  },
  {
    label: "Order Management",
    permissions: [
      { key: "ORDER_VIEW" as StaffPermission, label: "View Orders" },
      { key: "ORDER_UPDATE" as StaffPermission, label: "Update Order Status" },
    ],
  },
] as const;

// ── Context types ────────────────────────────────────────────────────────────
interface StaffPermissionContextValue {
  permissions: StaffPermission[];
  username: string;
  hasPermission: (perm: StaffPermission) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const StaffPermissionContext = createContext<StaffPermissionContextValue | undefined>(
  undefined,
);

export const useStaffPermissions = (): StaffPermissionContextValue => {
  const ctx = useContext(StaffPermissionContext);
  if (!ctx) throw new Error("useStaffPermissions must be used inside <StaffPermissionProvider>");
  return ctx;
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const StaffPermissionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user.isAuthenticated || user.role !== "STAFF") {
      setPermissions([]);
      setUsername("");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ permissions: StaffPermission[]; username: string }>("/staff/profile");
      setPermissions(res.data.permissions ?? []);
      setUsername(res.data.username ?? "");
    } catch {
      setPermissions([]);
      setUsername("");
    } finally {
      setLoading(false);
    }
  }, [user.isAuthenticated, user.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // For ADMIN / SUPER_ADMIN every permission check returns true
  const hasPermission = (perm: StaffPermission): boolean => {
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;
    return permissions.includes(perm);
  };

  return (
    <StaffPermissionContext.Provider value={{ permissions, username, hasPermission, loading, refresh }}>
      {children}
    </StaffPermissionContext.Provider>
  );
};
