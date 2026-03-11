import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { domainUrl } from "../utils/constant";
// import { ToastContainer, toast, Slide } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import toast, { Toaster } from "react-hot-toast";

interface CartItemType {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  image?: string;
}

function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    error,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
  } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // --- 1. Stock Validation Logic ---
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;

    cartItems.forEach((item) => {
      const stock = item.stock ?? 0;
      if (stock > 0 && item.quantity > stock) {
        updateQuantity(item.productId, stock);
        toast(`${item.name} quantity reduced to ${stock} due to stock change`, {
          id: "stock change",
        });
      }
    });
  }, [cartItems, updateQuantity]);

  // --- 2. Helper Functions ---
  const getImageUrl = (path: string | undefined) => {
    if (!path) return "https://via.placeholder.com/100?text=No+Image";
    return path.startsWith("http") ? path : `${domainUrl}/${path}`;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleIncrement = (item: CartItemType) => {
    const stock = item.stock ?? 0;
    if (item.quantity >= stock) {
      toast.error(`Only ${stock} item(s) available`, { id: "limited stock" });
      return;
    }
    updateQuantity(item.productId, item.quantity + 1);
  };

  const handleDecrement = (item: CartItemType) => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };

  const handleRemoveItem = (item: CartItemType) => {
    removeFromCart(item.productId);
    toast(`${item.name} removed from cart 🗑️`, {
      id: "removed change",
      style: { background: "#fff5f5", color: "#a33" },
    });
  };

  const handleCheckoutClick = async () => {
    try {
      setCheckoutLoading(true);
      const res = await api.post("/order/pre-checkout");
      (toast.success(res.data.message), { id: "checkoutt" });
      if (res.data.redirect) {
        navigate("/checkout");
      }
    } catch (err) {
      const _e = err as any;
      (toast.error(_e.response?.data?.message || "Checkout failed"),
        { id: "checkout failedd" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const hasOutOfStockItem = cartItems.some((item) => (item.stock ?? 0) === 0);

  // --- 3. Loading & Error States ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <svg
          className="animate-spin h-10 w-10 text-[#111827] mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"
          ></path>
        </svg>
        <p className="text-[#9CA3AF] font-medium">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-[#9CA3AF] mb-6">
          Looks like you haven't added anything yet.
        </p>
        <Link
          to="/"
          className="bg-[#111827] text-white rounded-full px-8 py-3 font-bold hover:bg-gray-900 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  // --- 4. Main Render ---
  return (
    // Reduced padding on mobile (p-4), larger on desktop (md:p-10)
    <div className="min-h-screen bg-white font-sans p-4 md:p-10 mt-20">
      {/* Header Section */}
      <div className="w-full mb-8 flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-full hover:bg-[#F3F4F6] transition-colors group"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#111827] group-hover:scale-110 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">
          My Cart
        </h1>
      </div>

      {/* Main Content - Flex Column on Mobile, Row on Desktop */}
      <div className="w-full flex flex-col lg:flex-row gap-8 relative">
        {/* Left Column: Cart Items List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
              Cart{" "}
              <span className="text-[#9CA3AF] text-base font-normal">
                ({cartItems.length} products)
              </span>
            </h2>
            <button
              onClick={clearCart}
              className="text-[#EF4444] font-medium flex items-center gap-1 hover:text-red-700 transition-colors text-sm md:text-base"
            >
              <span className="text-lg">×</span> Clear cart
            </button>
          </div>

          {/* Table Headers - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-12 text-[#9CA3AF] font-medium mb-4 text-sm">
            <div className="col-span-6 pl-2">Product</div>
            <div className="col-span-3 text-center">Count</div>
            <div className="col-span-3 text-right pr-2">Price</div>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              // RESPONSIVE GRID: Stacked on mobile (grid-cols-12 implied), Single row on desktop (md:grid-cols-12)
              <div
                key={item.productId || item._id}
                className="grid grid-cols-12 gap-y-4 md:gap-y-0 items-center bg-[#F9FAFB] rounded-xl p-4 relative"
              >
                {/* Product Info (Full width on mobile, half width on desktop) */}
                <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 border border-gray-100">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-bold text-[#111827] text-sm sm:text-base hover:underline block truncate"
                    >
                      {item.name}
                    </Link>
                    {item.selectedSize && (
                      <p className="text-[#9CA3AF] text-sm">
                        Size: {item.selectedSize}
                      </p>
                    )}
                    <p className="text-xs mt-1">
                      {item.stock > 5 ? (
                        <span className="text-green-600">In stock</span>
                      ) : item.stock > 0 ? (
                        <span className="text-orange-600">
                          Only {item.stock} left
                        </span>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls (Left aligned on mobile, Center on desktop) */}
                <div className="col-span-6 md:col-span-3 flex justify-start md:justify-center items-center">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleDecrement(item)}
                      className="px-3 py-1 text-[#9CA3AF] hover:text-[#111827] transition-colors disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-1 text-[#111827] font-medium text-sm w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className="px-3 py-1 text-[#9CA3AF] hover:text-[#111827] transition-colors disabled:opacity-50"
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price & Remove (Right aligned, split into row on mobile) */}
                <div className="col-span-6 md:col-span-3 flex justify-end items-center gap-4">
                  <span className="font-bold text-[#111827]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="text-[#EF4444] text-xl hover:text-red-700 transition-colors cursor-pointer p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sidebar - Sticky on Desktop only (lg:sticky) */}
        <div className="w-full lg:w-[400px] bg-[#F9FAFB] rounded-2xl p-6 h-fit flex flex-col lg:sticky lg:top-28">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Subtotal</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Discount</span>
              <span>-₹0.00</span>
            </div>
            <div className="flex justify-between font-bold text-[#111827] text-xl pt-4 border-t border-gray-200">
              <span>Total</span>
              <span>₹{cartTotal}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={
              checkoutLoading ||
              loading ||
              cartItems.length === 0 ||
              hasOutOfStockItem
            }
            className="w-full bg-[#111827] text-white rounded-xl py-4 font-bold hover:bg-gray-900 transition-colors text-lg shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {checkoutLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v-4C5.37 0 0 5.37 0 12h4z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : hasOutOfStockItem ? (
              "Remove Out of Stock Items"
            ) : (
              "Continue to checkout"
            )}
          </button>
        </div>
      </div>

      {/* <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        transition={Slide}
        toastStyle={{
          borderRadius: "10px",
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      /> */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: "10px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </div>
  );
}

export default CartPage;
