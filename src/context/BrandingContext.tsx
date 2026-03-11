// src/context/BrandingContext.tsx
// Fetches company branding (logo, name, tagline) once from the public API
// and makes it available throughout the app via useBranding().

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "../utils/api";

interface BrandingData {
  companyName: string;
  companyTagline: string;
  companyLogo: string;
}

interface BrandingContextValue {
  branding: BrandingData;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export const useBranding = (): BrandingContextValue => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside <BrandingProvider>");
  return ctx;
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBranding] = useState<BrandingData>({
    companyName: "",
    companyTagline: "",
    companyLogo: "",
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/admin/company-settings");
      const s = res.data.settings ?? {};
      setBranding({
        companyName: s.COMPANY_NAME ?? "",
        companyTagline: s.COMPANY_TAGLINE ?? "",
        companyLogo: s.COMPANY_LOGO ?? "",
      });
    } catch {
      // Keep defaults on error — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
};
