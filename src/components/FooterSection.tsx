import React from "react";
import {
  ArrowUpRight,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  LucideProps,
} from "lucide-react";
import { useBranding } from "../context/BrandingContext";
import { domainUrl } from "../utils/constant";

const FooterSection = () => {
  const { branding } = useBranding();

  const companyName = branding.companyName || "Blueprint CRM";
  const tagline = branding.companyTagline || "We are a design house dedicated to the art of Indian textile. Our mission is to keep the loom alive while dressing the future.";
  const logoSrc = branding.companyLogo
    ? branding.companyLogo.startsWith("http")
      ? branding.companyLogo
      : `${domainUrl}/${branding.companyLogo}`
    : null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] text-white border-t border-white/10">
      {/* --- MAIN FOOTER CONTENT --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt={companyName}
                  className="h-10 w-auto object-contain filter brightness-125"
                />
              )}
              <h4 className="text-3xl font-bold tracking-tighter uppercase">
                {companyName}
              </h4>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              {tagline}
            </p>
            <div className="flex gap-4">
              <SocialIcon Icon={Instagram} />
              <SocialIcon Icon={Facebook} />
              <SocialIcon Icon={Twitter} />
              <SocialIcon Icon={Mail} />
            </div>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h5 className="font-bold mb-6 text-white">Shop</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>New Arrivals</FooterLink>
              <FooterLink>Best Sellers</FooterLink>
              <FooterLink>Sarees</FooterLink>
              {/* <FooterLink>Accessories</FooterLink> */}
            </ul>
          </div>

          {/* Links Column 2: Company */}
          <div>
            <h5 className="font-bold mb-6 text-white">Company</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>Our Story</FooterLink>
              {/* <FooterLink>Sustainability</FooterLink> */}
              {/* <FooterLink>Careers</FooterLink> */}
              <FooterLink>Terms & Conditions</FooterLink>
            </ul>
          </div>

          {/* Links Column 3: Support */}
          <div>
            <h5 className="font-bold mb-6 text-white">Support</h5>
            <ul className="space-y-4 text-sm text-white/60">
              <FooterLink>Help Center</FooterLink>
              {/* <FooterLink>Returns</FooterLink> */}
              {/* <FooterLink>Shipping</FooterLink> */}
              <FooterLink>Contact Us</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-white/30">
            <p>© {currentYear} {companyName}. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Helper Components ---

const FooterLink = ({ children }: { children: React.ReactNode }) => (
  <li>
    <a
      href="#"
      className="hover:text-white transition-colors flex items-center gap-1 group w-fit"
    >
      {children}
      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
    </a>
  </li>
);

const SocialIcon = ({ Icon }: { Icon: React.FC<LucideProps> }) => (
  <a
    href="#"
    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
  >
    <Icon className="w-5 h-5" />
  </a>
);

export default FooterSection;
