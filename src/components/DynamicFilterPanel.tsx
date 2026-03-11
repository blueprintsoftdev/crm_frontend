import React, { useEffect, useRef, useState } from "react";
import api from "../utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttributeValue {
  id: string;
  value: string;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  type: string; // SELECT | MULTISELECT | TEXT | NUMBER | BOOLEAN
  isFilterable: boolean;
  sortOrder: number;
  values: AttributeValue[];
}

export interface ActiveFilters {
  attributeValueIds: string[];
  textFilters: Record<string, string>; // attributeId -> text value (for TEXT/NUMBER)
}

interface Props {
  categoryId: string;
  onFiltersChange: (filters: ActiveFilters) => void;
  resetKey?: number; // increment to reset all selections
}

// ─── Component ────────────────────────────────────────────────────────────────

const DynamicFilterPanel: React.FC<Props> = ({ categoryId, onFiltersChange, resetKey }) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedValueIds, setSelectedValueIds] = useState<Set<string>>(new Set());
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  // Track last emitted value to avoid calling onFiltersChange with identical data
  const lastEmittedRef = useRef<string>("");

  // Reset internal state when resetKey changes (parent clicked "Clear")
  useEffect(() => {
    if (resetKey === undefined) return;
    setSelectedValueIds(new Set());
    setTextFilters({});
  }, [resetKey]);

  // Fetch filterable attributes for this category
  useEffect(() => {
    if (!categoryId) return;
    setSelectedValueIds(new Set());
    setTextFilters({});

    api
      .get(`/category/${categoryId}/attributes`)
      .then((res) => {
        const all: Attribute[] = res.data.attributes ?? [];
        setAttributes(all.filter((a) => a.isFilterable));
      })
      .catch(() => setAttributes([]));
  }, [categoryId]);

  // Propagate changes upward — only when the actual selected values change
  useEffect(() => {
    const ids = Array.from(selectedValueIds).sort();
    const key = ids.join(",") + "|" + JSON.stringify(textFilters);
    if (key === lastEmittedRef.current) return; // nothing changed
    lastEmittedRef.current = key;
    onFiltersChange({ attributeValueIds: ids, textFilters });
  }, [selectedValueIds, textFilters]);

  if (attributes.length === 0) return null;

  const toggleValueId = (id: string) => {
    setSelectedValueIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const setTextFilter = (attrId: string, value: string) => {
    setTextFilters((prev) => ({ ...prev, [attrId]: value }));
  };

  return (
    <div className="space-y-6 pt-4 border-t border-gray-200">
      {attributes.map((attr) => (
        <div key={attr.id}>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
            {attr.name}
          </h4>

          {/* SELECT — radio (single-pick) */}
          {attr.type === "SELECT" && (
            <div className="space-y-2">
              {attr.values.map((v) => (
                <label key={v.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name={`attr-${attr.id}`}
                    checked={selectedValueIds.has(v.id)}
                    onChange={() => {
                      // Deselect others in same attribute, select this one
                      const next = new Set(
                        Array.from(selectedValueIds).filter(
                          (id) => !attr.values.some((av) => av.id === id)
                        )
                      );
                      if (!selectedValueIds.has(v.id)) next.add(v.id);
                      setSelectedValueIds(next);
                    }}
                    className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    {v.value}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* MULTISELECT — checkboxes */}
          {attr.type === "MULTISELECT" && (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((v) => {
                const active = selectedValueIds.has(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleValueId(v.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          )}

          {/* BOOLEAN — Yes / No */}
          {attr.type === "BOOLEAN" && (
            <div className="flex gap-3">
              {["true", "false"].map((bv) => {
                const matchingVal = attr.values.find(
                  (v) => v.value.toLowerCase() === bv
                );
                const label = bv === "true" ? "Yes" : "No";
                const valueId = matchingVal?.id;
                const active = valueId ? selectedValueIds.has(valueId) : false;
                return (
                  <button
                    key={bv}
                    type="button"
                    onClick={() => {
                      if (!valueId) return;
                      const next = new Set(
                        Array.from(selectedValueIds).filter(
                          (id) => !attr.values.some((av) => av.id === id)
                        )
                      );
                      if (!active) next.add(valueId);
                      setSelectedValueIds(next);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* TEXT / NUMBER — free-text input */}
          {(attr.type === "TEXT" || attr.type === "NUMBER") && (
            <input
              type={attr.type === "NUMBER" ? "number" : "text"}
              value={textFilters[attr.id] ?? ""}
              onChange={(e) => setTextFilter(attr.id, e.target.value)}
              placeholder={`Filter by ${attr.name.toLowerCase()}…`}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicFilterPanel;
