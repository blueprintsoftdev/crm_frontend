import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { ToastContainer, Slide, toast } from "react-toastify";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Check, Filter } from "lucide-react";

// Components
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
// 1. IMPORT THE WISHLIST HOOK
import { useWishlist } from "../context/WishlistContext";
// import "react-toastify/dist/ReactToastify.css";
import FooterSection from "../components/FooterSection";
import api from "../utils/api";
import DynamicFilterPanel, { type ActiveFilters as DynFilters } from "../components/DynamicFilterPanel";

interface CategoryProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  sizes?: string[];
  size?: string;
  color?: string;
  discount?: number;
  category?: { name?: string } | string;
  categoryName?: string;
}

interface CartItemRef {
  productId: string;
  name?: string;
  quantity?: number;
}

interface SelectedFilters {
  price: number | null;
  size: string[];
  color: string[];
  discount: boolean;
  inStock: boolean;
}

// --- CUSTOM HOOKS ---
const useInfiniteScroll = (callback: () => void) => {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        callback();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [callback]);
};

// --- HELPER COMPONENTS ---

function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// MODERN SKELETON LOADER
const SkeletonCard = () => (
  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-gray-200 animate-pulse">
    <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-gray-300" />
    <div className="absolute bottom-4 left-4 right-4 h-16 rounded-2xl bg-gray-300" />
  </div>
);

// 2. FIXED MODERN PRODUCT CARD (Connected to Wishlist Context)
const ModernProductCard = ({
  product,
  addToCart,
  cartItems,
}: {
  product: CategoryProduct;
  addToCart: (productId: string) => Promise<unknown>;
  cartItems: CartItemRef[];
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get functions from Wishlist Context
  const { isProductInWishlist, toggleWishlist } = useWishlist();

  // Check global state to see if this specific product is wishlisted
  const isWishlisted = isProductInWishlist(product.id);

  // Check if product is in cart
  const isInCart = cartItems?.some(
    (item: CartItemRef) => String(item.productId) === String(product.id),
  );

  const imageUrl = product.image?.startsWith("http")
    ? product.image
    : `http://localhost:5000/${product.image}`;

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if (isInCart) {
      toast("This item is already in your cart", {
        id: "already in the cartt",
      });
      return;
    }
    addToCart(product.id);
    toast.success(`Added ${product.name} to cart`, {
      id: "products addedd to the cartttt",
    });
  };

  // UPDATED: Calls the context function
  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await toggleWishlist(product.id);

    if (success) {
      // Message depends on the NEW state (if it WAS true, now it's removed, and vice versa)
      // Since isWishlisted updates reactively, we can infer:
      if (!isWishlisted) {
        toast.success("Added to wishlist", {
          id: "added to the wishlist from category",
        });
      } else {
        toast.success("Removed from wishlist", {
          id: "removed to the wishlist from category",
        });
      }
    } else {
      toast.error("Please login to use wishlist", {
        id: "please login to wishlist to product",
      });
    }
  };

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || product.categoryName;

  return (
    <div
      onClick={handleCardClick}
      className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Category Tag */}
      <div className="absolute left-4 top-4">
        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md">
          {categoryName || "Collection"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 top-4 flex flex-col gap-3">
        <button
          onClick={handleToggleWishlist}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
        >
          {/* FILL LOGIC: Based on Global State now */}
          <Heart
            className={classNames(
              "h-5 w-5 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900",
            )}
          />
        </button>

        <button
          onClick={handleAddToCart}
          className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95",
            isInCart
              ? "bg-green-100 text-green-700"
              : "bg-white/90 text-gray-900 hover:bg-black hover:text-white",
          )}
        >
          {isInCart ? (
            <Check className="h-5 w-5" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Bottom Info Card */}
      <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-xl border border-white/50">
          <div className="flex flex-col truncate pr-2">
            <h3 className="truncate text-sm font-bold text-gray-900">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-bold text-gray-900">
                ₹{product.price?.toFixed(0)}
              </p>
              {(product.discount ?? 0) > 0 && (
                <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1.5 rounded-full">
                  -{product.discount}%
                </span>
              )}
            </div>
          </div>

          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const PRICE_RANGES = [
  { label: "Under ₹1000", min: 0, max: 1000 },
  { label: "₹1000 - ₹3000", min: 1000, max: 3000 },
  { label: "₹3000 - ₹5000", min: 3000, max: 5000 },
  { label: "Over ₹5000", min: 5000, max: Infinity },
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const CategoryProductsPage = () => {
  const { slug } = useParams();
  const { user, logout } = useAuth();
  const { cartItems, addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<CategoryProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [sortType, setSortType] = useState("featured");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Dynamic attribute filter state (from DynamicFilterPanel)
  const [activeAttrValueIds, setActiveAttrValueIds] = useState<string[]>([]);
  // Stable string key — used in useEffect deps to avoid new-array-reference loop
  const attrIdsKey = activeAttrValueIds.slice().sort().join(",");
  // Increment to signal DynamicFilterPanel to reset its internal selections
  const [dynFilterResetKey, setDynFilterResetKey] = useState(0);

  // Stable handler — new inline arrow on every render caused the loop
  const handleDynFiltersChange = useCallback((f: DynFilters) => {
    setActiveAttrValueIds((prev) => {
      const next = f.attributeValueIds.slice().sort();
      const cur = prev.slice().sort();
      if (next.join(",") === cur.join(",")) return prev; // no change → no re-render
      return next;
    });
  }, []);

  // UI filter state (what the user is selecting in the sidebar)
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    price: null,
    size: [],
    color: [],
    discount: false,
    inStock: false,
  });

  // Committed filter state (sent to API when Apply is clicked)
  const [activeFilters, setActiveFilters] = useState<SelectedFilters>({
    price: null,
    size: [],
    color: [],
    discount: false,
    inStock: false,
  });

  const priceRanges = PRICE_RANGES;
  const sizeOptions = SIZE_OPTIONS;

  // --- API CALLS ---
  const fetchProductsByCategory = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!slug) return;
      if (reset) {
        setLoading(true);
        // Do NOT reset initialLoading here — that unmounts the sidebar/filter panel
        // and causes DynamicFilterPanel to emit [] which wipes the filter selection.
        // initialLoading is only set true on slug change (separate effect below).
      }

      try {
        const params: Record<string, string | number> = {
          sort: sortType,
          page: pageNum,
          limit: 12,
        };

        // Apply committed filters as query params
        if (activeFilters.price !== null) {
          const range = PRICE_RANGES[activeFilters.price];
          params.minPrice = range.min;
          if (isFinite(range.max)) params.maxPrice = range.max;
        }
        if (activeFilters.size.length > 0) {
          params.sizes = activeFilters.size.join(",");
        }
        if (activeFilters.inStock) {
          params.inStock = "true";
        }
        if (activeFilters.discount) {
          params.onSale = "true";
        }
        if (activeAttrValueIds.length > 0) {
          params.attributeValueIds = activeAttrValueIds.join(",");
        }

        const res = await api.get(`/user/shop/categories/${slug}`, { params });

        const newProducts = res.data.getProducts || [];

        if (reset) {
          setProducts(newProducts);
          setDisplayedProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
          setDisplayedProducts((prev) => [...prev, ...newProducts]);
        }

        if (newProducts.length > 0 && reset) {
          const nameFromProduct =
            newProducts[0].category?.name || newProducts[0].categoryName;
          setCategoryName(
            nameFromProduct ||
              slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
          );
        }

        setHasMore(newProducts.length === 12);
        setPage(pageNum);
      } catch (err) {
        const _e = err as any;
        setError("Unable to load products at this time");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [slug, sortType, activeFilters, activeAttrValueIds],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProductsByCategory(page + 1, false);
    }
  }, [loading, hasMore, page, fetchProductsByCategory]);

  // Use attrIdsKey (string) not the array reference — prevents new [] from re-triggering
  useEffect(() => {
    fetchProductsByCategory(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, sortType, activeFilters, attrIdsKey]);

  // Show skeleton again only when navigating to a different category
  useEffect(() => {
    setInitialLoading(true);
    setProducts([]);
    setDisplayedProducts([]);
  }, [slug]);

  useInfiniteScroll(loadMore);

  // --- FILTER LOGIC ---
  // Commit selected filters → triggers re-fetch via activeFilters useEffect
  const applyFilters = useCallback(() => {
    setActiveFilters({ ...selectedFilters });
  }, [selectedFilters]);

  const resetFilters = () => {
    const empty: SelectedFilters = { price: null, size: [], color: [], discount: false, inStock: false };
    setSelectedFilters(empty);
    setActiveFilters(empty);
    setActiveAttrValueIds([]);
    setDynFilterResetKey((k) => k + 1);
  };

  // --- RENDER ---

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-24 bg-gradient-to-r from-gray-50 to-white" />
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          {/* <div className="text-6xl mb-6">🔍</div> */}
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchProductsByCategory(1, true)}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* <Navbar
        isAuthenticated={user?.isAuthenticated}
        role={user?.role}
        cartItemCount={cartItems?.length || 0}
        handleLogout={logout}
        handleUserIconClick={() => navigate("/profile")}
        handleGatedNavigation={(e, path, isProtected) => {
          if (isProtected && !user?.isAuthenticated) {
            e.preventDefault();
            navigate("/login");
          } else {
            navigate(path);
          }
        }}
      /> */}

      {/* ANIMATED HEADER */}
      <div className="pt-32 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
          >
            <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-rose-700 bg-clip-text text-transparent capitalize">
              {categoryName}
            </span>
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ duration: 0.8 }}
            className="h-1 bg-gray-900 mx-auto mt-4 rounded-full"
          />
          <p className="text-gray-500 mt-4">
            {displayedProducts.length} items curated for you
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 ">
          {/* SIDEBAR */}
          {/* <div className="lg:w-64 flex-shrink-0 flex flex-col top-10 "> */}
          <div className="lg:w-64 flex-shrink-0 hidden lg:block">
            {/* <div className=" space-y-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 "> */}
            <div className="sticky top-24 space-y-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 uppercase tracking-wide"
                >
                  Clear
                </button>
              </div>

              {/* Price Filter */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Price
                </h4>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={selectedFilters.price === index}
                        onChange={() =>
                          setSelectedFilters((prev) => ({
                            ...prev,
                            price: prev.price === index ? null : index,
                          }))
                        }
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic category attribute filters (Color, Fabric, Material, etc.) */}
              {slug && (
                <DynamicFilterPanel
                  categoryId={slug}
                  onFiltersChange={handleDynFiltersChange}
                  resetKey={dynFilterResetKey}
                />
              )}

              {/* Utility Filters */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.discount}
                    onChange={(e) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        discount: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-600">On Sale</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.inStock}
                    onChange={(e) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        inStock: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-600">In Stock Only</span>
                </label>
              </div>

              <button
                onClick={applyFilters}
                className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl transform active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* PRODUCTS GRID */}
          <div className="flex-1">
            <div className="flex justify-end mb-8">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-200 rounded-full text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <option value="featured">Sort by Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {displayedProducts.length === 0 && !loading ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  We couldn't find any products matching your current filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-900 font-medium rounded-full hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`relative transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {displayedProducts.map((product) => (
                    <ModernProductCard
                      key={product.id}
                      product={product}
                      cartItems={cartItems}
                      addToCart={addToCart}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-16">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-3 border border-gray-200 text-gray-600 font-medium rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                      {loading
                        ? "Loading more styles..."
                        : "Load More Products"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "10px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </div>
  );
};

export default CategoryProductsPage;
