import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";
import {
  Bars3Icon,
  UserIcon,
  XMarkIcon,
  HeartIcon as HeartOutline,
  BellIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  BellIcon as BellSolid,
} from "@heroicons/react/24/solid";
import logo123 from "../assets/logo.png";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { useUserNotifications } from "../context/UserNotificationContext";
import { useNotifications } from "../context/NotificationContext";
import CustomerAuthModal from "./CustomerAuthModal";
import toast from "react-hot-toast";
import api from "../utils/api";
import { domainUrl } from "../utils/constant";


const Navbar = ({ user, role, cartItemCount = 0, handleLogout }: { user?: { isAuthenticated?: boolean; role?: string | null }; role?: string | null; cartItemCount?: number; handleLogout?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { branding } = useBranding();
  const { wishlistCount } = useWishlist();
  const { notifications: userNotifications, unreadCount: userUnreadCount, markAsRead } = useUserNotifications();
  const { unreadCount: adminUnreadCount } = useNotifications();

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const adminDashboardPath = role === "SUPER_ADMIN" ? "/super-admin-dashboard" : "/admin-dashboard";
  const unreadCount = isAdmin ? adminUnreadCount : userUnreadCount;
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    categories: Array<{ id: string; name: string; image?: string }>;
    products: Array<{ id: string; name: string; price: number; image?: string; category?: { id: string; name: string } }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- ACKNOWLEDGED COUNT STATE (Persisted) ---
  const [ackCartCount, setAckCartCount] = useState(() => {
    return parseInt(localStorage.getItem("ack_cart_count") || "0", 10);
  });

  const [ackWishlistCount, setAckWishlistCount] = useState(() => {
    return parseInt(localStorage.getItem("ack_wishlist_count") || "0", 10);
  });

  // --- MATCHING LOGIC ---
  const currentPath = location.pathname.toLowerCase();
  const isCartPage = currentPath.includes("cart");
  const isWishlistPage = currentPath.includes("wishlist");

  // --- SYNC LOGIC ---
  useEffect(() => {
    if (isCartPage) {
      setAckCartCount(cartItemCount);
      localStorage.setItem("ack_cart_count", String(cartItemCount));
    }
  }, [isCartPage, cartItemCount]);

  useEffect(() => {
    if (!isWishlistPage) return;
    setAckWishlistCount((prev) => {
      const next = Math.max(prev, wishlistCount);
      localStorage.setItem("ack_wishlist_count", String(next));
      return next;
    });
  }, [isWishlistPage, wishlistCount]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Open auth modal from anywhere via window event
  useEffect(() => {
    const handler = () => setCustomerAuthOpen(true);
    window.addEventListener("openCustomerAuth", handler);
    return () => window.removeEventListener("openCustomerAuth", handler);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    if (searchFocused) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchFocused]);

  // Debounced search API call
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/user/shop/global-search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data);
      } catch {
        setSearchResults({ categories: [], products: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryClick = (categoryId: string) => {
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults(null);
    navigate(`/categories/${categoryId}`);
  };

  const handleProductClick = (productId: string) => {
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults(null);
    navigate(`/products/${productId}`);
  };

 
  const isAuthenticated = user?.isAuthenticated;

  // --- BADGE VISIBILITY LOGIC ---
  const showCartBadge = cartItemCount > ackCartCount;
  const showWishlistBadge = wishlistCount > 0;

  const handleCartClick = () => {
    setAckCartCount(cartItemCount);
    localStorage.setItem("ack_cart_count", String(cartItemCount));
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    handleGatedNavigation(e, "/WishlistPage", true);
    setAckWishlistCount((prev) => {
      const next = Math.max(prev, wishlistCount);
      localStorage.setItem("ack_wishlist_count", String(next));
      return next;
    });
  };

  const handleUserIconClick = () => {
    if (!isAuthenticated) {
      setCustomerAuthOpen(true);
    } else {
      setIsUserDropdownOpen(!isUserDropdownOpen);
    }
  };


  const handleGatedNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
  e.preventDefault();

  if (isProtected && !isAuthenticated) {
    toast.error("Please login to continue",
      {id:"please login to continue wishlist"});
    return;
  }

  navigate(path);
};


  const navigation = [
  { name: "Home", href: "/", protected: false, icon: HomeIcon },
  { name: "Products", href: "/products", protected: false, icon: CubeIcon },
  ...(isAuthenticated
    ? [
        { name: "My Orders", href: "/myorders", protected: true, icon: ClipboardDocumentListIcon },
        { name: "Transactions", href: "/transactions", protected: true, icon: CreditCardIcon },
      ]
    : []),
];


  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
    <header className="fixed top-0 left-0 w-full z-60 font-sans ">
      {/* GLASSMORPHISM EFFECT (Light Black)
         - bg-black/40 or bg-gray-900/30: Semi-transparent dark background
         - backdrop-blur-xl or backdrop-blur-2xl: Strong blur for the "glass" look
         - border-white/10: Subtle light border for edge definition
      */}
      <nav className={`relative w-full transition-all duration-500 ${
        scrolled 
          ? "bg-black/60 backdrop-blur-2xl shadow-2xl shadow-black/20 py-4 border-b border-white/10" // Scrolled: slightly darker, strong blur
          : "bg-black/70 backdrop-blur-xl border-b border-white/5 py-6" // Top: very transparent, frosted
          // :"bg-gradient-to-r from-gray-900 via-indigo-900 to-rose-900 py-6"
      }`}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* LEFT: Logo & Mobile Menu */}
            <div className="flex items-center gap-4 lg:gap-8">
              <button
                type="button"
                className="lg:hidden p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                onClick={() => setMobileMenuOpen(true)}
              >
                {/* Text needs to be light (gray-300/white) because bg is dark glass */}
                <Bars3Icon className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
              </button>

              <Link to="/" className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={branding.companyLogo || logo123}
                    alt={branding.companyName || "Store"}
                    className="h-9 lg:h-10 w-auto object-contain transition-all duration-300 filter brightness-125"
                  />
                  <div className="hidden lg:block">
                    <div className="text-sm font-bold text-white tracking-widest uppercase">{branding.companyName || "blueprint_crm"}</div>
                    {(branding.companyTagline || "blueprint_crm desc") && (
                      <div className="text-xs text-gray-400 tracking-wider">{branding.companyTagline || "blueprint_crm desc"}</div>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* CENTER: Desktop Navigation + Search */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => item.protected && !isAuthenticated ? handleGatedNavigation(e, item.href, true) : null}
                    className={`relative flex items-center gap-2 px-5 py-3 text-md font-medium transition-all duration-300 group rounded-xl ${
                      active
                        ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10" // Active state glass effect
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-all duration-300 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                    {item.name}
                  </Link>
                );
              })}
              </div>

              {/* Global Search Bar */}
              <div ref={searchRef} className="relative ml-2">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search products & categories..."
                    className="w-56 xl:w-72 pl-9 pr-8 py-2 bg-white/10 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/15 focus:w-72 xl:focus:w-80 transition-all duration-300"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  )}
                  {searchQuery && !searchLoading && (
                    <button
                      onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); setSearchResults(null); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchFocused && searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 mt-2 w-80 xl:w-96 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden max-h-[420px] overflow-y-auto">
                    {searchLoading && (
                      <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-400">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Searching...
                      </div>
                    )}
                    {!searchLoading && searchResults && (
                      <>
                        {searchResults.categories.length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                              Categories
                            </div>
                            {searchResults.categories.map((cat) => (
                              <button
                                key={cat.id}
                                onMouseDown={() => handleCategoryClick(cat.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left group/item"
                              >
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
                                  {cat.image ? (
                                    <img
                                      src={cat.image.startsWith("http") ? cat.image : `${domainUrl}/${cat.image}`}
                                      alt={cat.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <CubeIcon className="h-4 w-4 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-white font-medium">{cat.name}</div>
                                  <div className="text-xs text-gray-500">Browse all {cat.name}</div>
                                </div>
                                <svg className="h-4 w-4 text-gray-600 group-hover/item:text-gray-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.products.length > 0 && (
                          <div className={searchResults.categories.length > 0 ? "border-t border-white/5 mt-1" : ""}>
                            <div className="px-4 pt-3 pb-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                              Products
                            </div>
                            {searchResults.products.map((prod) => (
                              <button
                                key={prod.id}
                                onMouseDown={() => handleProductClick(prod.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left group/item"
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
                                  {prod.image ? (
                                    <img
                                      src={prod.image.startsWith("http") ? prod.image : `${domainUrl}/${prod.image}`}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingBagIcon className="h-4 w-4 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-white font-medium truncate">{prod.name}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {prod.category?.name} · ₹{prod.price?.toLocaleString()}
                                  </div>
                                </div>
                                <svg className="h-4 w-4 text-gray-600 group-hover/item:text-gray-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.categories.length === 0 && searchResults.products.length === 0 && (
                          <div className="py-10 text-center">
                            <MagnifyingGlassIcon className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No results for <span className="text-white font-medium">"{searchQuery}"</span></p>
                            <p className="text-gray-600 text-xs mt-1">Try a different keyword</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Actions & Auth */}
            <div className="flex items-center gap-2 lg:gap-4">
              
              {/* Action Icons */}
              <div className="flex items-center gap-1 lg:gap-2">
                {/* Action Icons — visible only when logged in */}
              {isAuthenticated && (
                <>
                {/* Wishlist Icon */}
                <button
                  onClick={handleWishlistClick}
                  className="relative p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                >
                  {isActive('/wishlist') ? (
                    <HeartSolid className="h-5 w-5 text-pink-500 group-hover:text-pink-400 transition-colors" />
                  ) : (
                    <HeartOutline className="h-5 w-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
                  )}
                  {showWishlistBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-to-r from-pink-500 to-rose-500 text-[11px] text-white font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <Link
  to="/cart"
  onClick={(e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please login to continue",
        {id:"Navbar login to continue"});
      return;
    }
    handleCartClick();
  }}
  className="relative p-2.5 ..."
>

                  {isActive('/cart') ? (
                    <ShoppingBagSolid className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  ) : (
                    <ShoppingBagIcon className="h-5 w-5 text-gray-400 group-hover:text-emerald-300 transition-colors" />
                  )}
                  {showCartBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-to-r from-emerald-500 to-teal-500 text-[11px] text-white font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                </>
              )}

              

              

                  {/* Bell notification — customers get dropdown, admin/superadmin get count-only badge linking to dashboard */}
                  {isAuthenticated && (
                    <div ref={notifRef} className="relative">
                      {isAdmin ? (
                        // Admin/SuperAdmin: count badge only, click navigates to dashboard notifications
                        <button
                          onClick={() => navigate(`${adminDashboardPath}/notifications`)}
                          className="relative p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                          aria-label="Notifications"
                        >
                          <BellIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </button>
                      ) : (
                        // Customer: full dropdown
                        <>
                      <button
                        onClick={() => setNotifOpen((o) => !o)}
                        className="relative p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                        aria-label="Notifications"
                      >
                        {notifOpen ? (
                          <BellSolid className="h-5 w-5 text-white" />
                        ) : (
                          <BellIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                        )}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Dropdown panel */}
                      {notifOpen && (
                        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-black/90 backdrop-blur-2xl rounded-xl shadow-2xl shadow-black/50 border border-white/10 z-50 overflow-hidden">
                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h3 className="font-semibold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="text-xs bg-rose-500/20 text-rose-400 rounded-full px-2.5 py-0.5 font-semibold border border-rose-500/20">
                                {unreadCount} new
                              </span>
                            )}
                          </div>

                          {/* List */}
                          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                            {userNotifications.length === 0 ? (
                              <p className="text-center text-sm text-gray-500 py-10">No notifications yet</p>
                            ) : (
                              userNotifications.slice(0, 8).map((n) => {
                                const id = n.id ?? n._id;
                                return (
                                  <button
                                    key={id}
                                    className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 ${
                                      !n.isRead ? "bg-white/5 hover:bg-white/10" : "hover:bg-white/5"
                                    }`}
                                    onClick={() => {
                                      if (!n.isRead && id) markAsRead(id);
                                      setNotifOpen(false);
                                    }}
                                  >
                                    {!n.isRead && (
                                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                                    )}
                                    <div className={n.isRead ? "pl-4" : ""}>
                                      <p className={`text-sm leading-snug line-clamp-2 ${!n.isRead ? "font-semibold text-white" : "text-gray-400"}`}>
                                        {n.message}
                                      </p>
                                      {n.createdAt && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {new Date(n.createdAt).toLocaleString("en-IN", {
                                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>

                          {/* Footer */}
                          {userNotifications.length > 0 && (
                            <div className="border-t border-white/10 px-4 py-2.5">
                              <Link
                                to="/myorders"
                                onClick={() => setNotifOpen(false)}
                                className="text-xs text-gray-400 hover:text-white transition-colors"
                              >
                                View My Orders →
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}

                {/* Auth Section */}
                {!isAuthenticated ? (
                  <div className="hidden lg:flex items-center gap-3 ml-2">
                   
                    <button
                      onClick={() => setCustomerAuthOpen(true)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={handleUserIconClick}
                      className="hidden lg:flex items-center gap-2 ml-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:border-white/30 transition-colors backdrop-blur-md">
                        <UserIcon className="h-4 w-4 text-gray-300 group-hover:text-white" />
                      </div>
                      <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-all duration-300 ${isUserDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>
                    
                    {/* User Dropdown */}
                    {isUserDropdownOpen && (
                      <div className="absolute top-full right-0 mt-3 w-56 bg-black/80  rounded-xl shadow-2xl shadow-black/50 border border-white/10 py-2 z-50">
                        {/* <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white">Welcome back!</p>
                          <p className="text-xs text-gray-400 truncate">{user.email || "User"}</p>
                        </div> */}
                        <Link
                          to="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          My Profile
                        </Link>
                        <div className="border-t border-white/10 my-2"></div>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}

              
              </div>
            </div>
          </div>
        </div>
      </nav>


      {/* ------------------------------------------------ */}
      {/* ENHANCED MOBILE MENU */}
      {/* ------------------------------------------------ */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300" />
        <div className="fixed inset-0 z-50 flex">
          <DialogPanel className="relative mr-auto flex h-full w-[320px] flex-col overflow-y-auto bg-black/90 backdrop-blur-2xl shadow-2xl transition-transform duration-300 border-r border-white/10">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <img src={logo123} alt="Logo" className="h-8 w-auto filter brightness-125" />
                    <div>
                      <div className="text-sm font-bold text-white">blueprint_crm</div>
                      <div className="text-xs text-gray-400">blueprint_crm desc</div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-2 py-4">
              {/* Mobile Search */}
              <div className="mx-2 mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search products & categories..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {/* Mobile search results */}
                {searchQuery.trim().length >= 2 && (searchLoading || searchResults) && (
                  <div className="mt-2 bg-black/80 border border-white/10 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {searchLoading && (
                      <div className="p-3 text-center text-gray-400 text-sm">Searching...</div>
                    )}
                    {!searchLoading && searchResults && (
                      <>
                        {[...searchResults.categories.map(c => ({ type: "category" as const, ...c })),
                          ...searchResults.products.map(p => ({ type: "product" as const, ...p }))
                        ].length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
                        ) : (
                          <>
                            {searchResults.categories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => { handleCategoryClick(cat.id); setMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                  {cat.image ? (
                                    <img src={cat.image.startsWith("http") ? cat.image : `${domainUrl}/${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <CubeIcon className="h-4 w-4 text-gray-500 m-auto mt-2" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-white font-medium">{cat.name}</div>
                                  <div className="text-[10px] text-gray-500">Category</div>
                                </div>
                              </button>
                            ))}
                            {searchResults.products.map((prod) => (
                              <button
                                key={prod.id}
                                onClick={() => { handleProductClick(prod.id); setMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                              >
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                  {prod.image ? (
                                    <img src={prod.image.startsWith("http") ? prod.image : `${domainUrl}/${prod.image}`} alt={prod.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBagIcon className="h-4 w-4 text-gray-500 m-auto mt-2.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-white font-medium truncate">{prod.name}</div>
                                  <div className="text-[10px] text-gray-500">₹{prod.price?.toLocaleString()}</div>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={(e) => {
                        if (item.protected && !isAuthenticated) {
                          handleGatedNavigation(e, item.href, true);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 mx-2 ${
                        active
                          ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                {/* Notifications link — authenticated only */}
                {isAuthenticated && (
                  <Link
                    to="/myorders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 mx-2 text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    <BellIcon className="h-5 w-5 text-gray-400" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto min-w-[20px] h-[20px] bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>

            {/* Auth Section */}
            <div className="px-4 py-6 border-t border-white/10">
              {!isAuthenticated ? (
                <div className="space-y-3">
                 
                  <button
                    onClick={() => { setMobileMenuOpen(false); setCustomerAuthOpen(true); }}
                    className="block w-full text-center border border-gray-600 text-gray-300 py-3.5 rounded-lg text-sm font-semibold hover:bg-white/5 hover:text-white transition-colors"
                  >
                     Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* <div className="px-4 py-3 bg-white/5 rounded-lg mb-3 border border-white/5">
                    <p className="text-sm font-semibold text-white">Welcome back!</p>
                    <p className="text-xs text-gray-400 truncate">{user.email || "User"}</p>
                  </div> */}
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-center bg-black/40 text-gray-300 py-3.5 rounded-lg text-sm font-semibold hover:bg-white/5 hover:text-white transition-colors border border-white/5"
                  >
                    <UserIcon className="h-4 w-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full text-center border border-white/10 text-rose-400 py-3.5 rounded-lg text-sm font-semibold hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </header>

    <CustomerAuthModal
      open={customerAuthOpen}
      onClose={() => setCustomerAuthOpen(false)}
    />
    </>
  );
};

export default Navbar;