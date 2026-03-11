// src/users/Listusers.tsx
// Reusable user list table with edit and delete actions.
// Accepts an optional roleFilter prop to show only ADMIN or CUSTOMER users.

import React, { useEffect, useState, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../utils/api";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
}

export interface ListUsersProps {
  roleFilter?: "ADMIN" | "CUSTOMER";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (user: User) => {
  const src = (user.username || user.email || "").trim();
  if (!src) return "?";
  const parts = src.split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

const RoleBadge = ({ role }: { role?: string }) => {
  const n = (role || "").toLowerCase();
  let cls = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
  if (n === "admin") cls += " bg-red-50 text-red-700 ring-1 ring-red-100";
  else if (n === "customer") cls += " bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  else if (n === "staff") cls += " bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  else cls += " bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return <span className={cls}>{role || "N/A"}</span>;
};

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}
const PaginationControls = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) => {
  const hasResults = totalItems > 0;
  const start = hasResults ? (currentPage - 1) * pageSize + 1 : 0;
  const end = hasResults ? Math.min(currentPage * pageSize, totalItems) : 0;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
      <p className="text-sm text-gray-600 mb-3 sm:mb-0">
        {hasResults ? (
          <>
            Showing <span className="font-semibold">{start}</span> to{" "}
            <span className="font-semibold">{end}</span> of{" "}
            <span className="font-semibold">{totalItems}</span> results
          </>
        ) : (
          "No results found"
        )}
      </p>
      <nav className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages === 0}
          className="flex items-center justify-center rounded-md px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="hidden md:flex">
          {Array.from({ length: totalPages || 0 }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                p === currentPage
                  ? "bg-[#48633f] text-white shadow-sm"
                  : "text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex items-center justify-center rounded-md px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 3) {
      toast.error("Name must be at least 3 characters.", { id: "edit-user-validate" });
      return;
    }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,}$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.", { id: "edit-user-validate" });
      return;
    }
    if (phone && !/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Phone must be a valid 10-digit Indian mobile number.", { id: "edit-user-validate" });
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch(`/admin/users/${user.id}`, { username: trimmedName, email: trimmedEmail, phone });
      toast.success("User updated successfully", { id: "edit-user-success" });
      onSaved(res.data.user);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user", { id: "edit-user-error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#48633f] focus:border-[#48633f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#48633f] focus:border-[#48633f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={handlePhoneChange}
              placeholder="10-digit mobile number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#48633f] focus:border-[#48633f]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#48633f] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#3a5233] disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ListUsers = ({ roleFilter }: ListUsersProps) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const USERS_PER_PAGE = 10;

  const fetchUsers = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    api
      .get("/admin/users", { params })
      .then((res) => {
        setAllUsers(res.data.users || []);
        setError("");
        setCurrentPage(1);
      })
      .catch(() => {
        setError("Failed to load users. Please check your network or try again.");
        setAllUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    const term = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term),
    );
  }, [allUsers, searchTerm]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / USERS_PER_PAGE) || 0;
  const usersOnCurrentPage = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone."))
      return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      setAllUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUserSaved = (updated: User) => {
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setEditingUser(null);
  };

  const totalAdmins = allUsers.filter((u) => (u.role || "").toUpperCase() === "ADMIN").length;
  const totalCustomers = allUsers.filter(
    (u) => (u.role || "").toUpperCase() === "CUSTOMER",
  ).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-16 min-h-screen bg-gray-50">
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleUserSaved}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Total Users
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{allUsers.length}</p>
        </div>
        {!roleFilter && (
          <>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Admins
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{totalAdmins}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Customers
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{totalCustomers}</p>
            </div>
          </>
        )}
        {roleFilter === "ADMIN" && (
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm col-span-2">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Admin Accounts
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{totalAdmins}</p>
          </div>
        )}
        {roleFilter === "CUSTOMER" && (
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm col-span-2">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Customer Accounts
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{totalCustomers}</p>
          </div>
        )}
      </div>

      {/* Table container */}
      <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gray-50/60">
          <div>
            <h2 className="text-sm font-medium text-gray-900">Users List</h2>
            <p className="text-xs text-gray-500">
              Search and browse through all user accounts.
            </p>
          </div>
          <div className="w-full sm:w-72 relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, role…"
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#48633f] focus:outline-none focus:ring-1 focus:ring-[#48633f]"
            />
          </div>
        </div>

        {loading && (
          <p className="text-[#48633f] text-center text-md mt-8 mb-8 font-medium animate-pulse">
            Loading users…
          </p>
        )}
        {error && !loading && (
          <p className="text-red-600 text-center text-sm mt-4 mb-4 py-3">⚠️ {error}</p>
        )}

        {!loading && !error && (
          <>
            {usersOnCurrentPage.length === 0 ? (
              <p className="text-gray-600 text-center py-10 text-sm">
                No users found for the current filters.
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {usersOnCurrentPage.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#48633f]/10 text-xs font-semibold text-[#48633f]">
                                {getInitials(user)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.username || "Unnamed"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ID: {user.id?.slice(-6)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.phone || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                              >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={deletingId === user.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                {deletingId === user.id ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                  {usersOnCurrentPage.map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#48633f]/10 text-sm font-semibold text-[#48633f]">
                          {getInitials(user)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-base">
                            {user.username || "Unnamed"}
                          </p>
                          <p className="text-[11px] text-gray-500">ID: {user.id?.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <p className="text-gray-600">
                          <span className="font-medium">Email: </span>
                          {user.email}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Phone: </span>
                          {user.phone || "N/A"}
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="font-medium">Role: </span>
                          <RoleBadge role={user.role} />
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="flex-1 inline-flex justify-center items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="flex-1 inline-flex justify-center items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />{" "}
                          {deletingId === user.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={USERS_PER_PAGE}
                  totalItems={totalItems}
                  onPageChange={(p) => {
                    if (p >= 1 && p <= totalPages) setCurrentPage(p);
                  }}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListUsers;




