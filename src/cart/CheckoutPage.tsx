import React, { useEffect, useState, useRef, Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  ChevronUpIcon,
  MapPinIcon,
  TruckIcon,
  CreditCardIcon,
  BanknotesIcon,
  TagIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeft, CheckCircle, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast, { Toaster } from "react-hot-toast";

import { motion, AnimatePresence } from "framer-motion";

// --- LEAFLET ICON FIX ---
// @ts-expect-error - leaflet private property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


interface AddressState {
  house: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

interface Suggestion {
  lat: string;
  lon: string;
  display_name: string;
}

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { addressPrefill?: { fullAddress: string; city: string; state: string; zipCode: string; lat: number | null; lng: number | null }; shippingCharge?: number } | null);
  const isPaymentSuccess = useRef(false);

  // --- NEW STATE FOR BLUR EFFECT ---
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  const [address, setAddress] = useState<AddressState>({
    house: prefill?.addressPrefill?.fullAddress ?? "",
    city: prefill?.addressPrefill?.city ?? "",
    state: prefill?.addressPrefill?.state ?? "",
    pincode: prefill?.addressPrefill?.zipCode ?? "",
    lat: prefill?.addressPrefill?.lat ?? null,
    lng: prefill?.addressPrefill?.lng ?? null,
  });

  const [shippingCharge, setShippingCharge] = useState(prefill?.shippingCharge ?? 0);
  // Set map position if prefill includes GPS coords
  const [paymentMethod, setPaymentMethod] = useState("Online");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    prefill?.addressPrefill?.lat && prefill?.addressPrefill?.lng
      ? [prefill.addressPrefill.lat, prefill.addressPrefill.lng]
      : null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Protect route
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      if (!isPaymentSuccess.current) {
        navigate("/cart", { replace: true });
      }
    }
  }, [cartItems, navigate]);

  // useEffect(() => {
  //   if (query.length < 3) {
  //     setSuggestions([]);
  //     return;
  //   }

  //   const timer = setTimeout(async () => {
  //     try {
  //       const res = await fetch(
  //         `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`,
  //         { headers: { Accept: "application/json" } }
  //       );
  //       const data = await res.json();
  //       setSuggestions(data);
  //     } catch {
  //       setSuggestions([]);
  //     }
  //   }, 600);

  //   return () => clearTimeout(timer);
  // }, [query]);

  const handleManualSelect = async (lat: number, lng: number, displayName: string) => {
    const toastId = toast.loading("Calculating shipping...");

    try {
      const res = await api.post("/address/save-geo", {
        latitude: lat,
        longitude: lng,
      });

      const { address: addr, shippingCharge } = res.data;

      setAddress({
        house: addr.fullAddress || displayName,
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.zipCode || "",
        lat,
        lng,
      });

      setShippingCharge(shippingCharge);
      setPosition([lat, lng]);
      setSuggestions([]);
      setQuery("");
      toast.dismiss(toastId);
      toast.success(`Shipping ₹${shippingCharge}`);
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to calculate shipping");
    }
  };



  // --- 0. COUPON APPLY ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post("/coupon/validate", {
        code: couponCode.trim(),
        orderAmount: Number(cartTotal),
      });
      setAppliedCoupon(res.data);
      toast.success(`Coupon "${res.data.code}" applied! You save ₹${res.data.discountAmount}`);
      setCouponCode("");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // --- 1. SCRIPT LOADER ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // --- 2. ONLINE PAYMENT LOGIC ---
  const startOnlinePayment = async () => {
    setLoading(true);
    isPaymentSuccess.current = false;

    const razorpayKey =
      import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      toast.error("Razorpay Key is missing.");
      setLoading(false);
      return;
    }

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load.");
        setLoading(false);
        return;
      }

      const res = await api.post("/order/place", {
        couponId: appliedCoupon?.couponId,
      });

      if (!res.data || !res.data.rzpOrder) {
        throw new Error("Invalid response from server");
      }

      const options = {
        key: razorpayKey,
        amount: res.data.rzpOrder.amount,
        currency: "INR",
        name: "blueprint_crm",
        order_id: res.data.rzpOrder.id,
        handler: async (response: any) => {
          // --- REMOVE BLUR ON SUCCESS ---
          setIsRazorpayOpen(false);

          isPaymentSuccess.current = true;
          toast.success("Payment Successful! Processing...");

          try {
            await api.post("/order/verifyPayment", response);
          } catch (err) {
      const _e = err as any;
            console.error("Verification API Error:", err);
            toast.success("Order Placed! Check 'My Orders' for status.");
          }

          if (clearCart) clearCart();

          setAddress({
            house: "",
            city: "",
            state: "",
            pincode: "",
            lat: null,
            lng: null,
          });
          setShippingCharge(0);
          setPosition(null);
          setShowSuccessModal(true);
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: async function () {
            // --- REMOVE BLUR ON CANCEL/CLOSE ---
            setIsRazorpayOpen(false);
            setLoading(false);

            if (isPaymentSuccess.current) return;
            try {
              await api.post(`/order/cancel/${res.data.order.id}`);
              toast.error("Payment cancelled.");
            } catch (err) {
      const _e = err as any;
              console.error("Cancel failed", err);
            }
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", async function (response: any) {
        // --- REMOVE BLUR ON FAILURE ---
        setIsRazorpayOpen(false);
        setLoading(false);

        toast.error("Payment Failed");
        if (!isPaymentSuccess.current) {
          try {
            await api.post(`/order/cancel/${res.data.order.id}`);
          } catch (err) {
      const _e = err as any;}
        }
      });

      // --- ACTIVATE BLUR ---
      setIsRazorpayOpen(true);
      rzp.open();
    } catch (err) {
      const _e = err as any;
      console.error(err);
      toast.error("Payment initialization failed");
      setLoading(false); // Stop loading if initialization fails
    }
    // Note: We removed 'finally { setLoading(false) }' here because
    // we want the loading state to persist while the modal is open.
    // It is cleared in the handlers instead.
  };

  // --- 3. GEOLOCATION LOGIC ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    const toastId = toast.loading("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      async (geoPosition) => {
        const { latitude, longitude } = geoPosition.coords;
        try {
          setPosition([latitude, longitude]);

          const res = await api.post("/address/save-geo", { latitude, longitude });
          const { address: addr, shippingCharge } = res.data;

          setAddress({
            house: addr.fullAddress || "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            pincode: addr.zipCode || addr.postcode || "",
            lat: latitude,
            lng: longitude,
          });

          setShippingCharge(shippingCharge);
          toast.dismiss(toastId);
          toast.success(`Location set! Shipping: ₹${shippingCharge}`);
        } catch {
          toast.dismiss(toastId);
          toast.error("Failed to get address details.");
        }
      },
      () => {
        toast.dismiss(toastId);
        toast.error("Location access denied. Please allow location permission.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // --- 4. PLACE ORDER HANDLER ---
  const handlePlaceOrder = async () => {
    // Validate all address fields
    if (!address.house.trim()) {
      toast.error("Please enter your street address.", { id: "checkout-validate" });
      return;
    }
    if (!address.city.trim()) {
      toast.error("Please enter your city.", { id: "checkout-validate" });
      return;
    }
    if (!address.state.trim()) {
      toast.error("Please enter your state.", { id: "checkout-validate" });
      return;
    }
    if (!address.pincode.trim()) {
      toast.error("Please enter your pincode.", { id: "checkout-validate" });
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode.", { id: "checkout-validate" });
      return;
    }

    const isManualAddressFilled =
      address.house && address.city && address.pincode;

    // Ensure an address is persisted to DB before placing the order.
    // - If user picked from map / auto-detect: lat+lng already saved by save-geo.
    // - If user typed manually: save via save-manual (no lat/lng needed).
    if (!address.lat) {
      if (!isManualAddressFilled) {
        toast.error("Please enter your shipping address (street, city, pincode).");
        return;
      }
      try {
        await api.post("/address/save-manual", {
          fullAddress: address.house,
          city: address.city,
          state: address.state,
          zipCode: address.pincode,
        });
      } catch {
        toast.error("Failed to save address. Please try again.");
        return;
      }
    }

    if (paymentMethod === "POD") {
      let toastId;
      try {
        setLoading(true);
        toastId = toast.loading("Processing your order...");

        await new Promise((resolve) => setTimeout(resolve, 3000));
        await api.post("/order/placeOrderPOD", {
          couponId: appliedCoupon?.couponId,
        });

        isPaymentSuccess.current = true;
        if (clearCart) clearCart();
        toast.dismiss(toastId);
        toast.success("Order placed successfully!");
        setShowSuccessModal(true);
      } catch (e) {
        if (toastId) toast.dismiss(toastId);
        toast.error("Order failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      await startOnlinePayment();
    }
  };

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const totalAmount = Math.max((Number(cartTotal) + Number(shippingCharge) - discountAmount), 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-24 pb-12 relative overflow-x-hidden">
      {/* MAIN WRAPPER DIV 
          Added conditional logic: transition-all duration-500
          When isRazorpayOpen is true: blur-md, scale-95, pointer-events-none
      */}
      <div
        className={`mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12 transition-all duration-500 ${
          isRazorpayOpen
            ? "blur-md scale-95 pointer-events-none opacity-50"
            : "blur-0 scale-100 opacity-100"
        }`}
      >
        {/* --- Header & Back Button --- */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16 xl:gap-x-28 items-start">
          {/* ================= LEFT SIDE: FORM ================= */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-10 mb-8 lg:mb-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl mb-2">
                Checkout
              </h1>
              <p className="text-gray-500">Complete your purchase securely.</p>
            </div>

            <form>
              {/* Shipping Address */}
              <div className="border-b border-gray-100 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5" /> Shipping Address
                  </h2>
                  {/* <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center justify-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <MapPinIcon className="h-3.5 w-3.5" />
                    Auto-Detect
                  </button> */}
                </div>

                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2 relative">
                    <label
                      htmlFor="address"
                      className="block text-xs font-bold uppercase text-gray-500 mb-1"
                    >
                      Street Address
                    </label>

                    <input
                      type="text"
                      value={address.house}
                      onChange={(e) => {
                        setAddress({
                          ...address,
                          house: e.target.value,
                          lat: null,
                          lng: null,
                        });
                        setQuery(e.target.value);
                      }}
                      className="block w-full rounded-xl border-gray-200 px-4 py-3 shadow-sm focus:border-black focus:ring-black sm:text-sm bg-gray-50"
                      placeholder="e.g. Flat 402, Skyline Apartments"
                    />

                    {/* 🔽 ADD THIS RIGHT HERE */}
                    {suggestions.length > 0 && (
                      <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                        {suggestions.map((s, i) => (
                          <li
                            key={i}
                            className="px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() =>
                              handleManualSelect(
                                parseFloat(s.lat),
                                parseFloat(s.lon),
                                s.display_name
                              )
                            }
                          >
                            {s.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-xs font-bold uppercase text-gray-500 mb-1"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      className="block w-full rounded-xl border-gray-200 px-4 py-3 shadow-sm focus:border-black focus:ring-black sm:text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-xs font-bold uppercase text-gray-500 mb-1"
                    >
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        setAddress({ ...address, state: e.target.value })
                      }
                      className="block w-full rounded-xl border-gray-200 px-4 py-3 shadow-sm focus:border-black focus:ring-black sm:text-sm bg-gray-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="pincode"
                      className="block text-xs font-bold uppercase text-gray-500 mb-1"
                    >
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress({ ...address, pincode: e.target.value })
                      }
                      className="block w-1/2 rounded-xl border-gray-200 px-4 py-3 shadow-sm focus:border-black focus:ring-black sm:text-sm bg-gray-50"
                    />
                  </div>
                </div>

                {/* Map Visualization */}
                {position && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                    <div className="h-48 w-full">
                      <MapContainer
                        center={position}
                        zoom={16}
                        className="h-full w-full"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position} />
                      </MapContainer>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-mono border-t border-gray-200">
                      Pinned: {position[0].toFixed(4)}, {position[1].toFixed(4)}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="pt-10">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" /> Payment Method
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    onClick={() => setPaymentMethod("Online")}
                    className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                      paymentMethod === "Online"
                        ? "border-black bg-gray-900 text-white ring-2 ring-black ring-offset-2"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Pay Online
                      </span>
                      <CreditCardIcon
                        className={`h-6 w-6 ${
                          paymentMethod === "Online"
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-xs ${
                        paymentMethod === "Online"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Credit Card, UPI, Netbanking
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("POD")}
                    className={`relative cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                      paymentMethod === "POD"
                        ? "border-black bg-gray-900 text-white ring-2 ring-black ring-offset-2"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Cash on Delivery
                      </span>
                      <BanknotesIcon
                        className={`h-6 w-6 ${
                          paymentMethod === "POD"
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-xs ${
                        paymentMethod === "POD"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Pay when you receive
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button (Desktop) */}
              <div className="mt-10 hidden pt-6 lg:block">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full rounded-full bg-black px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-gray-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  {loading
                    ? "Processing..."
                    : paymentMethod === "POD"
                    ? `Place Order — ₹${totalAmount}`
                    : `Pay Now — ₹${totalAmount}`}
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT SIDE: SUMMARY ================= */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                <Package className="h-5 w-5" /> Order Summary
              </h2>

              <ul className="divide-y divide-gray-100 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                {cartItems.map((item) => (
                  <li key={item._id} className="flex py-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-center">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3 className="line-clamp-1">{item.name}</h3>
                        <p className="ml-4 font-bold">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 pt-6 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1">
                    Shipping <TruckIcon className="h-3 w-3" />
                  </span>
                  <span className="font-medium text-gray-900">
                    {shippingCharge === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${shippingCharge}`
                    )}
                  </span>
                </div>

                {/* Coupon Input */}
                <div className="pt-2">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                          placeholder="Coupon code"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-black transition"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-gray-800 transition"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs font-bold text-green-700">{appliedCoupon.code}</p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discountType === "PERCENTAGE"
                              ? `${appliedCoupon.discountValue}% off`
                              : `₹${appliedCoupon.discountValue} off`}
                          </p>
                        </div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500 transition">
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Discount line */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">−₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-100 pt-4">
                  <span className="text-base font-bold text-gray-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-indigo-600">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MOBILE BOTTOM BAR ================= */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] lg:hidden transition-all duration-300 ${
          isRazorpayOpen ? "blur-md pointer-events-none" : ""
        }`}
      >
        <div className="mb-4 flex items-center justify-between text-base font-bold text-gray-900">
          <span>Total</span>
          <span className="text-xl text-indigo-600">₹{totalAmount}</span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full rounded-full bg-black px-4 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md hover:bg-gray-800 disabled:opacity-70"
        >
          {loading
            ? "Processing..."
            : paymentMethod === "POD"
            ? "Place Order"
            : "Pay Now"}
        </button>

        <Popover className="mt-3 flex justify-center">
          {({ open }) => (
            <>
              <Popover.Button className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide outline-none">
                {open ? "Hide Details" : "View Details"}
                <ChevronUpIcon
                  className={`h-3 w-3 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-10"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-10"
              >
                <Popover.Panel className="absolute bottom-full left-0 right-0 mb-0 w-full bg-white border-t border-gray-200 px-6 py-6 shadow-2xl max-h-[60vh] overflow-y-auto rounded-t-3xl">
                  <h3 className="text-sm font-bold uppercase text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <ul className="divide-y divide-gray-100">
                    {cartItems.map((item) => (
                      <li key={item._id} className="flex py-3">
                        <img
                          src={item.image}
                          className="h-12 w-12 rounded-lg object-cover bg-gray-50"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-bold text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          ₹{item.price * item.quantity}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle className="h-10 w-10" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order Confirmed!
              </h2>
              <p className="text-gray-500 mb-8">
                We've received your order and will begin processing it right
                away.
              </p>

              <button
                onClick={() => navigate("/myorders")}
                className="w-full rounded-full bg-black px-6 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Track Order
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
    </div>
  );
};

export default CheckoutPage;
