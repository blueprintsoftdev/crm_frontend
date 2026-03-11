// src/context/BrandingContext.tsx
// Fetches company branding (logo, name, tagline) once from the public API
// and makes it available throughout the app via useBranding().

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "../utils/api";

interface BrandingData {
  companyName: string;
  companyTagline: string;
  companyLogo: string;
  companyFavicon: string;
}

interface BrandingContextValue {
  branding: BrandingData;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

const BRANDING_CACHE_KEY = "crm_branding_cache";

function readBrandingCache(): BrandingData | null {
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? (JSON.parse(raw) as BrandingData) : null;
  } catch {
    return null;
  }
}

export const useBranding = (): BrandingContextValue => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside <BrandingProvider>");
  return ctx;
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  // Initialise immediately from cache so the navbar never flickers on reload
  const cached = readBrandingCache();
  const [branding, setBranding] = useState<BrandingData>(
    cached ?? { companyName: "", companyTagline: "", companyLogo: "", companyFavicon: "" }
  );
  // If we already have cached data, consider it "loaded" right away
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/admin/company-settings");
      const s = res.data.settings ?? {};
      const fresh: BrandingData = {
        companyName: s.COMPANY_NAME ?? "",
        companyTagline: s.COMPANY_TAGLINE ?? "",
        companyLogo: s.COMPANY_LOGO ?? "",
        companyFavicon: s.COMPANY_FAVICON ?? "",
      };
      setBranding(fresh);
      try { localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(fresh)); } catch { /* quota exceeded — ignore */ }
    } catch {
      // Keep cached / default values on error — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync browser tab title and favicon whenever branding changes
  useEffect(() => {
    if (branding.companyName) {
      document.title = branding.companyName;
    }
    if (branding.companyFavicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.companyFavicon;
    }
  }, [branding.companyName, branding.companyFavicon]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
};
