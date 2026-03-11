import React, { useEffect, useRef, useState } from "react";
import api from "../utils/api";

interface PromoBanner {
  id: string;
  image: string;
  title: string;
  discount?: string | null;
  description?: string | null;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/home-banners?type=PROMO_BANNER")
      .then(({ data }) => {
        const active: PromoBanner[] = (data.banners ?? [])
          .filter((b: any) => b.isActive)
          .map((b: any) => ({
            id: b.id,
            image: b.image,
            title: b.title,
            discount: b.discount,
            description: b.description,
          }));
        setBanners(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || banners.length === 0) return null;

  const doubled = [...banners, ...banners];
  const duration = Math.max(banners.length * 6, 16);

  return (
    <section className="w-full py-6 sm:py-8 bg-white overflow-hidden">
      <style>{`
        @keyframes banner-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .banner-scroll-track {
          display: flex;
          animation: banner-scroll ${duration}s linear infinite;
          will-change: transform;
        }
        .banner-scroll-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="overflow-hidden w-[90vw] mx-auto">
        <div ref={trackRef} className="banner-scroll-track">
          {doubled.map((b, i) => (
            <div
              key={`${b.id}-${i}`}
              className="flex-none overflow-hidden bg-gray-100"
              style={{
                width: "min(42vw, 560px)",
                minWidth: "220px",
                height: "min(22vw, 320px)",
                minHeight: "140px",
                marginRight: "12px",
                borderRadius: "14px",
                flexShrink: 0,
              }}
            >
              <img
                src={b.image}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
