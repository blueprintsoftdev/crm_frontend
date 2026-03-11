import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, ArrowLeft, CheckCircle, Clock, XCircle, Truck, Package } from "lucide-react";
import api from "../utils/api";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface CompanySettings {
  COMPANY_NAME: string | null;
  COMPANY_TAGLINE: string | null;
  COMPANY_LOGO: string | null;
}

interface OrderItem {
  product: { id: string; name: string; image?: string; code?: string } | null;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  fullAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Coupon {
  code: string;
  discountType: string;
  discountValue: number;
}

interface OrderUser {
  username: string;
  email: string;
  phone?: string;
}

interface Order {
  id: string;
  createdAt: string;
  user?: OrderUser;
  items: OrderItem[];
  totalAmount: number;
  shippingCharge: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: ShippingAddress;
  coupon?: Coupon | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const fmt = (n: number) => `₹${n.toFixed(2)}`;

const statusMeta: Record<string, { label: string; color: string }> = {
  PROCESSING: { label: "Processing", color: "#d97706" },
  CONFIRMED:  { label: "Confirmed",  color: "#2563eb" },
  SHIPPED:    { label: "Shipped",    color: "#0891b2" },
  DELIVERED:  { label: "Delivered",  color: "#16a34a" },
  CANCELLED:  { label: "Cancelled",  color: "#dc2626" },
};

const paymentStatusMeta: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Pending",  color: "#d97706" },
  PAID:     { label: "Paid",     color: "#16a34a" },
  FAILED:   { label: "Failed",   color: "#dc2626" },
  REFUNDED: { label: "Refunded", color: "#7c3aed" },
};

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanySettings>({
    COMPANY_NAME: null,
    COMPANY_TAGLINE: null,
    COMPANY_LOGO: null,
  });

  useEffect(() => {
    if (!orderId) return;
    api.get(`/order/${orderId}`)
      .then((res) => setOrder(res.data.order))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403) setError("You are not authorised to view this invoice.");
        else if (status === 404) setError("Order not found.");
        else setError("Failed to load invoice. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    api.get("/admin/company-settings")
      .then((res) => setCompany(res.data.settings ?? {}))
      .catch(() => {});
  }, []);

  const handlePrint = () => window.print();

  /* ── Skeleton / Error states ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Loading Invoice…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl border border-gray-200 shadow">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error ?? "Order not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-900 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress ?? {};
  const orderMeta = statusMeta[order.orderStatus] ?? { label: order.orderStatus, color: "#6b7280" };
  const payMeta = paymentStatusMeta[order.paymentStatus] ?? { label: order.paymentStatus, color: "#6b7280" };
  const invoiceNumber = `INV-${order.id.slice(-10).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const companyName = company.COMPANY_NAME || "blueprint_crm";
  const companyTagline = company.COMPANY_TAGLINE || "Premium Fabric & Draping Solutions";
  const companyLogo = company.COMPANY_LOGO;

  return (
    <>
      {/* ─── Print / Download Toolbar (hidden when printing) ─── */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ─── Invoice Document ─── */}
      <div className="bg-gray-100 min-h-screen py-10 px-4 print:bg-white print:p-0 print:min-h-0">
        <div
          ref={invoiceRef}
          id="invoice-print-area"
          className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
        >
          {/* ── Header ── */}
          <div className="bg-black text-white px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-14 h-14 object-contain rounded-xl bg-white/10 p-1 shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{companyName}</h1>
                <p className="text-gray-400 text-sm mt-1">{companyTagline}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Invoice</p>
              <p className="text-lg font-bold text-white mt-0.5">{invoiceNumber}</p>
              <p className="text-sm text-gray-400 mt-1">{invoiceDate}</p>
            </div>
          </div>

          {/* ── Status strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-b border-gray-100">
            {[
              { label: "Order ID",        value: `#${order.id.slice(-8).toUpperCase()}` },
              { label: "Order Status",    value: orderMeta.label,   color: orderMeta.color },
              { label: "Payment",         value: payMeta.label,     color: payMeta.color },
              { label: "Method",          value: order.paymentMethod === "ONLINE" ? "Online (Razorpay)" : "Pay on Delivery" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">{item.label}</p>
                <p className="text-sm font-bold" style={item.color ? { color: item.color } : {}}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Addresses ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 py-6 border-b border-gray-100">
            {/* Bill To */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Bill To</p>
              {order.user ? (
                <div className="text-sm text-gray-700 space-y-0.5">
                  <p className="font-bold text-gray-900 text-base">{order.user.username}</p>
                  <p>{order.user.email}</p>
                  {order.user.phone && <p>{order.user.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Customer info unavailable</p>
              )}
            </div>
            {/* Ship To */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Ship To</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                {addr.fullAddress && <p className="font-medium">{addr.fullAddress}</p>}
                <p>
                  {[addr.city, addr.state].filter(Boolean).join(", ")}
                  {addr.zipCode ? ` – ${addr.zipCode}` : ""}
                </p>
                {addr.country && <p>{addr.country}</p>}
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="pb-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider w-1/2">Item</th>
                  <th className="pb-3 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="pb-3 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="pb-3 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name ?? "Product"}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.product?.name ?? "Product Unavailable"}
                          </p>
                          {item.product?.code && (
                            <p className="text-[11px] text-gray-400">Code: {item.product.code}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-gray-600 font-medium">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">{fmt(item.price)}</td>
                    <td className="py-4 text-right font-bold text-gray-900">{fmt(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div className="px-8 pb-8">
            <div className="ml-auto max-w-xs space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{fmt(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{order.shippingCharge > 0 ? fmt(order.shippingCharge) : <span className="text-green-600 font-medium">Free</span>}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>
                    Discount
                    {order.coupon && (
                      <span className="ml-2 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-[11px] font-bold text-green-700 print:border print:border-green-300">
                        {order.coupon.code}
                      </span>
                    )}
                  </span>
                  <span>−{fmt(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{fmt(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-gray-900 border-t-2 border-gray-900 pt-3 mt-1">
                <span>Total</span>
                <span>{fmt(order.finalAmount)}</span>
              </div>
              {order.paymentStatus === "PAID" && (
                <div className="flex justify-between text-sm font-semibold text-green-600 pt-1">
                  <span>Amount Paid</span>
                  <span>{fmt(order.finalAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Transaction details ── */}
          {(order.razorpayOrderId || order.razorpayPaymentId) && (
            <div className="mx-8 mb-8 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1 border border-gray-100">
              <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-2">Transaction Details</p>
              {order.razorpayOrderId && (
                <p><span className="font-semibold text-gray-600">Razorpay Order ID:</span> {order.razorpayOrderId}</p>
              )}
              {order.razorpayPaymentId && (
                <p><span className="font-semibold text-gray-600">Payment ID:</span> {order.razorpayPaymentId}</p>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-6 text-center print:bg-white">
            <p className="text-xs text-gray-400 font-medium">
              Thank you for shopping with{" "}
              <span className="font-bold text-gray-700">{companyName}</span>.
            </p>
            <p className="text-[10px] text-gray-300 mt-3 uppercase tracking-widest">
              This is a computer-generated invoice. No signature required.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Print Styles ─── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: fixed !important;
            top: 0; left: 0;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page { margin: 0.5cm; size: A4; }
        }
      `}</style>
    </>
  );
}
