import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Filter,
  Tag,
  CheckCircle,
  X,
  GripVertical,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttributeValue {
  id: string;
  value: string;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  type: string;
  isFilterable: boolean;
  isRequired: boolean;
  sortOrder: number;
  values: AttributeValue[];
}

const ATTR_TYPES = [
  { value: "SELECT", label: "Select (single pick)" },
  { value: "MULTISELECT", label: "Multi-Select (multiple picks)" },
  { value: "TEXT", label: "Text (free input)" },
  { value: "NUMBER", label: "Number (free input)" },
  { value: "BOOLEAN", label: "Boolean (Yes / No)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    SELECT: "bg-blue-100 text-blue-700",
    MULTISELECT: "bg-purple-100 text-purple-700",
    TEXT: "bg-green-100 text-green-700",
    NUMBER: "bg-amber-100 text-amber-700",
    BOOLEAN: "bg-slate-100 text-slate-700",
  };
  return map[type] ?? "bg-gray-100 text-gray-600";
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CategoryAttributes: React.FC<{ categoryId?: string; inline?: boolean }> = ({
  categoryId: propCategoryId,
  inline = false,
}) => {
  const params = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const categoryId = propCategoryId ?? params.categoryId;

  const [categoryName, setCategoryName] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttrId, setExpandedAttrId] = useState<string | null>(null);

  // Add attribute form
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [newAttr, setNewAttr] = useState({
    name: "",
    type: "SELECT",
    isFilterable: true,
    isRequired: false,
  });
  const [attrSaving, setAttrSaving] = useState(false);

  // Edit attribute form
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editAttr, setEditAttr] = useState({ name: "", type: "", isFilterable: true, isRequired: false });

  // Add value form (per attribute)
  const [newValueText, setNewValueText] = useState<Record<string, string>>({});
  const [valueSaving, setValueSaving] = useState<Record<string, boolean>>({});

  // Edit value
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editValueText, setEditValueText] = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadAttributes = useCallback(async () => {
    if (!categoryId) return;
    try {
      const res = await api.get(`/category/${categoryId}/attributes`);
      setAttributes(res.data.attributes ?? []);
    } catch {
      toast.error("Failed to load attributes");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    if (!inline) {
      api.get("/category/list").then((res) => {
        const cat = (res.data.list ?? []).find((c: { id: string; name: string }) => c.id === categoryId);
        if (cat) setCategoryName(cat.name);
      }).catch(() => {});
    }
    loadAttributes();
  }, [categoryId, inline, loadAttributes]);

  // ── Attribute actions ──────────────────────────────────────────────────────

  const handleAddAttribute = async () => {
    if (!newAttr.name.trim()) {
      toast.error("Attribute name is required");
      return;
    }
    setAttrSaving(true);
    try {
      await api.post(`/category/${categoryId}/attributes`, newAttr);
      toast.success("Attribute added");
      setNewAttr({ name: "", type: "SELECT", isFilterable: true, isRequired: false });
      setShowAddAttr(false);
      await loadAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to add attribute");
    } finally {
      setAttrSaving(false);
    }
  };

  const handleUpdateAttribute = async (attrId: string) => {
    try {
      await api.put(`/category/${categoryId}/attributes/${attrId}`, editAttr);
      toast.success("Attribute updated");
      setEditingAttrId(null);
      await loadAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update attribute");
    }
  };

  const handleDeleteAttribute = async (attrId: string, name: string) => {
    if (!confirm(`Delete attribute "${name}" and all its values?\nThis will also remove it from all products.`)) return;
    try {
      await api.delete(`/category/${categoryId}/attributes/${attrId}`);
      toast.success("Attribute deleted");
      await loadAttributes();
    } catch {
      toast.error("Failed to delete attribute");
    }
  };

  // ── Value actions ──────────────────────────────────────────────────────────

  const handleAddValue = async (attrId: string) => {
    const value = (newValueText[attrId] ?? "").trim();
    if (!value) return;
    setValueSaving((p) => ({ ...p, [attrId]: true }));
    try {
      await api.post(`/category/${categoryId}/attributes/${attrId}/values`, { value });
      toast.success("Value added");
      setNewValueText((p) => ({ ...p, [attrId]: "" }));
      await loadAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to add value");
    } finally {
      setValueSaving((p) => ({ ...p, [attrId]: false }));
    }
  };

  const handleUpdateValue = async (attrId: string, valueId: string) => {
    if (!editValueText.trim()) return;
    try {
      await api.put(`/category/${categoryId}/attributes/${attrId}/values/${valueId}`, { value: editValueText });
      toast.success("Value updated");
      setEditingValueId(null);
      await loadAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update value");
    }
  };

  const handleDeleteValue = async (attrId: string, valueId: string, value: string) => {
    if (!confirm(`Delete value "${value}"?`)) return;
    try {
      await api.delete(`/category/${categoryId}/attributes/${attrId}/values/${valueId}`);
      toast.success("Value deleted");
      await loadAttributes();
    } catch {
      toast.error("Failed to delete value");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    if (inline) {
      return (
        <div className="py-10 text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Loading attributes…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading attributes…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!inline && <Toaster position="top-right" />}
      <div className={inline ? "" : "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 sm:px-6 lg:px-8 py-8"}>
        <div className={inline ? "" : "max-w-4xl mx-auto"}>

          {/* Page header — hidden when panel is embedded inline */}
          {!inline && (
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Tag className="h-4 w-4" />
                  <span>{categoryName || categoryId}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Category Attributes</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Define the filterable specs for products in this category.
                </p>
              </div>
              <button
                onClick={() => setShowAddAttr(true)}
                className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition shadow"
              >
                <Plus className="h-4 w-4" />
                Add Attribute
              </button>
            </div>
          )}

          {/* Inline mode: Add Attribute button without full page header */}
          {inline && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddAttr(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition shadow"
              >
                <Plus className="h-4 w-4" />
                Add Attribute
              </button>
            </div>
          )}

          {/* Add Attribute Form */}
          {showAddAttr && (
            <div className="mb-6 p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm">New Attribute</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
                  <input
                    value={newAttr.name}
                    onChange={(e) => setNewAttr((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Fabric, RAM, Color"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
                  <select
                    value={newAttr.type}
                    onChange={(e) => setNewAttr((p) => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {ATTR_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAttr.isFilterable}
                    onChange={(e) => setNewAttr((p) => ({ ...p, isFilterable: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  Show in filters
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAttr.isRequired}
                    onChange={(e) => setNewAttr((p) => ({ ...p, isRequired: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  Required on product
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddAttribute}
                  disabled={attrSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {attrSaving ? "Saving…" : "Save Attribute"}
                </button>
                <button
                  onClick={() => setShowAddAttr(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Attribute List */}
          {attributes.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
              <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No attributes yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Add attributes to enable dynamic filters for this category.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attributes.map((attr) => {
                const isExpanded = expandedAttrId === attr.id;
                const isEditing = editingAttrId === attr.id;

                return (
                  <div key={attr.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Attribute Header */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      <button
                        onClick={() => setExpandedAttrId(isExpanded ? null : attr.id)}
                        className="text-slate-400 hover:text-slate-700 transition"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-3">
                          <input
                            value={editAttr.name}
                            onChange={(e) => setEditAttr((p) => ({ ...p, name: e.target.value }))}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <select
                            value={editAttr.type}
                            onChange={(e) => setEditAttr((p) => ({ ...p, type: e.target.value }))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          >
                            {ATTR_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-4 text-sm text-slate-700">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={editAttr.isFilterable} onChange={(e) => setEditAttr((p) => ({ ...p, isFilterable: e.target.checked }))} className="w-4 h-4" />
                              Filterable
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={editAttr.isRequired} onChange={(e) => setEditAttr((p) => ({ ...p, isRequired: e.target.checked }))} className="w-4 h-4" />
                              Required
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateAttribute(attr.id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition">Save</button>
                            <button onClick={() => setEditingAttrId(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <span className="font-semibold text-slate-800 text-sm truncate">{attr.name}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge(attr.type)}`}>
                              {attr.type}
                            </span>
                            {attr.isFilterable && (
                              <span className="text-xs text-emerald-600 font-medium hidden sm:flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Filterable
                              </span>
                            )}
                            {attr.isRequired && (
                              <span className="text-xs text-red-500 font-medium hidden sm:block">Required</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 hidden sm:block">
                            {attr.values.length} value{attr.values.length !== 1 ? "s" : ""}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingAttrId(attr.id);
                                setEditAttr({ name: attr.name, type: attr.type, isFilterable: attr.isFilterable, isRequired: attr.isRequired });
                                setExpandedAttrId(attr.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttribute(attr.id, attr.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Values Panel (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60">
                        {(attr.type === "SELECT" || attr.type === "MULTISELECT") ? (
                          <>
                            {/* Existing values */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {attr.values.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-white text-sm text-slate-700 group"
                                >
                                  {editingValueId === v.id ? (
                                    <>
                                      <input
                                        value={editValueText}
                                        onChange={(e) => setEditValueText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdateValue(attr.id, v.id)}
                                        className="w-24 text-xs border-b border-indigo-400 bg-transparent focus:outline-none"
                                        autoFocus
                                      />
                                      <button onClick={() => handleUpdateValue(attr.id, v.id)} className="text-emerald-600 hover:text-emerald-700 transition">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => setEditingValueId(null)} className="text-slate-400 hover:text-slate-600 transition">
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span>{v.value}</span>
                                      <button
                                        onClick={() => { setEditingValueId(v.id); setEditValueText(v.value); }}
                                        className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteValue(attr.id, v.id, v.value)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Add value input */}
                            <div className="flex gap-2">
                              <input
                                value={newValueText[attr.id] ?? ""}
                                onChange={(e) => setNewValueText((p) => ({ ...p, [attr.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleAddValue(attr.id)}
                                placeholder="Add a value…"
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                              <button
                                onClick={() => handleAddValue(attr.id)}
                                disabled={valueSaving[attr.id]}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition"
                              >
                                {valueSaving[attr.id] ? "…" : "Add"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            This attribute type uses free-text input — no predefined values needed.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryAttributes;
