import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { PERMISSION_GROUPS, StaffPermission } from "../context/StaffPermissionContext";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import { LockClosedIcon } from "@heroicons/react/24/solid";

// All available permission keys — used when permission customization is disabled
const ALL_PERMISSIONS: StaffPermission[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

// ── Types ─────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  isActive: boolean;
  permissions: StaffPermission[];
  notes: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string; phone: string; createdAt: string; avatar?: string };
}

const emptyForm = {
  username: "",
  email: "",
  phone: "",
  password: "",
  notes: "",
  permissions: [] as StaffPermission[],
};

// ── Permission Checkbox Group ──────────────────────────────────────────────
function PermissionSelector({
  selected,
  onChange,
  disabled = false,
}: {
  selected: StaffPermission[];
  onChange: (perms: StaffPermission[]) => void;
  disabled?: boolean;
}) {
  const toggle = (perm: StaffPermission) => {
    if (disabled) return;
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  const toggleGroup = (groupPerms: readonly StaffPermission[]) => {
    if (disabled) return;
    const allSelected = groupPerms.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !groupPerms.includes(p)));
    } else {
      const toAdd = groupPerms.filter((p) => !selected.includes(p));
      onChange([...selected, ...toAdd]);
    }
  };

  return (
    <div className={`space-y-4 ${disabled ? "opacity-60 select-none" : ""}`}>
      {PERMISSION_GROUPS.map((group) => {
        const groupKeys = group.permissions.map((p) => p.key);
        const allChecked = groupKeys.every((k) => selected.includes(k));
        const someChecked = groupKeys.some((k) => selected.includes(k));

        return (
          <div key={group.label} className="border border-gray-200 rounded-lg p-3">
            <label className={`flex items-center gap-2 font-semibold text-sm text-gray-800 mb-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                onChange={() => toggleGroup(groupKeys)}
                disabled={disabled}
                className="rounded border-gray-300 disabled:cursor-not-allowed"
              />
              {group.label}
            </label>
            <div className="ml-6 grid grid-cols-2 gap-1.5">
              {group.permissions.map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-2 text-sm text-gray-600 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={() => toggle(key)}
                    disabled={disabled}
                    className="rounded border-gray-300 disabled:cursor-not-allowed"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEnabled } = useFeatureFlags();
  const permEnabled = isEnabled("STAFF_PERMISSION_MANAGEMENT");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setSaving] = useState(false);

  // Edit modal
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editBasicForm, setEditBasicForm] = useState({ username: "", email: "", phone: "", notes: "" });
  const [editPermsForEdit, setEditPermsForEdit] = useState<StaffPermission[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Stand-alone permission editor (kept for backwards compat; now opened from Edit modal)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<StaffPermission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff");
      setStaffList(res.data);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Create staff ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = createForm.username.trim();
    const email = createForm.email.trim();
    const phone = createForm.phone.trim();
    const password = createForm.password;

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters.", { id: "staff-validate" });
      return;
    }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,}$/.test(email)) {
      toast.error("Please enter a valid email address.", { id: "staff-validate" });
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Phone must be a valid 10-digit Indian mobile number.", { id: "staff-validate" });
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.", { id: "staff-validate" });
      return;
    }

    setSaving(true);
    try {
      // When permission customization is disabled, grant all permissions automatically
      const payload = permEnabled
        ? { ...createForm, username, email, phone }
        : { ...createForm, username, email, phone, permissions: ALL_PERMISSIONS };
      await api.post("/staff", payload);
      toast.success("Staff account created");
      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create staff");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────
  const handleToggle = async (s: StaffMember) => {
    try {
      const res = await api.patch(`/staff/${s.id}/toggle`);
      setStaffList((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: res.data.isActive } : x)),
      );
    } catch {
      toast.error("Failed to toggle staff status");
    }
  };

  // ── Delete staff ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this staff account permanently?")) return;
    try {
      await api.delete(`/staff/${id}`);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      toast.success("Staff member removed");
    } catch {
      toast.error("Failed to delete staff");
    }
  };
  // ── Open edit modal ──────────────────────────────────────────────────
  const openEditModal = (s: StaffMember) => {
    setEditingStaff(s);
    setEditBasicForm({
      username: s.user.username,
      email: s.user.email,
      phone: s.user.phone,
      notes: s.notes ?? "",
    });
    setEditPermsForEdit(s.permissions);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const username = editBasicForm.username.trim();
    const email = editBasicForm.email.trim();
    const phone = editBasicForm.phone.trim();

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters.", { id: "staff-edit-validate" });
      return;
    }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,}$/.test(email)) {
      toast.error("Please enter a valid email address.", { id: "staff-edit-validate" });
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      toast.error("Phone must be a valid 10-digit Indian mobile number.", { id: "staff-edit-validate" });
      return;
    }

    setSavingEdit(true);
    try {
      // Always update basic details
      const basicRes = await api.patch(`/staff/${editingStaff.id}`, { ...editBasicForm, username, email, phone });

      // Update permissions only when customization is enabled
      if (permEnabled) {
        await api.patch(`/staff/${editingStaff.id}/permissions`, { permissions: editPermsForEdit });
      }

      // Merge updates back into local list
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                notes: basicRes.data.notes,
                permissions: permEnabled ? editPermsForEdit : s.permissions,
                user: { ...s.user, ...basicRes.data.user },
              }
            : s,
        ),
      );

      toast.success("Staff details updated");
      setEditingStaff(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update staff");
    } finally {
      setSavingEdit(false);
    }
  };
  // ── Open permission editor ─────────────────────────────────────────────
  const openPermEditor = (s: StaffMember) => {
    setEditingId(s.id);
    setEditPerms(s.permissions);
  };

  const savePerms = async () => {
    if (!editingId) return;
    setSavingPerms(true);
    try {
      await api.patch(`/staff/${editingId}/permissions`, { permissions: editPerms });
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, permissions: editPerms } : s)),
      );
      toast.success("Permissions updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create staff accounts and control their permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          + Add Staff
        </button>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading staff…</div>
        ) : staffList.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            No staff yet. Create one to delegate tasks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Staff Member", "Permissions", "Status", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center flex-shrink-0">
                          {s.user.avatar ? (
                            <img src={s.user.avatar} alt={s.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {s.user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.user.username}</p>
                          <p className="text-xs text-gray-400">{s.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.permissions.length === 0 ? (
                          <span className="text-gray-400 text-xs">No permissions</span>
                        ) : (
                          s.permissions.slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                            >
                              {p.replace("_", " ")}
                            </span>
                          ))
                        )}
                        {s.permissions.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{s.permissions.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="text-xs px-2 py-1 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (!permEnabled) {
                              toast.error("Permission customization is disabled. This staff member has all permissions.", { id: "perm-locked" });
                              return;
                            }
                            openPermEditor(s);
                          }}
                          className={`inline-flex items-center text-xs px-2 py-1 rounded border transition ${
                            permEnabled
                              ? "border-blue-200 text-blue-600 hover:bg-blue-50"
                              : "border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          {!permEnabled && <LockClosedIcon className="inline h-3 w-3 mr-1 text-red-400" />}
                          Permissions
                        </button>
                        <button
                          onClick={() => handleToggle(s)}
                          className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                        >
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Staff Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Staff Member</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                  <input
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={createForm.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setCreateForm({ ...createForm, phone: digits });
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Temporary Password *
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Optional internal note"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Permissions</p>
                {permEnabled ? (
                  <PermissionSelector
                    selected={createForm.permissions}
                    onChange={(perms) => setCreateForm({ ...createForm, permissions: perms })}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                      <LockClosedIcon className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-800">
                        Permission customization is disabled — staff will be granted{" "}
                        <strong>all permissions</strong> automatically.
                      </p>
                    </div>
                    <PermissionSelector
                      selected={ALL_PERMISSIONS}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Staff Modal ──────────────────────────────────────────────── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center flex-shrink-0">
                {editingStaff.user.avatar ? (
                  <img src={editingStaff.user.avatar} alt={editingStaff.user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {editingStaff.user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Staff Member</h2>
                <p className="text-sm text-gray-400">{editingStaff.user.email}</p>
              </div>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              {/* Basic details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                  <input
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={editBasicForm.username}
                    onChange={(e) => setEditBasicForm({ ...editBasicForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={editBasicForm.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setEditBasicForm({ ...editBasicForm, phone: digits });
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={editBasicForm.email}
                  onChange={(e) => setEditBasicForm({ ...editBasicForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Optional internal note"
                  value={editBasicForm.notes}
                  onChange={(e) => setEditBasicForm({ ...editBasicForm, notes: e.target.value })}
                />
              </div>

              {/* Permissions */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Permissions</p>
                {permEnabled ? (
                  <PermissionSelector
                    selected={editPermsForEdit}
                    onChange={setEditPermsForEdit}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                      <LockClosedIcon className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-800">
                        Permission customization is disabled — this staff member has{" "}
                        <strong>all permissions</strong> granted.
                      </p>
                    </div>
                    <PermissionSelector
                      selected={ALL_PERMISSIONS}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Permission Editor Modal ────────────────────────────────────────── */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Permissions</h2>
            <p className="text-sm text-gray-400 mb-4">
              {staffList.find((s) => s.id === editingId)?.user.username}
            </p>

            {permEnabled ? (
              <PermissionSelector selected={editPerms} onChange={setEditPerms} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                  <LockClosedIcon className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Permission customization is disabled — this staff member has{" "}
                    <strong>all permissions</strong> granted.
                  </p>
                </div>
                <PermissionSelector
                  selected={ALL_PERMISSIONS}
                  onChange={() => {}}
                  disabled
                />
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={savePerms}
                disabled={savingPerms || !permEnabled}
                className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPerms ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
