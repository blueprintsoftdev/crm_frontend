import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

// Fallback local images used when no banners are configured in the backend
import image20 from "../assets/1020.jpeg";
import image21 from "../assets/1021.jpeg";
import image22 from "../assets/1022.jpeg";
import image23 from "../assets/1023.jpeg";

interface Banner {
  id: string;
  title: string;
  image: string;
  discount: string | null;
  description: string | null;
}

const FALLBACK_BANNERS: Banner[] = [
  { id: "f1", title: "Women's Collection", image: image20, discount: "20% OFF", description: "Elegant kurtas and dresses designed for comfort, grace, and everyday style" },
  { id: "f2", title: "Mohey Women's Festive Saree", image: image21, discount: "20% OFF", description: "Smart casuals and everyday essentials crafted for comfort and confidence." },
  { id: "f3", title: "Moda Women's Rapido Sarees", image: image23, discount: "25% OFF", description: null },
  { id: "f4", title: "Featured Collection", image: image22, discount: "25% OFF", description: "Our most-loved designs chosen for comfort." },
];

const FALLBACK_HEADER = {
  title: "SHOP NOW AND SAVE 30%",
  subtitle: "Grace at a Great Price! Sarees on Discount",
};

const DiscountPage = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [header, setHeader] = useState(FALLBACK_HEADER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get("/home-banners?type=DISCOUNT_PANEL")
      .then(({ data }) => {
        const activeBanners: Banner[] = (data.banners ?? []).filter(
          (b: any) => b.isActive,
        );
        if (activeBanners.length > 0) {
          setBanners(activeBanners);
        } else {
          setBanners(FALLBACK_BANNERS);
        }
        if (data.discountSection) {
          setHeader(data.discountSection);
        }
      })
      .catch(() => {
        setBanners(FALLBACK_BANNERS);
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleShopNow = () => navigate("/products");

  // Panels: first two fill left/center columns; rest fill right column
  const leftPanels = banners.slice(0, 2);
  const rightPanels = banners.slice(2);

  if (!loaded) return null; // avoid layout shift while loading

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* --- HEADER SECTION --- */}
        <div className="mb-10">
          <h4 className="text-indigo-900 font-bold uppercase tracking-wider text-sm mb-2">
            Discount
          </h4>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {header.title}
          </h2>
          <p className="text-gray-500 max-w-xl text-lg">{header.subtitle}</p>
        </div>

        {/* --- GRID LAYOUT --- */}
        {banners.length > 0 && (
          <div
            className={`grid gap-6 h-auto lg:h-[600px] ${
              rightPanels.length === 0
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {/* Left panels (positions 0, 1) */}
            {leftPanels.map((panel, i) => (
              <div
                key={panel.id}
                className="relative group overflow-hidden h-[500px] lg:h-full rounded-none"
              >
                <img
                  src={panel.image}
                  alt={panel.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-8 text-white">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
                    {panel.title}
                  </h3>
                  {panel.discount && (
                    <div className="text-5xl font-bold mb-4">{panel.discount}</div>
                  )}
                  {panel.description && (
                    <p className="text-gray-200 text-sm mb-6 max-w-[200px]">
                      {panel.description}
                    </p>
                  )}
                  <ShopNowButton onClick={handleShopNow} />
                </div>
              </div>
            ))}

            {/* Right column panels (positions 2+) */}
            {rightPanels.length > 0 && (
              <div className="flex flex-col gap-6 h-[600px] lg:h-full">
                {rightPanels.map((panel, i) => (
                  <div
                    key={panel.id}
                    className="relative group overflow-hidden flex-1 w-full"
                  >
                    <img
                      src={panel.image}
                      alt={panel.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                      className={`absolute inset-0 flex flex-col justify-center px-8 text-white ${
                        i % 2 === 1 ? "items-end text-right" : ""
                      }`}
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-1">
                        {panel.title}
                      </h3>
                      {panel.discount && (
                        <div className="text-4xl font-bold mb-3">{panel.discount}</div>
                      )}
                      {panel.description && (
                        <p className="text-gray-200 text-xs mb-5 max-w-[200px]">
                          {panel.description}
                        </p>
                      )}
                      <div>
                        <ShopNowButton onClick={handleShopNow} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ShopNowButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-6 py-2 border border-white text-white text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-300"
  >
    Shop Now
  </button>
);

export default DiscountPage;
