import React, { useEffect, useState, useRef } from "react";
import { MapPinIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import api from "../utils/api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet default icon fix
// @ts-expect-error – leaflet private field
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ShippingConfig {
  sameStateName: string;
  otherStateFlatRate: number;
  sameStateBaseRate: number;
  sameStatePerKmRate: number;
  sameStateFreeKmThreshold: number;
  manualFlatRate: number;
}

interface WarehouseSettings {
  lat: number;
  lng: number;
  name: string;
}

/** Invisible component that listens for map clicks */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function WarehouseSettings() {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  // Admin can edit when feature is enabled; Super Admin always can
  const featureEnabled = isSuperAdmin || isEnabled("WAREHOUSE_SETTINGS");
  const canEdit = featureEnabled; // both admin and super admin can edit when enabled

  const [settings, setSettings] = useState<WarehouseSettings>({ lat: 9.9312, lng: 76.2673, name: "Main Warehouse" });
  const [form, setForm] = useState<WarehouseSettings>({ lat: 9.9312, lng: 76.2673, name: "Main Warehouse" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shipping config state
  const DEFAULT_SHIPPING: ShippingConfig = {
    sameStateName: "Kerala", otherStateFlatRate: 150,
    sameStateBaseRate: 50, sameStatePerKmRate: 5,
    sameStateFreeKmThreshold: 10, manualFlatRate: 50,
  };
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [shippingForm, setShippingForm] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSuccess, setShippingSuccess] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const shippingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get("/settings/warehouse")
      .then((res) => {
        setSettings(res.data);
        setForm(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load shipping config
    api.get("/settings/shipping-config")
      .then((res) => { setShippingConfig(res.data); setShippingForm(res.data); })
      .catch(() => {});
  }, []);

  const handleMapPick = (lat: number, lng: number) => {
    if (!canEdit) return;
    setForm((f) => ({ ...f, lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api.put("/settings/warehouse", form);
      setSettings({ lat: res.data.lat, lng: res.data.lng, name: res.data.name });
      setSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleShippingSave = async () => {
    setShippingSaving(true);
    setShippingError(null);
    setShippingSuccess(false);
    try {
      await api.put("/settings/shipping-config", shippingForm);
      setShippingConfig(shippingForm);
      setShippingSuccess(true);
      if (shippingTimer.current) clearTimeout(shippingTimer.current);
      shippingTimer.current = setTimeout(() => setShippingSuccess(false), 3000);
    } catch (err: any) {
      setShippingError(err.response?.data?.message ?? "Failed to save shipping config");
    } finally {
      setShippingSaving(false);
    }
  };

  const parseNum = (val: string, fallback: number) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const parseCoord = (val: string, fallback: number) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const mapCenter: [number, number] = [form.lat, form.lng];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
          <BuildingStorefrontIcon className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Location</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set the warehouse coordinates used to calculate customer shipping charges.
            {!canEdit && " (Read-only — this feature is currently disabled.)"}
          </p>
        </div>
      </div>

      {/* Disabled state for Admin */}
      {!featureEnabled ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-red-700 mb-2">Warehouse Settings Disabled</h2>
          <p className="text-sm text-red-600 max-w-sm">
            This feature has been disabled by the Super Admin. Warehouse location
            cannot be configured, and <strong>shipping is free</strong> for all
            orders until this feature is re-enabled.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-3 py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading warehouse settings…
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
       

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Warehouse Name
              </label>
              <input
                type="text"
                value={form.name}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="e.g. Kochi Warehouse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  disabled={!canEdit}
                  onChange={(e) => setForm((f) => ({ ...f, lat: parseCoord(e.target.value, f.lat) }))}
                  className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  disabled={!canEdit}
                  onChange={(e) => setForm((f) => ({ ...f, lng: parseCoord(e.target.value, f.lng) }))}
                  className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>

            {canEdit && (
              <p className="text-xs text-gray-400">
                Tip: click the map to pin the exact warehouse location.
              </p>
            )}

            {/* Current saved value */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>
                Current saved: <strong className="font-mono text-gray-700">{settings.lat}, {settings.lng}</strong> — {settings.name}
              </span>
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <CheckCircle className="w-4 h-4" />
                Warehouse location saved successfully!
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinIcon className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Warehouse Location"}
              </button>
            )}
          </div>

          {/* ── Map ── */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: 380 }}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", minHeight: 380, width: "100%" }}
              key={`${form.lat}-${form.lng}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[form.lat, form.lng]} />
              {canEdit && <MapClickHandler onPick={handleMapPick} />}
            </MapContainer>
            {canEdit && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 shadow font-medium pointer-events-none z-[1000]">
                Click anywhere on the map to move the pin
              </div>
            )}
          </div>
        </div>

        {/* ── Shipping Rates Configuration ── */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shipping Rates Configuration</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure how shipping is calculated for different regions. If not set, defaults apply.
              </p>
            </div>
          </div>

          {!canEdit ? (
            <p className="text-sm text-gray-400 italic">Shipping rates are read-only while Warehouse Settings is disabled.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Same state name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Same-State Name
                  </label>
                  <input
                    type="text"
                    value={shippingForm.sameStateName}
                    onChange={(e) => setShippingForm((f) => ({ ...f, sameStateName: e.target.value }))}
                    placeholder="e.g. Kerala"
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Customers in this state get distance-based pricing.</p>
                </div>

                {/* Other state flat rate */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Other Indian State — Flat (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingForm.otherStateFlatRate}
                    onChange={(e) => setShippingForm((f) => ({ ...f, otherStateFlatRate: parseNum(e.target.value, f.otherStateFlatRate) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Flat rate for all other Indian states.</p>
                </div>

                {/* Manual flat rate */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Manual Address (no GPS) — Flat (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingForm.manualFlatRate}
                    onChange={(e) => setShippingForm((f) => ({ ...f, manualFlatRate: parseNum(e.target.value, f.manualFlatRate) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Applied when customer in same state but no GPS.</p>
                </div>

                {/* Same state base rate */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Same State — Base Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingForm.sameStateBaseRate}
                    onChange={(e) => setShippingForm((f) => ({ ...f, sameStateBaseRate: parseNum(e.target.value, f.sameStateBaseRate) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Base fee applied up to the free-km threshold.</p>
                </div>

                {/* Free km threshold */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Free Distance Threshold (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingForm.sameStateFreeKmThreshold}
                    onChange={(e) => setShippingForm((f) => ({ ...f, sameStateFreeKmThreshold: parseNum(e.target.value, f.sameStateFreeKmThreshold) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Only base rate charged within this distance.</p>
                </div>

                {/* Per km rate */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Per Extra km Charge (₹/km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingForm.sameStatePerKmRate}
                    onChange={(e) => setShippingForm((f) => ({ ...f, sameStatePerKmRate: parseNum(e.target.value, f.sameStatePerKmRate) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Added per km beyond the free threshold.</p>
                </div>
              </div>

              {/* Live preview */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Current effective rates:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs leading-relaxed">
                  <li><strong>Other Indian state</strong> — flat ₹{shippingForm.otherStateFlatRate}</li>
                  <li><strong>Same state ({shippingForm.sameStateName}) with GPS</strong> — ₹{shippingForm.sameStateBaseRate} base + ₹{shippingForm.sameStatePerKmRate}/km beyond {shippingForm.sameStateFreeKmThreshold} km</li>
                  <li><strong>Manual address (no GPS)</strong> — ₹{shippingForm.manualFlatRate} flat</li>
                  <li><strong>No international shipping</strong></li>
                </ul>
              </div>

              {shippingSuccess && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <CheckCircle className="w-4 h-4" />
                  Shipping rates saved successfully!
                </div>
              )}
              {shippingError && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4" />
                  {shippingError}
                </div>
              )}

              <button
                onClick={handleShippingSave}
                disabled={shippingSaving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 transition-colors"
              >
                {shippingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {shippingSaving ? "Saving…" : "Save Shipping Rates"}
              </button>
            </>
          )}
        </div>
        </>
      )}
    </div>
  );
}
