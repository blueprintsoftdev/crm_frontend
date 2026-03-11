import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  LucideProps,
  Send,
} from "lucide-react";
import { useBranding } from "../context/BrandingContext";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterTemplateData {
  tagline: string;
  newsletterTitle?: string;
}

interface FooterConfig {
  activeTemplate: 1 | 2 | 3;
  templates: {
    "1": FooterTemplateData;
    "2": FooterTemplateData;
    "3": FooterTemplateData;
  };
}

const DEFAULT_CONFIG: FooterConfig = {
  activeTemplate: 1,
  templates: {
    "1": { tagline: "We are a design house dedicated to the art of Indian textile. Our mission is to keep the loom alive while dressing the future." },
    "2": { tagline: "Crafting timeless Indian fashion for the modern world." },
    "3": { tagline: "From our looms to your wardrobe — authentically Indian.", newsletterTitle: "Stay in the loop" },
  },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const FooterLink = ({ children }: { children: React.ReactNode }) => (
  <li>
    <a href="#" className="hover:opacity-100 opacity-70 transition-opacity flex items-center gap-1 group w-fit">
      {children}
      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
    </a>
  </li>
);

const SocialIcon = ({ Icon, dark }: { Icon: React.FC<LucideProps>; dark?: boolean }) => (
  <a
    href="#"
    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
      dark
        ? "border-white/20 text-white hover:bg-white hover:text-black"
        : "border-gray-300 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900"
    }`}
  >
    <Icon className="w-5 h-5" />
  </a>
);

// ─── Template 1: Dark Professional ────────────────────────────────────────────

function Template1({
  companyName, logoSrc, tagline, currentYear,
}: { companyName: string; logoSrc: string | null; tagline: string; currentYear: number }) {
  return (
    <footer className="bg-[#0a0a0a] text-white border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              {logoSrc && <img src={logoSrc} alt={companyName} className="h-10 w-auto object-contain filter brightness-125" />}
              <h4 className="text-3xl font-bold tracking-tighter uppercase">{companyName}</h4>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">{tagline}</p>
            <div className="flex gap-4">
              <SocialIcon Icon={Instagram} dark /><SocialIcon Icon={Facebook} dark />
              <SocialIcon Icon={Twitter} dark /><SocialIcon Icon={Mail} dark />
            </div>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-white">Shop</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>New Arrivals</FooterLink><FooterLink>Best Sellers</FooterLink><FooterLink>Sarees</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-white">Company</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>Our Story</FooterLink><FooterLink>Terms &amp; Conditions</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-white">Support</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>Help Center</FooterLink><FooterLink>Contact Us</FooterLink>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-white/30">
          <p>© {currentYear} {companyName}. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Template 2: Light Editorial ──────────────────────────────────────────────

function Template2({
  companyName, logoSrc, tagline, currentYear,
}: { companyName: string; logoSrc: string | null; tagline: string; currentYear: number }) {
  return (
    <footer className="bg-gray-50 text-gray-800 border-t border-gray-200">
      <div className="border-b border-gray-200 py-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {logoSrc && <img src={logoSrc} alt={companyName} className="h-12 w-auto object-contain" />}
            <div>
              <h4 className="text-2xl font-black tracking-tight text-gray-900 uppercase">{companyName}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Authentic Indian Fashion</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm text-center md:text-right">{tagline}</p>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Shop</h5>
            <ul className="space-y-3 text-sm text-gray-700">
              <FooterLink>New Arrivals</FooterLink><FooterLink>Best Sellers</FooterLink><FooterLink>Sarees</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Company</h5>
            <ul className="space-y-3 text-sm text-gray-700">
              <FooterLink>Our Story</FooterLink><FooterLink>Terms &amp; Conditions</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Support</h5>
            <ul className="space-y-3 text-sm text-gray-700">
              <FooterLink>Help Center</FooterLink><FooterLink>Contact Us</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Follow</h5>
            <div className="flex flex-wrap gap-2">
              <SocialIcon Icon={Instagram} /><SocialIcon Icon={Facebook} />
              <SocialIcon Icon={Twitter} /><SocialIcon Icon={Mail} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
          <p>© {currentYear} {companyName}. All rights reserved.</p>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Template 3: Gradient Accent with Newsletter ──────────────────────────────

function Template3({
  companyName, logoSrc, tagline, newsletterTitle, currentYear,
}: { companyName: string; logoSrc: string | null; tagline: string; newsletterTitle: string; currentYear: number }) {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-gradient-to-br from-indigo-950 via-slate-900 to-gray-950 text-white">
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">{newsletterTitle}</h3>
            <p className="text-white/50 text-sm mt-1">Get exclusive deals and new arrivals in your inbox.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
            className="flex gap-2 w-full md:w-auto min-w-[320px]"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              Subscribe <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              {logoSrc && <img src={logoSrc} alt={companyName} className="h-10 w-auto object-contain brightness-150" />}
              <h4 className="text-2xl font-black tracking-tighter uppercase text-white">{companyName}</h4>
            </div>
            <p className="text-white/45 text-sm leading-relaxed max-w-sm">{tagline}</p>
            <div className="flex gap-3">
              <SocialIcon Icon={Instagram} dark /><SocialIcon Icon={Facebook} dark />
              <SocialIcon Icon={Twitter} dark /><SocialIcon Icon={Mail} dark />
            </div>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Shop</h5>
            <ul className="space-y-4 text-sm text-white/55">
              <FooterLink>New Arrivals</FooterLink><FooterLink>Best Sellers</FooterLink><FooterLink>Sarees</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Company</h5>
            <ul className="space-y-4 text-sm text-white/55">
              <FooterLink>Our Story</FooterLink><FooterLink>Terms &amp; Conditions</FooterLink>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Support</h5>
            <ul className="space-y-4 text-sm text-white/55">
              <FooterLink>Help Center</FooterLink><FooterLink>Contact Us</FooterLink>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center text-xs text-white/30">
          <p>© {currentYear} {companyName}. All rights reserved.</p>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main FooterSection ────────────────────────────────────────────────────────

const FooterSection = () => {
  const { branding } = useBranding();
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    api
      .get("/home-banners/homepage-config")
      .then(({ data }) => {
        if (data?.footerConfig) {
          setFooterConfig({
            activeTemplate: data.footerConfig.activeTemplate ?? DEFAULT_CONFIG.activeTemplate,
            templates: {
              "1": { ...DEFAULT_CONFIG.templates["1"], ...data.footerConfig.templates?.["1"] },
              "2": { ...DEFAULT_CONFIG.templates["2"], ...data.footerConfig.templates?.["2"] },
              "3": { ...DEFAULT_CONFIG.templates["3"], ...data.footerConfig.templates?.["3"] },
            },
          });
        }
      })
      .catch(() => {});
  }, []);

  const companyName = branding.companyName || "Blueprint CRM";
  const logoSrc = branding.companyLogo
    ? branding.companyLogo.startsWith("http")
      ? branding.companyLogo
      : `${domainUrl}/${branding.companyLogo}`
    : null;

  const active = String(footerConfig.activeTemplate) as "1" | "2" | "3";
  const templateData = footerConfig.templates[active] ?? footerConfig.templates["1"];
  const tagline = templateData.tagline || branding.companyTagline || "";
  const currentYear = new Date().getFullYear();

  if (footerConfig.activeTemplate === 2)
    return <Template2 companyName={companyName} logoSrc={logoSrc} tagline={tagline} currentYear={currentYear} />;
  if (footerConfig.activeTemplate === 3)
    return (
      <Template3
        companyName={companyName}
        logoSrc={logoSrc}
        tagline={tagline}
        newsletterTitle={(templateData as any).newsletterTitle || "Stay in the loop"}
        currentYear={currentYear}
      />
    );
  return <Template1 companyName={companyName} logoSrc={logoSrc} tagline={tagline} currentYear={currentYear} />;
};

export default FooterSection;
