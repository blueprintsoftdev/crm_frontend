import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { useFeatureFlags } from "../context/FeatureFlagContext";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  code: string;
  image?: string;
  price: number;
  stock: number;
  category?: { id: string; name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Address {
  fullAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

type PaymentMethod = "CASH" | "POD";

type Step = "customer" | "products" | "address" | "payment" | "confirm";

const STEPS: { id: Step; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "customer", label: "Customer", icon: UserCircleIcon },
  { id: "products", label: "Products", icon: ShoppingCartIcon },
  { id: "address", label: "Address", icon: MapPinIcon },
  { id: "payment", label: "Payment", icon: CreditCardIcon },
  { id: "confirm", label: "Confirm", icon: CheckCircleIcon },
];

const STEP_ORDER: Step[] = ["customer", "products", "address", "payment", "confirm"];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminOrderPage() {
  const { isEnabled } = useFeatureFlags();

  const [currentStep, setCurrentStep] = useState<Step>("customer");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber?: string } | null>(null);

  // ── Customer state ──
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ username: "", phone: "", email: "" });
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Products state ──
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const productSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Address state ──
  const [address, setAddress] = useState<Address>({
    fullAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  // ── Payment state ──
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentNote, setPaymentNote] = useState("");

  // ─── Customer search ─────────────────────────────────────────────────────
  const handleCustomerSearch = (val: string) => {
    setCustomerSearch(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setCustomerResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const { data } = await api.get("/order/admin-order/search-customers", { params: { q: val } });
        setCustomerResults(data.customers ?? []);
      } catch {
        // silent
      } finally {
        setCustomerLoading(false);
      }
    }, 350);
  };

  // ─── Product fetch ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (search: string, page: number) => {
    setProductsLoading(true);
    try {
      const { data } = await api.get("/order/admin-order/products", { params: { search, page, limit: 10 } });
      setProducts(data.products ?? []);
      setProductTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === "products") fetchProducts(productSearch, productPage);
  }, [currentStep, productPage]);

  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    if (productSearchDebounce.current) clearTimeout(productSearchDebounce.current);
    productSearchDebounce.current = setTimeout(() => {
      setProductPage(1);
      fetchProducts(val, 1);
    }, 350);
  };

  // ─── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: Math.min(c.quantity + 1, product.stock) } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number, maxStock: number) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: Math.min(qty, maxStock) } : c));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  // ─── Validation helpers ───────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (currentStep === "customer") {
      if (customerMode === "existing") return !!selectedCustomer;
      return !!(newCustomer.username.trim() && newCustomer.phone.trim());
    }
    if (currentStep === "products") return cart.length > 0;
    if (currentStep === "address") {
      return !!(address.fullAddress.trim() && address.city.trim() && address.state.trim() && address.zipCode.trim());
    }
    return true;
  };

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  };

  // ─── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
        address,
        paymentMethod,
        ...(paymentNote.trim() ? { paymentNote: paymentNote.trim() } : {}),
      };
      if (customerMode === "existing" && selectedCustomer) {
        body.customerId = selectedCustomer.id;
      } else {
        body.newCustomer = {
          username: newCustomer.username.trim(),
          phone: newCustomer.phone.trim(),
          ...(newCustomer.email.trim() ? { email: newCustomer.email.trim() } : {}),
        };
      }
      const { data } = await api.post("/order/admin-order/place", body);
      toast.success("Order placed successfully!");
      setPlacedOrder({ id: data.order?.id ?? data.orderId ?? "—" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const stepIndex = STEP_ORDER.indexOf(currentStep);

  // ─ Feature gate check ─
  if (!isEnabled("ADMIN_ORDER")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-10">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <ShoppingCartIcon className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Feature Disabled</h2>
          <p className="text-gray-500 text-sm">
            The "Place Order" feature is currently disabled. Ask your Super Admin to enable it in Feature Settings.
          </p>
        </div>
      </div>
    );
  }

  // ─ Success screen ─
  if (placedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
          <CheckCircleSolid className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-1">Order ID:</p>
          <p className="font-mono text-indigo-600 font-semibold text-sm break-all mb-6">{placedOrder.id}</p>
          <button
            onClick={() => {
              setPlacedOrder(null);
              setCurrentStep("customer");
              setSelectedCustomer(null);
              setCustomerSearch("");
              setNewCustomer({ username: "", phone: "", email: "" });
              setCart([]);
              setAddress({ fullAddress: "", city: "", state: "", zipCode: "", country: "India" });
              setPaymentMethod("CASH");
              setPaymentNote("");
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900">Place Order on Behalf of Customer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Walk-in / cash counter order entry</p>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4">
        <ol className="flex items-center gap-0 overflow-x-auto">
          {STEPS.map((step, i) => {
            const done = STEP_ORDER.indexOf(step.id) < stepIndex;
            const active = step.id === currentStep;
            return (
              <li key={step.id} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (done) setCurrentStep(step.id);
                  }}
                  disabled={!done && !active}
                  className={`flex flex-col sm:flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${active ? "text-indigo-700 bg-indigo-50" : done ? "text-green-700 cursor-pointer hover:bg-green-50" : "text-gray-400 cursor-default"}`}
                >
                  {done ? (
                    <CheckCircleSolid className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <step.icon className={`w-5 h-5 shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  )}
                  {step.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRightIcon className="w-4 h-4 text-gray-300 mx-1 shrink-0" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">

        {/* ── STEP 1: Customer ── */}
        {currentStep === "customer" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Select or Create Customer</h2>

            {/* Mode toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setCustomerMode("existing"); setSelectedCustomer(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${customerMode === "existing" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}
              >
                <MagnifyingGlassIcon className="w-4 h-4" /> Existing Customer
              </button>
              <button
                type="button"
                onClick={() => { setCustomerMode("new"); setSelectedCustomer(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${customerMode === "new" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}
              >
                <UserPlusIcon className="w-4 h-4" /> New Customer
              </button>
            </div>

            {/* Existing customer search */}
            {customerMode === "existing" && (
              <div className="space-y-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email…"
                    value={customerSearch}
                    onChange={e => handleCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {customerLoading && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {customerResults.length > 0 && !selectedCustomer && (
                  <ul className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                    {customerResults.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomer(c); setCustomerResults([]); setCustomerSearch(c.username); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors"
                        >
                          <UserCircleIcon className="w-8 h-8 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{c.username}</p>
                            <p className="text-xs text-gray-500">{c.phone ?? "No phone"} · {c.email ?? "No email"}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedCustomer && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircleSolid className="w-6 h-6 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{selectedCustomer.username}</p>
                      <p className="text-xs text-gray-500">{selectedCustomer.phone} · {selectedCustomer.email ?? "No email"}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} className="text-xs text-red-500 hover:underline">Change</button>
                  </div>
                )}
              </div>
            )}

            {/* New customer form */}
            {customerMode === "new" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Customer name" value={newCustomer.username}
                    onChange={e => setNewCustomer(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={newCustomer.phone}
                    onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="email" placeholder="customer@email.com" value={newCustomer.email}
                    onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Products ── */}
        {currentStep === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product picker */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Add Products</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={e => handleProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {products.map(p => {
                    const inCart = cart.find(c => c.product.id === p.id);
                    return (
                      <li key={p.id} className="flex items-center gap-3 py-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <ShoppingCartIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">₹{p.price.toLocaleString("en-IN")} · Stock: {p.stock}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => updateQty(p.id, inCart.quantity - 1, p.stock)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-indigo-700">{inCart.quantity}</span>
                            <button type="button" onClick={() => updateQty(p.id, inCart.quantity + 1, p.stock)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addToCart(p)}
                            className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
                            <PlusIcon className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {products.length === 0 && !productsLoading && (
                    <li className="py-10 text-center text-gray-400 text-sm">No products found</li>
                  )}
                </ul>
              )}

              {/* Pagination */}
              {productTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button type="button" disabled={productPage <= 1} onClick={() => setProductPage(p => p - 1)}
                    className="flex items-center gap-1 text-xs text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors">
                    <ChevronLeftIcon className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {productPage} / {productTotalPages}</span>
                  <button type="button" disabled={productPage >= productTotalPages} onClick={() => setProductPage(p => p + 1)}
                    className="flex items-center gap-1 text-xs text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors">
                    Next <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Cart summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 h-fit">
              <h2 className="text-base font-bold text-gray-800">Cart ({cart.length})</h2>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No items yet</p>
              ) : (
                <ul className="divide-y divide-gray-100 space-y-0">
                  {cart.map(item => (
                    <li key={item.product.id} className="flex items-center gap-2 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">₹{item.product.price.toLocaleString("en-IN")} × {item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 shrink-0">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                      <button type="button" onClick={() => removeFromCart(item.product.id)}
                        className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-bold text-gray-800">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Address ── */}
        {currentStep === "address" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-800">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Address <span className="text-red-500">*</span></label>
                <textarea rows={2} placeholder="House no, street, locality…" value={address.fullAddress}
                  onChange={e => setAddress(p => ({ ...p, fullAddress: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="City" value={address.city}
                    onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="State" value={address.state}
                    onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Zip / PIN Code <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="600001" value={address.zipCode}
                    onChange={e => setAddress(p => ({ ...p, zipCode: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input type="text" placeholder="India" value={address.country}
                    onChange={e => setAddress(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Payment ── */}
        {currentStep === "payment" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Payment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-colors
                  ${paymentMethod === "CASH" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 bg-white"}`}
              >
                <CreditCardIcon className={`w-8 h-8 ${paymentMethod === "CASH" ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${paymentMethod === "CASH" ? "text-indigo-700" : "text-gray-600"}`}>Cash Collected</span>
                <span className="text-xs text-gray-500 text-center">Customer paid in cash at the counter</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("POD")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-colors
                  ${paymentMethod === "POD" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 bg-white"}`}
              >
                <MapPinIcon className={`w-8 h-8 ${paymentMethod === "POD" ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${paymentMethod === "POD" ? "text-indigo-700" : "text-gray-600"}`}>Pay on Delivery</span>
                <span className="text-xs text-gray-500 text-center">Payment will be collected at delivery</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Note <span className="text-gray-400 font-normal">(optional — receipt no, UPI ref, etc.)</span></label>
              <input type="text" placeholder="e.g. Receipt #1234, UPI ref: abc123xyz" value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* ── STEP 5: Confirm ── */}
        {currentStep === "confirm" && (
          <div className="space-y-4">
            {/* Customer summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Customer</h3>
              {customerMode === "existing" && selectedCustomer ? (
                <div>
                  <p className="font-semibold text-gray-800">{selectedCustomer.username}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone ?? "—"} · {selectedCustomer.email ?? "No email"}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-gray-800">{newCustomer.username} <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span></p>
                  <p className="text-sm text-gray-500">{newCustomer.phone} {newCustomer.email ? `· ${newCustomer.email}` : ""}</p>
                </div>
              )}
            </div>

            {/* Items summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Items ({cart.length})</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 text-left font-semibold">Product</th>
                    <th className="pb-2 text-center font-semibold">Qty</th>
                    <th className="pb-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <tr key={item.product.id}>
                      <td className="py-2 text-gray-700">{item.product.name}</td>
                      <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right font-semibold text-gray-800">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="pt-3 font-bold text-gray-800">Total</td>
                    <td className="pt-3 text-right font-bold text-indigo-700 text-base">₹{cartTotal.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Address summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Delivery Address</h3>
              <p className="text-sm text-gray-700">{address.fullAddress}</p>
              <p className="text-sm text-gray-500">{address.city}, {address.state} {address.zipCode}, {address.country}</p>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Payment</h3>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentMethod === "CASH" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {paymentMethod === "CASH" ? "Cash Collected" : "Pay on Delivery"}
                </span>
                {paymentNote && <span className="text-sm text-gray-500">Ref: {paymentNote}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Back
          </button>

          {currentStep !== "confirm" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {placing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing…</>
              ) : (
                <><CheckCircleIcon className="w-4 h-4" /> Place Order</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
