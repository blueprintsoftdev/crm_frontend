import React, { useEffect, useState } from "react";
import api from "../utils/api";

const DEFAULT_ITEMS = [
  "Free shipping on orders above ₹999",
  "New arrivals every week",
  "100% authentic products",
  "Secure payments",
];

export default function AnnouncementBar() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);

  useEffect(() => {
    api
      .get("/admin/company-settings")
      .then(({ data }) => {
        const raw: string = data?.settings?.ANNOUNCEMENT_BAR ?? "";
        const parsed = raw
          .split("|")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (parsed.length > 0) setItems(parsed);
      })
      .catch(() => {/* keep defaults */});
  }, []);

  // Duplicate items so the marquee loops seamlessly
  const marqueeItems = [...items, ...items];

  return (
    <div className="bg-gray-900 text-white overflow-hidden py-2.5 select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {marqueeItems.map((text, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-8 text-xs font-medium tracking-widest uppercase">
            <span className="text-yellow-400">✦</span>
            {text}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
