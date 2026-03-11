import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { 
  MinusIcon, 
  PlusIcon, 
  ArrowLeftIcon, 
  ShieldCheckIcon, 
  TruckIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { 
  Heart, 
  ShoppingBag, 
  Check, 
  ArrowRight,
  Share2
} from "lucide-react"; // Using Lucide to match AllProducts
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from 'react-hot-toast';
import { motion } from "framer-motion";
import FooterSection from "../components/FooterSection";
import DeliveryLocationModal from "./DeliveryLocationModal";

// Components & Context
import Navbar from "../components/Navbar"; 
import api from "../utils/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { domainUrl } from "../utils/constant";



interface DetailProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  stock?: number;
  description?: string;
  category?: { name?: string } | string;
  discount?: number;
  sizes?: string[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: { name?: string } | string;
}

interface ReviewUser {
  id: string;
  username: string;
  avatar?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewDistribution {
  star: number;
  count: number;
}

// ── Star Rating Display ───────────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= Math.round(rating)
          ? <StarSolid key={star} className={`${sz} text-amber-400`} />
          : <StarIcon key={star} className={`${sz} text-gray-300`} />
      ))}
    </div>
  );
}

// ── Interactive Star Picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          {(hovered || value) >= star
            ? <StarSolid className="h-7 w-7 text-amber-400" />
            : <StarIcon className="h-7 w-7 text-gray-300" />}
        </button>
      ))}
    </div>
  );
}

// ── Review Section ────────────────────────────────────────────────────────────
function ReviewSection({ productId, isAuthenticated }: { productId: string; isAuthenticated: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [distribution, setDistribution] = useState<ReviewDistribution[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editMode, setEditMode] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/${productId}`);
      setReviews(res.data.reviews);
      setAvg(res.data.avg);
      setDistribution(res.data.distribution);
      setFeatureEnabled(true);
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } }).response?.status === 403) {
        setFeatureEnabled(false);
      }
    }
  }, [productId]);

  const loadMyReview = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/reviews/my/${productId}`);
      setMyReview(res.data.review || null);
      setCanReview(res.data.canReview);
      if (res.data.review) {
        setRating(res.data.review.rating);
        setComment(res.data.review.comment || "");
      }
    } catch {
      // ignore
    }
  }, [productId, isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReviews(), loadMyReview()]).finally(() => setLoading(false));
  }, [loadReviews, loadMyReview]);

  if (!featureEnabled) return null; // Feature disabled — hide entirely

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editMode && myReview) {
        await api.patch(`/reviews/${myReview.id}`, { rating, comment });
        toast.success("Review updated!", { id: "review-update" });
      } else {
        await api.post(`/reviews/${productId}`, { rating, comment });
        toast.success("Review submitted!", { id: "review-submit" });
      }
      setShowForm(false);
      setEditMode(false);
      await Promise.all([loadReviews(), loadMyReview()]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to submit review";
      toast.error(msg, { id: "review-error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      await api.delete(`/reviews/${myReview.id}`);
      toast.success("Review deleted", { id: "review-delete" });
      setMyReview(null);
      setRating(5);
      setComment("");
      setShowForm(false);
      await loadReviews();
    } catch {
      toast.error("Failed to delete review", { id: "review-delete-err" });
    }
  };

  const startEdit = () => {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment || "");
    setEditMode(true);
    setShowForm(true);
  };

  const totalReviews = reviews.length;

  return (
    <section className="mt-20 border-t border-gray-100 pt-16">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Customer Reviews
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gray-900" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Summary bar ── */}
          {totalReviews > 0 && (
            <div className="mx-auto mb-10 grid max-w-2xl gap-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 sm:grid-cols-2">
              {/* Average */}
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-5xl font-extrabold text-gray-900">{avg.toFixed(1)}</span>
                <StarDisplay rating={avg} size="lg" />
                <p className="text-sm text-gray-500">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
              </div>

              {/* Distribution bars */}
              <div className="flex flex-col gap-1.5 justify-center">
                {distribution.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right text-gray-600 font-medium">{star}</span>
                    <StarSolid className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="w-5 text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA / form ── */}
          {isAuthenticated && canReview && !myReview && !showForm && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={() => { setEditMode(false); setShowForm(true); }}
                className="rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors"
              >
                Write a Review
              </button>
            </div>
          )}

          {isAuthenticated && !canReview && !myReview && (
            <p className="mb-8 text-center text-sm text-gray-400">
              Only customers who have received this product can leave a review.
            </p>
          )}

       

          {/* Review form */}
          {showForm && (
            <div className="mx-auto mb-10 max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                {editMode ? "Edit your review" : "Your Review"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0 resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditMode(false); }}
                    className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="flex-1 rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : editMode ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── My review card ── */}
          {myReview && !showForm && (
            <div className="mx-auto mb-8 max-w-xl rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Your Review</p>
                  <StarDisplay rating={myReview.rating} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={startEdit}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2"
                  >Edit</button>
                  <button
                    onClick={handleDelete}
                    className="text-xs font-medium text-red-500 hover:text-red-700 underline underline-offset-2"
                  >Delete</button>
                </div>
              </div>
              {myReview.comment && <p className="text-sm text-gray-600">{myReview.comment}</p>}
            </div>
          )}

          {/* ── Review list ── */}
          {reviews.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No reviews yet. Be the first!</p>
          ) : (
            <div className="mx-auto max-w-2xl divide-y divide-gray-100">
              {reviews.map((r) => (
                <div key={r.id} className="py-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      {r.user.avatar
                        ? <img src={r.user.avatar} alt={r.user.username} className="h-full w-full object-cover" />
                        : <span className="text-sm font-bold text-gray-500">{r.user.username[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.user.username}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="ml-auto">
                      <StarDisplay rating={r.rating} />
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// --- HELPERS ---
const safeRender = (value: unknown, fallback = ""): string => {
  if (!value) return fallback;
  if (typeof value === 'object' && value !== null && 'name' in value) return (value as {name: string}).name;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const STATIC_DETAILS = [
  {
    name: "Composition & Care",
    icon: <ShieldCheckIcon className="h-5 w-5 text-gray-400" />,
    items: [
      "Premium quality material",
      "Designed for daily use",
      "Comfortable fit",
      "Durable construction",
    ],
  },
  {
    name: "Shipping & Returns",
    icon: <TruckIcon className="h-5 w-5 text-gray-400" />,
    items: [
      "Free shipping on orders over ₹1000",
      "Fast delivery options available",
      "Easy 30-day returns",
      "Secure packaging",
    ],
  },
];

// --- MODERN CARD COMPONENT (Reused from AllProducts for consistency) ---
const ModernProductCard = ({ product, addToCart, cartItems }: { product: RelatedProduct; addToCart: (productId: string) => Promise<unknown>; cartItems: { productId: string }[] }) => {
  
  const navigate = useNavigate();

  // Check if product is already in cart
  const isInCart = cartItems.some((item) => String(item.productId) === String(product.id));

  const imageUrl = product.image?.startsWith("http")
    ? product.image
    : `${domainUrl}/${product.image}`;

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
    window.scrollTo(0,0);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart) {
      toast.error("This item is already in your cart",{id:"This item is already in your cartmnmnm"});
      return;
    }
    addToCart(product.id);
  };


  const { isProductInWishlist, toggleWishlist } = useWishlist();

const isWishlisted = isProductInWishlist(product.id);


  const handleToggleWishlist = async (e: React.MouseEvent) => {
  e.stopPropagation();

  const success = await toggleWishlist(product.id);
  if (success) {
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {id:"wishlist-toggle-related"});
  }
};


  const categoryName = typeof product.category === 'object' 
    ? product.category?.name 
    : product.category;

  return (
    <div 
      onClick={handleCardClick}
      className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <img
        src={imageUrl}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="absolute left-4 top-4">
        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md">
          {categoryName || "Collection"}
        </span>
      </div>

      <div className="absolute right-4 top-4 flex flex-col gap-3">
        <button
          onClick={handleToggleWishlist}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={classNames("h-5 w-5 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
        </button>
        <button
          onClick={handleAddToCart}
          className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95",
            isInCart ? "bg-green-100 text-green-700 cursor-default" : "bg-white/90 text-gray-900 hover:bg-black hover:text-white"
          )}
        >
          {isInCart ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-90 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-xl border border-white/50">
          <div className="flex flex-col truncate pr-2">
            <h3 className="truncate text-sm font-bold text-gray-900">{product.name}</h3>
            <p className="mt-0.5 text-xs font-bold text-gray-500">₹ {product.price?.toFixed(2)}</p>
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white transition-colors duration-300">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DETAIL PAGE COMPONENT ---
export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  const { cartItems, addToCart, fetchCart } = useCart(); // Assuming addToCart is available here too
  const { user, logout } = useAuth();
  const { isProductInWishlist, toggleWishlist } = useWishlist();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isInWishlist = product ? isProductInWishlist(product.id) : false;
  
  // Check if current product is already in cart
  const isAlreadyAdded = cartItems.some((item) => String(item.productId) === String(productId));

  const handleGatedNavigation = (e: React.MouseEvent, path: string, isProtected: boolean) => {
    if (isProtected && !user.isAuthenticated) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        window.scrollTo(0, 0);
        const res = await api.get(`/user/shop/product/${productId}`);
        setProduct(res.data.product);
        setRelatedProducts(res.data.relatedProducts || []);
      } catch (err) {
      const _e = err as any;
        console.error(err);
        setError(_e.response?.status === 404 ? "Product not found" : "Error loading product");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  // Handle Add to Cart for the Main Product
  const handleMainAddToCart = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if ((product.stock ?? 0) <= 0) return toast.error("Sorry, this product is out of stock.",{id:"sorry product is out of stooooooooooockkkk"});
    if (isAlreadyAdded) return toast.success("Already in your cart!"),{id:"sorry product is out of stooooooooooockkkkk"};

    setIsAdding(true);
    try {
      if (addToCart) {
        await addToCart(product.id);
        toast.success(`Added ${product.name} to cart`,{id:"added productsss"});
      } else {
        const cartData = { productId: product.id, quantity: 1 };
        await api.post(`/cart/add`, cartData);
        fetchCart();
        toast.success(`${product.name} added to cart!`,{id:"added to cart done"});
      }
    } catch (err) {
      const _e = err as any;
      if (_e.response?.status === 401) {
        window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      } else {
        toast.error("Failed to add to cart",{id:"failedddddddd"});
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Buy Now — open delivery location modal (handles cart + checkout)
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("openCustomerAuth"));
      return;
    }
    if ((product.stock ?? 0) <= 0) {
      toast.error("Sorry, this product is out of stock.", { id: "buynow-oos" });
      return;
    }
    setShowDeliveryModal(true);
  };

  // Wrapper for Related Products Add to Cart
  const handleRelatedAddToCart = async (productId: string): Promise<void> => {
    if(addToCart) {
      await addToCart(productId);
      toast.success(`Added to cart`,{id:"sorry product is adddedddd"});
    }
  }

  const handleToggleWishlist = async () => {
    if (!user?.isAuthenticated) return toast.error("Please log in to use wishlist",{id:"please be login"});
    if (!product) return;
    const success = await toggleWishlist(product.id);
    if (success) {
      toast.success(isInWishlist ? "Removed from Wishlist" : "Added to Wishlist!",{id:"removed or add to wishlist"});
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: safeRender(product?.name) || "Check out this product",
      text: `Check out ${safeRender(product?.name)} — ₹${product?.price?.toLocaleString()}`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed — do nothing
      }
    } else {
      // Desktop fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!", { id: "share-copy" });
      } catch {
        toast.error("Could not copy link", { id: "share-copy-err" });
      }
    }
  };

  if (loading) return <div className="h-screen flex justify-center items-center bg-white"><BeatLoader color="#000" /></div>;
  if (error || !product) return <div className="text-center py-20 text-red-600 font-semibold">{error || "Unavailable"}</div>;

  // Build full image list: primary + gallery
  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean) as string[];
  const getImgSrc = (img: string) => img.startsWith("http") ? img : `${domainUrl}/${img}`;
  const displayImage = allImages[selectedImageIndex] ? getImgSrc(allImages[selectedImageIndex]) : getImgSrc(product.image ?? "");

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const categoryName = safeRender(product.category, "Collection");

  return (
    <div className="bg-white min-h-screen font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* <Navbar 
        isAuthenticated={user.isAuthenticated}
        role={user.role}
        cartItemCount={cartItems?.length || 0}
        handleLogout={logout}
        handleUserIconClick={() => navigate("/profile")}
        handleGatedNavigation={handleGatedNavigation}
      /> */}

      <main className="max-w-7xl mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8 mt-24">
        
        {/* --- BREADCRUMB / BACK --- */}
        <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-sm font-medium text-gray-600 hover:bg-black hover:text-white transition-all duration-300"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to shopping
            </button>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 items-start">
          
          {/* --- LEFT: PRODUCT IMAGE GALLERY --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            {/* Main Image Carousel */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] bg-gray-100 shadow-sm border border-gray-100 group">
              {/* Slide strip — all images rendered; translateX moves between them */}
              <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{
                  width: `${allImages.length * 100}%`,
                  transform: `translateX(-${(selectedImageIndex * 100) / allImages.length}%)`,
                }}
              >
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative h-full flex-shrink-0"
                    style={{ width: `${100 / allImages.length}%` }}
                  >
                    <img
                      src={getImgSrc(img)}
                      alt={`${safeRender(product.name)} view ${i + 1}`}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {/* Overlay Badge */}
              <div className="absolute top-6 left-6 pointer-events-none">
                <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-900 backdrop-blur-md shadow-sm">
                  {categoryName}
                </span>
              </div>

              {/* Prev / Next arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.min(allImages.length - 1, i + 1))}
                    disabled={selectedImageIndex === allImages.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-800 hover:bg-white disabled:opacity-30 transition-all duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Image count indicator */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                      i === selectedImageIndex
                        ? "border-gray-900 shadow-md scale-105"
                        : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImgSrc(img)}
                      alt={`${safeRender(product.name)} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* --- RIGHT: PRODUCT DETAILS --- */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="mt-10 px-2 sm:px-0 lg:mt-0 lg:sticky lg:top-24"
          >
            {/* Title + Share */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 sm:text-5xl font-sans">
                {safeRender(product.name)}
              </h1>
              <button
                onClick={handleShare}
                title="Share this product"
                className="flex-shrink-0 mt-1 p-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Price & Stock */}
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-8">
                <p className="text-3xl font-bold text-gray-900">
                  ₹ {product.price?.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Out of Stock</span>
                    ) : isLowStock ? (
                        <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">Only {stock} Left</span>
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">In Stock</span>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm text-gray-500 mb-10 leading-relaxed max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mb-10">

                 <button
                onClick={handleBuyNow}
                disabled={isAdding || isOutOfStock}
                className={`w-full flex items-center justify-center gap-3 rounded-full py-4 text-sm font-bold uppercase tracking-wider transition-all border-2 hover:-translate-y-1 active:translate-y-0
                  ${(isOutOfStock || isAdding)
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                  }`}
              >
                {isAdding ? <BeatLoader size={8} color="#111" /> : <><ArrowRight className="h-5 w-5" /> Buy Now</>}
              </button>
              <button
                onClick={handleMainAddToCart}
                disabled={isAdding || isOutOfStock || isAlreadyAdded}
                className={`w-full flex items-center justify-center gap-3 rounded-full py-4 text-sm font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0
                  ${(isOutOfStock || isAdding || isAlreadyAdded) 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                    : "bg-black text-white hover:bg-gray-900"
                  }`}
              >
                {isAdding ? <BeatLoader size={8} color="#fff" /> : 
                 isOutOfStock ? "Sold Out" : 
                 isAlreadyAdded ? <><Check className="h-5 w-5"/> In Cart</> : 
                 <><ShoppingBag className="h-5 w-5"/> Add to Cart</>}
              </button>

              <button
                onClick={handleToggleWishlist}
                className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold uppercase tracking-wider border border-gray-200 text-gray-900 hover:bg-gray-50 transition-all hover:border-gray-300"
              >
                <Heart className={classNames("h-5 w-5", isInWishlist ? "fill-red-500 text-red-500" : "")} />
                {isInWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
              </button>
            </div>

            {/* Accordions (Clean Style) */}
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/50 p-2">
              {STATIC_DETAILS.map((detail) => (
                <Disclosure key={detail.name} as="div">
                  {({ open }) => (
                    <>
                      <dt>
                        <DisclosureButton className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-gray-900 hover:bg-white rounded-xl transition-colors">
                          <span className="flex items-center gap-3">
                            {detail.icon}
                            {detail.name}
                          </span>
                          <span className="ml-6 flex items-center text-gray-400">
                            {open ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                          </span>
                        </DisclosureButton>
                      </dt>
                      <DisclosurePanel as="dd" className="px-4 pb-4 pt-1">
                        <ul className="list-disc pl-11 text-sm text-gray-500 space-y-1">
                          {detail.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
            
          </motion.div>
        </div>

        {/* --- RELATED PRODUCTS (Using ModernProductCard) --- */}
        {relatedProducts.length > 0 && (
          <section className="mt-32">
             <div className="text-center mb-12">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl font-sans"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-rose-700 bg-clip-text text-transparent">
                    You May Also Like
                  </span>
                </motion.h2>
                <div className="h-1 bg-gray-900 mx-auto mt-4 rounded-full w-20" />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((item) => (
                <ModernProductCard 
                    key={item.id} 
                    product={item} 
                    addToCart={handleRelatedAddToCart}
                    cartItems={cartItems}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        {productId && (
          <ReviewSection
            productId={productId}
            isAuthenticated={user.isAuthenticated}
          />
        )}
      </main>
      <FooterSection/>

      {/* Delivery location picker modal (triggered by Buy Now) */}
      {product && (
        <DeliveryLocationModal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          product={{ id: product.id, name: safeRender(product.name), price: product.price ?? 0 }}
        />
      )}
    </div>
  );
}