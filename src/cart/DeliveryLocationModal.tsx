import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPinIcon,
  HomeIcon,
  PencilSquareIcon,
  TruckIcon,
  XMarkIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useCart } from "../context/CartContext";

// Leaflet icon fix
// @ts-expect-error – private field
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedAddress {
  id: string;
  fullAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface ShippingPreview {
  shippingCharge: number;
  distanceKm: number;
  type: "other_state" | "same_state_gps" | "manual" | "free";
  label: string;
  address?: string;
  state?: string;
  lat?: number;
  lng?: number;
  free?: boolean;
}

export interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: { id: string; name: string; price: number };
}

type Phase = "select" | "manual_form" | "preview";
type LocMode = "gps" | "saved" | "manual";

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeliveryLocationModal({ isOpen, onClose, product }: DeliveryLocationModalProps) {
  const navigate = useNavigate();
  const { cartItems, addToCart, fetchCart } = useCart();

  const [phase, setPhase] = useState<Phase>("select");
  const [locMode, setLocMode] = useState<LocMode | null>(null);
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null);
  const [preview, setPreview] = useState<ShippingPreview | null>(null);
  const [manualForm, setManualForm] = useState({ fullAddress: "", city: "", state: "", zipCode: "" });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset + fetch saved address when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhase("select");
      setLocMode(null);
      setPosition(null);
      setGpsCoords(null);
      setPreview(null);
      setGpsLoading(false);
      setCalcLoading(false);
      setIsProcessing(false);
      setManualForm({ fullAddress: "", city: "", state: "", zipCode: "" });
      return;
    }
    api.get("/address/default")
      .then((res) => setSavedAddress(res.data.address))
      .catch(() => setSavedAddress(null));
  }, [isOpen]);

  // ── Location handlers ──────────────────────────────────────────────────────

  const handleSelectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocMode("gps");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setGpsCoords([latitude, longitude]);
        try {
          const res = await api.post("/address/preview-shipping", { latitude, longitude });
          setPreview({ ...res.data, lat: latitude, lng: longitude });
          setPosition([latitude, longitude]);
          setPhase("preview");
        } catch {
          toast.error("Failed to calculate shipping for your location");
          setLocMode(null);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setLocMode(null);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location access denied. Please allow location permissions.");
        } else {
          toast.error("Could not fetch your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 14000 }
    );
  };

  const handleSelectSaved = async () => {
    if (!savedAddress) return;
    setLocMode("saved");
    setCalcLoading(true);
    try {
      let res;
      if (savedAddress.latitude && savedAddress.longitude) {
        res = await api.post("/address/preview-shipping", {
          latitude: savedAddress.latitude,
          longitude: savedAddress.longitude,
        });
        setPosition([savedAddress.latitude, savedAddress.longitude]);
      } else {
        res = await api.post("/address/preview-shipping", {
          manual: true,
          state: savedAddress.state,
        });
        setPosition(null);
      }
      setPreview(res.data);
      setPhase("preview");
    } catch {
      toast.error("Failed to calculate shipping for your saved address");
      setLocMode(null);
    }
    setCalcLoading(false);
  };

  const handleManualCalculate = async () => {
    const state = manualForm.state.trim();
    if (!state) {
      toast.error("Please enter your state", { id: "manual-state" });
      return;
    }
    setCalcLoading(true);
    try {
      const res = await api.post("/address/preview-shipping", { manual: true, state });
      setPreview(res.data);
      setPhase("preview");
    } catch {
      toast.error("Failed to calculate shipping");
    }
    setCalcLoading(false);
  };

  // ── Proceed to checkout ───────────────────────────────────────────────────

  const handleProceed = async () => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      // Add product to cart if not already there
      const isInCart = cartItems.some((i) => String(i.productId) === String(product.id));
      if (!isInCart) {
        if (addToCart) {
          await addToCart(product.id);
        } else {
          await api.post("/cart/add", { productId: product.id, quantity: 1 });
          if (fetchCart) fetchCart();
        }
      }

      // Save the selected address to DB if it was GPS (saved address is already in DB)
      if (locMode === "gps" && gpsCoords) {
        await api.post("/address/save-geo", { latitude: gpsCoords[0], longitude: gpsCoords[1] });
      } else if (locMode === "manual") {
        const addr = manualForm;
        await api.post("/address/save-manual", {
          fullAddress: addr.fullAddress || `${addr.city}, ${addr.state}`,
          city: addr.city || addr.state,
          state: addr.state,
          zipCode: addr.zipCode || "000000",
        });
      }

      // Build prefill state for checkout page
      const addressPrefill = {
        fullAddress: locMode === "gps"
          ? (preview.address || "")
          : locMode === "saved"
            ? (savedAddress?.fullAddress || `${savedAddress?.city}, ${savedAddress?.state}`)
            : (manualForm.fullAddress || `${manualForm.city}, ${manualForm.state}`),
        city: locMode === "saved" ? (savedAddress?.city || "") : (manualForm.city || ""),
        state: locMode === "saved"
          ? (savedAddress?.state || "")
          : locMode === "gps"
            ? (preview.state || "")
            : manualForm.state,
        zipCode: locMode === "saved"
          ? (savedAddress?.zipCode || "")
          : manualForm.zipCode,
        lat: position?.[0] ?? null,
        lng: position?.[1] ?? null,
      };

      onClose();
      navigate("/checkout", {
        state: { addressPrefill, shippingCharge: preview.shippingCharge },
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setIsProcessing(false);
  };

  const goBackToSelect = () => {
    setPhase("select");
    setPreview(null);
    setLocMode(null);
    setPosition(null);
    setGpsCoords(null);
  };

  const estimatedTotal = product.price + (preview?.shippingCharge ?? 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal — bottom-sheet on mobile, centred on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg bg-white shadow-2xl rounded-t-3xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:bottom-auto sm:w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                {phase !== "select" && (
                  <button
                    onClick={goBackToSelect}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition"
                    aria-label="Go back"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                <TruckIcon className="h-5 w-5 text-gray-700" />
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Delivery Location</h2>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 overflow-y-auto max-h-[70vh]">

              {/* ── PHASE: SELECT ── */}
              {phase === "select" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">Choose how you'd like to receive your order</p>

                  {/* GPS */}
                  <button
                    onClick={handleSelectGPS}
                    disabled={gpsLoading || calcLoading}
                    className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all
                      hover:border-blue-400 hover:shadow-sm disabled:opacity-60
                      ${locMode === "gps" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {gpsLoading ? (
                        <BeatLoader size={5} color="#3b82f6" />
                      ) : (
                        <MapPinIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Use my current location</p>
                      <p className="text-xs text-gray-500 mt-0.5">Automatically detects via GPS</p>
                    </div>
                  </button>

                  {/* Saved address */}
                  {savedAddress ? (
                    <button
                      onClick={handleSelectSaved}
                      disabled={gpsLoading || calcLoading}
                      className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all
                        hover:border-emerald-400 hover:shadow-sm disabled:opacity-60
                        ${locMode === "saved" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        {calcLoading && locMode === "saved" ? (
                          <BeatLoader size={5} color="#10b981" />
                        ) : (
                          <HomeIcon className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">Deliver to saved address</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {savedAddress.fullAddress || `${savedAddress.city}, ${savedAddress.state}`}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 opacity-50 cursor-not-allowed">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <HomeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-400 text-sm">No saved address</p>
                        <p className="text-xs text-gray-400 mt-0.5">Add an address in your profile</p>
                      </div>
                    </div>
                  )}

                  {/* Manual */}
                  <button
                    onClick={() => { setLocMode("manual"); setPhase("manual_form"); }}
                    disabled={gpsLoading || calcLoading}
                    className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all
                      hover:border-amber-400 hover:shadow-sm disabled:opacity-60
                      ${locMode === "manual" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <PencilSquareIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Enter address manually</p>
                      <p className="text-xs text-gray-500 mt-0.5">Type in your delivery details</p>
                    </div>
                  </button>
                </div>
              )}

              {/* ── PHASE: MANUAL FORM ── */}
              {phase === "manual_form" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Enter your delivery address details:</p>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      State <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualForm.state}
                      onChange={(e) => setManualForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="e.g. Kerala, Tamil Nadu"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      value={manualForm.city}
                      onChange={(e) => setManualForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Kochi"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Address</label>
                    <textarea
                      value={manualForm.fullAddress}
                      onChange={(e) => setManualForm((f) => ({ ...f, fullAddress: e.target.value }))}
                      placeholder="House no., Street, Area..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pincode</label>
                    <input
                      type="text"
                      value={manualForm.zipCode}
                      onChange={(e) => setManualForm((f) => ({ ...f, zipCode: e.target.value }))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition"
                    />
                  </div>

                  <button
                    onClick={handleManualCalculate}
                    disabled={calcLoading || !manualForm.state.trim()}
                    className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {calcLoading ? (
                      <BeatLoader size={6} color="#fff" />
                    ) : (
                      <><TruckIcon className="h-4 w-4" /> Calculate Shipping</>
                    )}
                  </button>
                </div>
              )}

              {/* ── PHASE: PREVIEW ── */}
              {phase === "preview" && preview && (
                <div className="space-y-4">
                  {/* Map */}
                  {position && (
                    <div
                      className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                      style={{ height: 200 }}
                    >
                      <MapContainer
                        key={`${position[0]}-${position[1]}`}
                        center={position}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position} />
                      </MapContainer>
                    </div>
                  )}

                  {/* Delivery address summary */}
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                    <MapPinIcon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivering to</p>
                      {locMode === "saved" && savedAddress ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                            {savedAddress.fullAddress || `${savedAddress.city}, ${savedAddress.state} ${savedAddress.zipCode}`}
                          </p>
                          <p className="text-xs text-gray-500">{savedAddress.city}, {savedAddress.state} — {savedAddress.zipCode}</p>
                        </>
                      ) : locMode === "gps" ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                            {preview.address || "Your current location"}
                          </p>
                          {preview.state && <p className="text-xs text-gray-500">{preview.state}</p>}
                          {position && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {position[0].toFixed(5)}, {position[1].toFixed(5)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                            {manualForm.fullAddress || `${manualForm.city}, ${manualForm.state}`}
                          </p>
                          <p className="text-xs text-gray-500">{manualForm.city}, {manualForm.state} — {manualForm.zipCode}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order amount splitup */}
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order Summary</p>
                    </div>
                    <div className="px-4 py-3 space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 truncate pr-2">{product.name}</span>
                        <span className="font-semibold text-gray-900 flex-shrink-0">
                          ₹{product.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-gray-600">Shipping</span>
                          <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px]">{preview.label}</p>
                        </div>
                        <span className={`font-semibold flex-shrink-0 ${preview.shippingCharge === 0 ? "text-green-600" : "text-gray-900"}`}>
                          {preview.shippingCharge === 0 ? "FREE" : `₹${preview.shippingCharge}`}
                        </span>
                      </div>

                      <div className="flex justify-between pt-2.5 border-t border-gray-100">
                        <span className="font-bold text-gray-900">Estimated Total</span>
                        <span className="font-bold text-lg text-gray-900">₹{estimatedTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 px-4 py-2 border-t border-amber-100">
                      <p className="text-[11px] text-amber-700">
                        * Final total includes all cart items. Exact shipping confirmed at checkout.
                      </p>
                    </div>
                  </div>

                  {/* Proceed button */}
                  <button
                    onClick={handleProceed}
                    disabled={isProcessing}
                    className="w-full rounded-full bg-gray-900 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-gray-700 disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <BeatLoader size={6} color="#fff" />
                    ) : (
                      <><TruckIcon className="h-4 w-4" /> Proceed to Checkout</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
