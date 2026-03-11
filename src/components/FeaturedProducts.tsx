import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { domainUrl } from "../utils/constant";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: { name: string };
}

interface FeaturedProductsProps {
  featuredProducts: Product[];
  productsLoading: boolean;
  productsError: string | null;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

const FeaturedProducts = ({
  featuredProducts,
  productsLoading,
  productsError,
  sectionTitle = "Featured Collections",
  sectionSubtitle,
}: FeaturedProductsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // --- Scroll Logic ---
  useEffect(() => {
    const checkScrollable = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setIsScrollable(container.scrollWidth > container.clientWidth);
      }
    };
    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, [featuredProducts]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return "https://via.placeholder.com/300?text=No+Image";
    return imagePath.startsWith("http")
      ? imagePath
      : `${domainUrl}/${imagePath}`;
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // --- Loading Skeleton ---
  const LoadingSkeleton = () => (
    <div className="flex overflow-x-hidden gap-x-8 pb-12">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-64 shrink-0 animate-pulse">
          <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="bg-white py-20 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="text-left">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tighter sm:text-4xl"
            >
              <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-rose-700 bg-clip-text text-transparent">
                {sectionTitle}
              </span>
            </motion.h2>
            {sectionSubtitle && (
              <p className="text-gray-500 text-sm mt-2">{sectionSubtitle}</p>
            )}
            <div className="h-1 w-20 bg-gray-900 mt-4 rounded-full" />
          </div>

          {/* "See All" Link */}
          {!productsLoading && !productsError && (
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-500 hover:text-black transition-colors group"
            >
              See All
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* --- Loading State --- */}
        {/* ================= CONTENT STATES ================= */}

        {/* --- Loading State --- */}
        {productsLoading && <LoadingSkeleton />}

        {/* --- Error State (text only, no box) --- */}
        {!productsLoading && productsError && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-light">
              Could not load featured products.
            </p>
          </div>
        )}

        {/* --- Products Available --- */}
        {!productsLoading && !productsError && featuredProducts.length > 0 && (
          <div className="relative group/carousel">
            {/* Navigation Arrows */}
            {isScrollable && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="absolute -left-4 top-[40%] -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 text-gray-800 hover:bg-black hover:text-white transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 translate-x-4 group-hover/carousel:translate-x-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => scroll("right")}
                  className="absolute -right-4 top-[40%] -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 text-gray-800 hover:bg-black hover:text-white transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 -translate-x-4 group-hover/carousel:translate-x-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              ref={scrollContainerRef}
              // className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 -mx-4 px-4 gap-x-8 pb-8"

              className="
  flex overflow-x-auto scroll-smooth snap-x snap-mandatory
  py-6 pb-10
  -mx-4 px-6 sm:px-4
  gap-x-6 sm:gap-x-8
"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredProducts.map((product: Product) => (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  className="w-60 sm:w-64 shrink-0 snap-start"
                >
                  <Link to={`/products/${product.id}`} className="group block">
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-[3/4] rounded-xl bg-gray-100 border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* Info */}
                    <div className="mt-4 px-1">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          {product.category?.name || "Collection"}
                        </p>
                        <span className="text-sm font-bold text-gray-900">
                          ₹{product.price.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* --- Empty State (ONLY when no error) --- */}
        {!productsLoading &&
          !productsError &&
          featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 font-light">
                New collections arriving soon.
              </p>
            </div>
          )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
