// src/dashboard/AuditLog.tsx
// Audit Log page — visible to ADMIN and SUPER_ADMIN.
// Super Admin also sees the "Clear All Logs" button.

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string | null;
    role: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_COUPON: "bg-green-100 text-green-700",
  UPDATE_COUPON: "bg-blue-100 text-blue-700",
  DELETE_COUPON: "bg-red-100 text-red-700",
  ACTIVATE_COUPON: "bg-emerald-100 text-emerald-700",
  DEACTIVATE_COUPON: "bg-yellow-100 text-yellow-700",
  CREATE_USER: "bg-indigo-100 text-indigo-700",
  UPDATE_USER: "bg-blue-100 text-blue-700",
  DELETE_USER: "bg-red-100 text-red-700",
  UPDATE_ORDER_STATUS: "bg-purple-100 text-purple-700",
  DEFAULT: "bg-gray-100 text-gray-700",
};

const badgeClass = (action: string) =>
  ACTION_COLORS[action] ?? ACTION_COLORS.DEFAULT;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AuditLog() {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const featureEnabled = isSuperAdmin || isEnabled("AUDIT_LOG");

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0, page: 1, limit: 30, totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (filterAction) params.set("action", filterAction);
      if (filterEntity) params.set("entity", filterEntity);
      if (filterUser) params.set("userId", filterUser);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, filterUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently delete ALL audit logs? This cannot be undone.")) return;
    setClearing(true);
    try {
      await api.delete("/audit-logs");
      toast.success("Audit logs cleared");
      setLogs([]);
      setPagination({ total: 0, page: 1, limit: 30, totalPages: 1 });
    } catch {
      toast.error("Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Show disabled state for Admin when AUDIT_LOG feature is turned off
  if (!featureEnabled) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-800 rounded-xl">
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-red-700 mb-2">Audit Log Disabled</h2>
          <p className="text-sm text-red-600 max-w-sm">
            This feature has been disabled by the Super Admin. Audit log access
            is unavailable until it is re-enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl">
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500">{pagination.total} total entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          {isSuperAdmin && (
            <button
              onClick={handleClearAll}
              disabled={clearing || logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
            >
              <TrashIcon className="h-4 w-4" />
              {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by action (e.g. DELETE_USER)"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value.toUpperCase())}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-gray-50"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by entity (e.g. Coupon)"
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-gray-50"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardDocumentListIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No audit log entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.user.username}</div>
                      <div className="text-xs text-gray-400">{log.user.role}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 font-medium">{log.entity}</span>
                      {log.entityId && (
                        <div className="text-xs text-gray-400 font-mono">#{log.entityId.slice(-8)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {log.details ? (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1 font-mono truncate max-w-[220px]">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
