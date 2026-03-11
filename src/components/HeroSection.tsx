import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import api from "../utils/api";

// Fallback images (same pool as the original hero)
import image1 from "../assets/1000.jpeg";
import image2 from "../assets/1001.jpeg";
import image3 from "../assets/1002.jpeg";
import image4 from "../assets/1003.jpeg";
import image5 from "../assets/1004.jpeg";
import image6 from "../assets/1005.jpeg";
import image7 from "../assets/1006.jpeg";
import image8 from "../assets/1007.jpeg";
import image9 from "../assets/1008.jpeg";

const FALLBACK_IMAGES = [image1, image2, image3, image4, image5, image6, image7, image8, image9];

interface HeroTemplateData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgImage?: string;
  accentText?: string;
  images?: string[];
  highlightText?: string;
  badgeText?: string;
}

interface HeroConfig {
  activeTemplate: 1 | 2 | 3 | 4;
  templates: Record<string, HeroTemplateData>;
}

const DEFAULT_CONFIG: HeroConfig = {
  activeTemplate: 1,
  templates: {
    "1": {
      title: "Summer styles are finally here",
      subtitle: "This year, our new summer collection will shelter you from the harsh elements of a world that doesn't care if you live or die.",
      ctaText: "Shop Collection",
      ctaLink: "/products",
    },
    "2": {
      title: "New Arrivals Just Dropped",
      subtitle: "Discover our latest curated pieces.",
      ctaText: "Explore Now",
      ctaLink: "/products",
      bgImage: "",
    },
    "3": {
      title: "Elegance Redefined",
      subtitle: "Timeless. Modern. Yours.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "New Season",
    },
    "4": {
      title: "Lets Create your Own Style",
      subtitle: "It is a long established fact that a reader will be distracted by the readable content of a page.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      accentText: "Trendy Collections",
      highlightText: "Create",
      badgeText: "25%\nDiscount on Everything",
      bgImage: "",
    },
  },
};

// ─── Template 1: Editorial Split ──────────────────────────────────────────────
// Text left, asymmetric image grid right — modernised original
function Template1({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const gridImages = (() => {
    if (data.images && data.images.length > 0) {
      const filled = [...data.images, ...FALLBACK_IMAGES];
      return filled.filter(Boolean).slice(0, 9);
    }
    return FALLBACK_IMAGES.slice(0, 9);
  })();

  return (
    <div className="relative overflow-hidden w-full bg-white mt-16 sm:mt-20 lg:mt-24">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-100 via-transparent to-transparent opacity-70 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 text-center lg:text-left z-20 mb-12 lg:mb-0 lg:mt-16"
          >
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-rose-700 bg-clip-text text-transparent block pb-2">
                {data.title}
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg font-medium text-gray-600 max-w-2xl mx-auto lg:mx-0">
              {data.subtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="mt-10 inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-700 transition-colors shadow-lg"
            >
              {data.ctaText || "Shop Collection"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Right: Masonry image grid — 2 | 3 | 2 column layout */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="flex gap-2 sm:gap-3">
              {/* Left column — 2 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[0], gridImages[1]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03, zIndex: 10, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 0 ? "3/4" : "2/3" }}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>

              {/* Center column — 3 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[2], gridImages[3], gridImages[4]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03, zIndex: 10, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 1 ? "1/1" : "3/4" }}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>

              {/* Right column — 2 images */}
              <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                {[gridImages[5], gridImages[6]].map((src, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03, zIndex: 10, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-2xl"
                    style={{ aspectRatio: i === 0 ? "2/3" : "3/4" }}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Template 2: Cinematic Full-width ─────────────────────────────────────────
// Full-width image background with overlay text
function Template2({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;

  return (
    <div className="relative w-full mt-16 sm:mt-20 lg:mt-24 min-h-[75vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={bgSrc}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase text-white/60 mb-4">
            New Collection
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none tracking-tighter mb-6">
            {data.title}
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
            {data.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-gray-100 transition-colors shadow-xl"
            >
              {data.ctaText || "Explore Now"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-white/10 transition-colors"
            >
              View All
            </motion.button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// ─── Template 3: Dark Minimal Centered ────────────────────────────────────────
// Dark gradient bg, oversized typography, small accent image
function Template3({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const accentImages = (() => {
    if (data.images && data.images.length > 0) {
      const filled = [...data.images, ...FALLBACK_IMAGES];
      return filled.filter(Boolean).slice(0, 4);
    }
    return FALLBACK_IMAGES.slice(0, 4);
  })();

  return (
    <div className="relative w-full mt-16 sm:mt-20 lg:mt-24 bg-[#0c0c0c] overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-600/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            {data.accentText && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-indigo-400 mb-6"
              >
                <span className="inline-block w-6 h-px bg-indigo-400" />
                {data.accentText}
                <span className="inline-block w-6 h-px bg-indigo-400" />
              </motion.span>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none tracking-tighter mb-8">
              {data.title.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.3 }}
                  className={`block ${i % 2 === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              {data.subtitle}
            </p>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-10 py-4 rounded-full text-base font-bold hover:opacity-95 transition shadow-lg"
            >
              {data.ctaText || "Shop Now"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 mt-12 lg:mt-0"
          >
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto lg:max-w-none">
              {accentImages.map((src, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03, zIndex: 10 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden rounded-2xl border border-white/10 ${
                    i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Modern Product Spotlight ────────────────────────────────────
// White bg, text left, single product image right with decorative circles + badge
function Template4({ data }: { data: HeroTemplateData }) {
  const navigate = useNavigate();
  const bgSrc = data.bgImage || image1;

  const titleParts = (() => {
    if (data.highlightText && data.title.includes(data.highlightText)) {
      const idx = data.title.indexOf(data.highlightText);
      return {
        before: data.title.slice(0, idx),
        highlight: data.highlightText,
        after: data.title.slice(idx + data.highlightText.length),
      };
    }
    return { before: data.title, highlight: "", after: "" };
  })();

  const badgeParts = data.badgeText ? data.badgeText.split("\n") : [];

  return (
    <div className="relative overflow-hidden w-full bg-white mt-16 sm:mt-20 lg:mt-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full lg:w-1/2 text-center lg:text-left z-20 mb-12 lg:mb-0"
          >
            {data.accentText && (
              <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">{data.accentText}</p>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-gray-900 mb-6">
              {titleParts.before}
              {titleParts.highlight && (
                <span className="text-rose-500">{titleParts.highlight}</span>
              )}
              {titleParts.after}
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0">
              {data.subtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(data.ctaLink || "/products")}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full text-base font-semibold transition-colors shadow-lg shadow-rose-200/50"
            >
              {data.ctaText || "Shop Now"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Right: Product image with decorative shapes */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative flex items-center justify-center min-h-[380px] sm:min-h-[480px]"
          >
            {/* Decorative circles */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-100 opacity-70" style={{ right: "8%", top: "50%", transform: "translateY(-50%)" }} />
            <div className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-pink-100 opacity-60" style={{ right: "2%", top: "10%" }} />
            <div className="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-purple-200/50" style={{ left: "10%", bottom: "15%" }} />
            <div className="absolute w-8 h-8 rounded-full bg-rose-300/40" style={{ left: "20%", top: "20%" }} />

            {/* Product image */}
            <div className="relative z-10 h-[360px] sm:h-[440px] flex items-end justify-center">
              <img
                src={bgSrc}
                alt=""
                className="h-full w-auto object-contain object-bottom"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }}
              />
              {/* Floating badge */}
              {badgeParts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute top-8 right-0 bg-white shadow-2xl rounded-2xl px-4 py-3 text-center min-w-[100px]"
                  style={{ boxShadow: "0 10px 40px rgba(244,63,94,0.15), 0 4px 20px rgba(0,0,0,0.1)" }}
                >
                  <p className="text-2xl sm:text-3xl font-black text-rose-500 leading-none">{badgeParts[0]}</p>
                  {badgeParts[1] && <p className="text-[11px] text-gray-400 mt-1 leading-tight">{badgeParts[1]}</p>}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Main HeroSection component ───────────────────────────────────────────────
export default function HeroSection() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    api
      .get("/home-banners/homepage-config")
      .then(({ data }) => {
        if (data?.heroConfig) {
          setConfig({
            activeTemplate: data.heroConfig.activeTemplate ?? DEFAULT_CONFIG.activeTemplate,
            templates: {
              "1": { ...DEFAULT_CONFIG.templates["1"], ...data.heroConfig.templates?.["1"] },
              "2": { ...DEFAULT_CONFIG.templates["2"], ...data.heroConfig.templates?.["2"] },
              "3": { ...DEFAULT_CONFIG.templates["3"], ...data.heroConfig.templates?.["3"] },
              "4": { ...DEFAULT_CONFIG.templates["4"], ...data.heroConfig.templates?.["4"] },
            },
          });
        }
      })
      .catch(() => {
        // silently fall back to defaults
      });
  }, []);

  const active = String(config.activeTemplate);
  const templateData = config.templates[active] ?? config.templates["1"];

  if (config.activeTemplate === 2) return <Template2 data={templateData} />;
  if (config.activeTemplate === 3) return <Template3 data={templateData} />;
  if (config.activeTemplate === 4) return <Template4 data={templateData} />;
  return <Template1 data={templateData} />;
}
