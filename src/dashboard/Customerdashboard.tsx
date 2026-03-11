import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CategorySection from "../cart/CategorySection";
import { domainUrl } from "../utils/constant";
import FeaturedProducts from "../components/FeaturedProducts";
import { useAuth } from "../context/AuthContext";
import FooterSection from "../components/FooterSection";
import HeroCarousel from "../components/HeroCarousel";
import Loader from "../components/Loader";
import { useCart } from "../context/CartContext";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import CuratedLooksGallery from "../components/CuratedLooksGallery";
import DiscountPage from "../components/DiscountPage";
import AnnouncementBar from "../components/AnnouncementBar";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: { name: string };
}

const Customerdashboard = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [featuredSection, setFeaturedSection] = useState({ title: "Featured Collections", subtitle: "" });

  const { cartItems, fetchCart } = useCart();
  const { user, logout } = useAuth();
  const isAuthenticated = user.isAuthenticated;

  useEffect(() => {
    if (user.isInitialLoad) return;
    if (user.role === "SUPER_ADMIN") {
      navigate("/super-admin-dashboard", { replace: true });
    } else if (user.role === "ADMIN") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user.isInitialLoad, user.isAuthenticated, user.role, navigate]);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      if (!isAuthenticated) {
        setIsProfileLoading(false);
        return;
      }
      setIsProfileLoading(true);
      try {
        const res = await api.get("/user/profile");
        setUserProfile(res.data.users);
        if (res.data.users?.role) {
          const role = res.data.users.role.toUpperCase();
          if (role === "SUPER_ADMIN") {
            localStorage.setItem("role", res.data.users.role);
            navigate("/super-admin-dashboard", { replace: true });
            return;
          } else if (role === "ADMIN") {
            localStorage.setItem("role", res.data.users.role);
            navigate("/admin-dashboard", { replace: true });
            return;
          }
        }
      } catch (e) {
        setUserProfile(null);
      } finally {
        setIsProfileLoading(false);
      }
    };
    checkAuthAndFetchProfile();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const res = await api.get("/user/shop/products?featured=true");
        if (res.data && res.data.products) {
          setFeaturedProducts(res.data.products);
        } else {
          setFeaturedProducts([]);
        }
      } catch (e) {
        console.error("Error fetching products:", e);
        setProductsError("Could not load featured products.");
      } finally {
        setProductsLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    api
      .get("/home-banners?type=DISCOUNT_PANEL")
      .then(({ data }) => {
        if (data.featuredSection?.title) {
          setFeaturedSection({
            title: data.featuredSection.title,
            subtitle: data.featuredSection.subtitle ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogoutClick = () => {
    logout();
  };

  const handleGatedNavigation = (
    e: React.MouseEvent,
    path: string,
    isProtected: boolean,
  ) => {
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast("Please log in to view this page.");
      setTimeout(() => navigate("/login"), 1500);
    } else if (isProtected && role === "admin") {
      e.preventDefault();
      navigate("/admin-dashboard");
    } else {
      navigate(path);
    }
  };

  if (user.isInitialLoad) {
    return <Loader />;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated || role !== "user") {
      toast("Please log in to add items to your cart.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    if (isAdding) return;
    setIsAdding(product.id);
    try {
      const isAlreadyInCart = cartItems.some(
        (item: { productId: string }) => item.productId === product.id,
      );
      if (isAlreadyInCart) {
        toast("Already in cart. Redirecting...", { duration: 1500 });
        setTimeout(() => navigate("/cart"), 1500);
        return;
      }
      const cartData = { productId: product.id, quantity: 1 };
      await api.post("/cart/add", cartData);
      toast.success(`${product.name} added! Redirecting...`, {
        duration: 1500,
      });
      setTimeout(() => {
        fetchCart();
        navigate("/cart");
      }, 1500);
    } catch (e) {
      const err = e as any;
      console.error("Error adding to cart:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(err.response?.data?.message || "Failed to add to cart.");
      }
    } finally {
      setIsAdding(null);
    }
  };

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "https://via.placeholder.com/300?text=No+Image";
    return imagePath.startsWith("http")
      ? imagePath
      : `${domainUrl}/${imagePath}`;
  };

  const handleUserIconClick = () => {
    if (!isAuthenticated || role !== "user") {
      navigate("/login");
      return;
    }
    navigate("/profile");
  };

  if (isProfileLoading) {
    return <Loader />;
  }

  if (role === "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 font-medium">Redirecting to Admin...</p>
      </div>
    );
  }

  const cartItemCount = cartItems.length;

  return (
    <div className="bg-white">
      <HeroCarousel />
      <AnnouncementBar />
      <CategorySection />
      <DiscountPage />
      <CuratedLooksGallery />
      <FeaturedProducts
        featuredProducts={featuredProducts}
        productsLoading={productsLoading}
        productsError={productsError}
        sectionTitle={featuredSection.title}
        sectionSubtitle={featuredSection.subtitle || undefined}
      />
      <FooterSection />
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
};

export default Customerdashboard;
