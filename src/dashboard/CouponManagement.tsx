import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
  discountValue: "",
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
};

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get("/coupon/admin");
      setCoupons(res.data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditCoupon(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount),
      maxUses: c.maxUses != null ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = form.code.toUpperCase().trim();
    const discountValue = parseFloat(form.discountValue);
    const minOrderAmount = form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0;
    const maxUses = form.maxUses ? parseInt(form.maxUses) : null;

    // --- Validation ---
    if (code.length < 3) {
      toast.error("Coupon code must be at least 3 characters.", { id: "coupon-validate" });
      return;
    }
    if (!/^[A-Z0-9_\-]+$/.test(code)) {
      toast.error("Coupon code can only contain letters, numbers, _ and -.", { id: "coupon-validate" });
      return;
    }
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error("Discount value must be greater than 0.", { id: "coupon-validate" });
      return;
    }
    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100%.", { id: "coupon-validate" });
      return;
    }
    if (minOrderAmount < 0) {
      toast.error("Minimum order amount cannot be negative.", { id: "coupon-validate" });
      return;
    }
    if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) {
      toast.error("Max uses must be at least 1.", { id: "coupon-validate" });
      return;
    }
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) {
      toast.error("Expiry date must be in the future.", { id: "coupon-validate" });
      return;
    }

    setSaving(true);
    const payload = {
      code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editCoupon) {
        await api.patch(`/coupon/admin/${editCoupon.id}`, payload);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupon/admin", payload);
        toast.success("Coupon created");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      const res = await api.patch(`/coupon/admin/${c.id}/toggle`);
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? res.data : x)));
    } catch {
      toast.error("Failed to toggle coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon? Orders using it will not be affected.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/coupon/admin/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const badgeClass = (active: boolean, expired: boolean) => {
    if (expired) return "bg-gray-100 text-gray-600";
    if (!active) return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  const isExpired = (c: Coupon) =>
    c.expiresAt != null && new Date(c.expiresAt) < new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          + New Coupon
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Coupons", value: coupons.length },
          {
            label: "Active",
            value: coupons.filter((c) => c.isActive && !isExpired(c)).length,
          },
          { label: "Expired", value: coupons.filter(isExpired).length },
          {
            label: "Total Uses",
            value: coupons.reduce((s, c) => s + c.usedCount, 0),
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading coupons…</div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            No coupons yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Code", "Discount", "Min Order", "Uses", "Expires", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}%`
                          : `₹${c.discountValue}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.usedCount}
                        {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.expiresAt
                          ? new Date(c.expiresAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass(c.isActive, expired)}`}
                        >
                          {expired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(c)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                          >
                            {c.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editCoupon ? "Edit Coupon" : "Create Coupon"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Code *
                </label>
                <input
                  required
                  disabled={!!editCoupon}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Discount Type *
                  </label>
                  <select
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountType: e.target.value as "PERCENTAGE" | "FLAT",
                      })
                    }
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Value *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "500"}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="0"
                    value={form.minOrderAmount}
                    onChange={(e) =>
                      setForm({ ...form, minOrderAmount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Unlimited"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Expires At
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : editCoupon ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
