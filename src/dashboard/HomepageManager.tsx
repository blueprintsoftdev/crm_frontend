import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  RectangleStackIcon,
  PhotoIcon as HeroPhotoIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type BannerType = "DISCOUNT_PANEL" | "CAROUSEL_ITEM" | "PROMO_BANNER";
type Tab = BannerType | "FEATURED" | "ANNOUNCEMENT" | "HERO" | "FOOTER";

interface HomeBanner {
  id: string;
  type: BannerType;
  title: string;
  image: string;
  discount: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface SectionHeader {
  title: string;
  subtitle: string;
}

interface FeaturedProduct {
  id: string;
  name: string;
  code: string;
  image?: string;
  price: number;
  isFeatured: boolean;
  featuredOrder: number | null;
  category?: { id: string; name: string };
}

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

interface FooterTemplateData {
  tagline: string;
  newsletterTitle?: string;
}

interface FooterConfig {
  activeTemplate: 1 | 2 | 3;
  templates: Record<string, FooterTemplateData>;
}

// â”€â”€â”€ Defaults â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEFAULT_HERO: HeroConfig = {
  activeTemplate: 1,
  templates: {
    "1": { title: "Summer styles are finally here", subtitle: "This year, our new summer collection will shelter you from the harsh elements of a world that doesn't care if you live or die.", ctaText: "Shop Collection", ctaLink: "/products" },
    "2": { title: "New Arrivals Just Dropped", subtitle: "Discover our latest curated pieces.", ctaText: "Explore Now", ctaLink: "/products", bgImage: "" },
    "3": { title: "Elegance Redefined", subtitle: "Timeless. Modern. Yours.", ctaText: "Shop Now", ctaLink: "/products", accentText: "New Season" },
    "4": { title: "Lets Create your Own Style", subtitle: "It is a long established fact that a reader will be distracted by the readable content of a page.", ctaText: "Shop Now", ctaLink: "/products", accentText: "Trendy Collections", highlightText: "Create", badgeText: "25%\nDiscount on Everything", bgImage: "" },
  },
};

const DEFAULT_FOOTER: FooterConfig = {
  activeTemplate: 1,
  templates: {
    "1": { tagline: "We are a design house dedicated to the art of Indian textile. Our mission is to keep the loom alive while dressing the future." },
    "2": { tagline: "Crafting timeless Indian fashion for the modern world." },
    "3": { tagline: "From our looms to your wardrobe â€” authentically Indian.", newsletterTitle: "Stay in the loop" },
  },
};

const emptyForm = {
  type: "DISCOUNT_PANEL" as BannerType,
  title: "",
  discount: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

const HERO_TEMPLATE_LABELS: Record<string, { name: string; desc: string }> = {
  "1": { name: "Editorial Split", desc: "Text left, asymmetric image grid right — modern editorial look" },
  "2": { name: "Cinematic Full-width", desc: "Large background image with overlay text — dramatic & immersive" },
  "3": { name: "Dark Minimal Centered", desc: "Dark gradient bg, oversized bold typography — high fashion feel" },
  "4": { name: "Product Spotlight", desc: "White bg, text left + single product image right with decorative shapes & badge" },
};

const FOOTER_TEMPLATE_LABELS: Record<string, { name: string; desc: string }> = {
  "1": { name: "Dark Professional", desc: "Dark background, multi-column grid â€” classic & sophisticated" },
  "2": { name: "Light Editorial", desc: "Clean white background, brand-forward â€” minimal & modern" },
  "3": { name: "Gradient with Newsletter", desc: "Indigo-to-slate gradient + email signup â€” bold & engaging" },
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function HomepageManager() {
  const [activeTab, setActiveTab] = useState<Tab>("ANNOUNCEMENT");

  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [discountSection, setDiscountSection] = useState<SectionHeader>({ title: "SHOP NOW AND SAVE 30%", subtitle: "Grace at a Great Price! Sarees on Discount" });
  const [carouselSection, setCarouselSection] = useState<SectionHeader>({ title: "Curated Looks For You", subtitle: "" });
  const [featuredSection, setFeaturedSection] = useState<SectionHeader>({ title: "Featured Collections", subtitle: "" });
  const [promoSection, setPromoSection] = useState<SectionHeader>({ title: "Special Offers", subtitle: "" });
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState("Free shipping on orders above â‚¹999 | New arrivals every week | 100% authentic products | Secure payments");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Hero config state
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_HERO);
  const [savingHero, setSavingHero] = useState(false);
  const [editingHeroTemplate, setEditingHeroTemplate] = useState<string | null>(null);
  const [heroForm, setHeroForm] = useState<HeroTemplateData>(DEFAULT_HERO.templates["1"]);

  // Footer config state
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER);
  const [savingFooter, setSavingFooter] = useState(false);
  const [editingFooterTemplate, setEditingFooterTemplate] = useState<string | null>(null);
  const [footerForm, setFooterForm] = useState<FooterTemplateData>(DEFAULT_FOOTER.templates["1"]);

  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredPage, setFeaturedPage] = useState(1);
  const [featuredTotalPages, setFeaturedTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [orderEditId, setOrderEditId] = useState<string | null>(null);
  const [orderInput, setOrderInput] = useState("");

  // Header edit state (for DISCOUNT/CAROUSEL/FEATURED/PROMO section headers)
  const [editingSection, setEditingSection] = useState<"DISCOUNT" | "CAROUSEL" | "FEATURED" | "PROMO" | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", subtitle: "" });
  const [savingSection, setSavingSection] = useState(false);

  // Banner modal
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<HomeBanner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingHeroImage, setUploadingHeroImage] = useState<number | null>(null);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/home-banners/admin");
      setBanners(data.banners);
      setDiscountSection(data.discountSection);
      if (data.carouselSection) setCarouselSection(data.carouselSection);
      if (data.featuredSection) setFeaturedSection(data.featuredSection);
      if (data.promoSection) setPromoSection(data.promoSection);
    } catch {
      toast.error("Failed to load homepage banners");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHomepageConfig = useCallback(async () => {
    try {
      const [settingsResp, configResp] = await Promise.all([
        api.get("/admin/company-settings"),
        api.get("/admin/homepage-config"),
      ]);
      const announcementRaw: string = settingsResp.data?.settings?.ANNOUNCEMENT_BAR ?? "";
      if (announcementRaw) setAnnouncementText(announcementRaw);
      if (configResp.data?.heroConfig) setHeroConfig({ ...DEFAULT_HERO, ...configResp.data.heroConfig });
      if (configResp.data?.footerConfig) setFooterConfig({ ...DEFAULT_FOOTER, ...configResp.data.footerConfig });
    } catch {
      // silently keep defaults
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchHomepageConfig();
  }, [fetchBanners, fetchHomepageConfig]);

  const fetchFeaturedProducts = useCallback(async (search = featuredSearch, page = featuredPage) => {
    try {
      setFeaturedLoading(true);
      const params = new URLSearchParams({ search, page: String(page), limit: "20" });
      const { data } = await api.get(`/home-banners/featured-products?${params}`);
      setFeaturedProducts(data.products);
      setFeaturedTotalPages(data.pagination.totalPages || 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setFeaturedLoading(false);
    }
  }, [featuredSearch, featuredPage]);

  useEffect(() => {
    if (activeTab === "FEATURED") fetchFeaturedProducts();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ Announcement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const saveAnnouncement = async () => {
    try {
      setSavingAnnouncement(true);
      await api.put("/admin/company-settings", { announcementBar: announcementText });
      toast.success("Announcement bar updated");
    } catch {
      toast.error("Failed to save announcement");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // â”€â”€ Hero Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleHeroTemplateSelect = async (templateNum: number) => {
    const updated = { ...heroConfig, activeTemplate: templateNum as 1 | 2 | 3 | 4 };
    setHeroConfig(updated);
    try {
      await api.put("/admin/homepage-config/hero", updated);
      toast.success(`Hero template ${templateNum} activated`);
    } catch {
      toast.error("Failed to update hero template");
    }
  };

  const openHeroEdit = (templateKey: string) => {
    setHeroForm({ ...(heroConfig.templates[templateKey] ?? DEFAULT_HERO.templates["1"]) });
    setEditingHeroTemplate(templateKey);
  };

  const saveHeroTemplate = async () => {
    if (!editingHeroTemplate) return;
    const updated: HeroConfig = {
      ...heroConfig,
      templates: { ...heroConfig.templates, [editingHeroTemplate]: heroForm },
    };
    try {
      setSavingHero(true);
      await api.put("/admin/homepage-config/hero", updated);
      setHeroConfig(updated);
      setEditingHeroTemplate(null);
      toast.success("Hero template saved");
    } catch {
      toast.error("Failed to save hero template");
    } finally {
      setSavingHero(false);
    }
  };

  const uploadHeroImage = async (file: File, index: number) => {
    try {
      setUploadingHeroImage(index);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "hero");
      const { data } = await api.post("/admin/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imgs = [...(heroForm.images ?? [])];
      imgs[index] = data.url;
      setHeroForm((p) => ({ ...p, images: imgs }));
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingHeroImage(null);
    }
  };

  const uploadHeroBgImage = async (file: File) => {
    try {
      setUploadingBgImage(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "hero");
      const { data } = await api.post("/admin/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setHeroForm((p) => ({ ...p, bgImage: data.url }));
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingBgImage(false);
    }
  };

  const removeHeroImage = (index: number) => {
    const imgs = [...(heroForm.images ?? [])];
    imgs[index] = "";
    setHeroForm((p) => ({ ...p, images: imgs }));
  };

  // â”€â”€ Footer Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleFooterTemplateSelect = async (templateNum: number) => {
    const updated = { ...footerConfig, activeTemplate: templateNum as 1 | 2 | 3 };
    setFooterConfig(updated);
    try {
      await api.put("/admin/homepage-config/footer", updated);
      toast.success(`Footer template ${templateNum} activated`);
    } catch {
      toast.error("Failed to update footer template");
    }
  };

  const openFooterEdit = (templateKey: string) => {
    setFooterForm({ ...(footerConfig.templates[templateKey] ?? DEFAULT_FOOTER.templates["1"]) });
    setEditingFooterTemplate(templateKey);
  };

  const saveFooterTemplate = async () => {
    if (!editingFooterTemplate) return;
    const updated: FooterConfig = {
      ...footerConfig,
      templates: { ...footerConfig.templates, [editingFooterTemplate]: footerForm },
    };
    try {
      setSavingFooter(true);
      await api.put("/admin/homepage-config/footer", updated);
      setFooterConfig(updated);
      setEditingFooterTemplate(null);
      toast.success("Footer template saved");
    } catch {
      toast.error("Failed to save footer template");
    } finally {
      setSavingFooter(false);
    }
  };

  // â”€â”€ Featured â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleFeaturedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFeaturedPage(1);
    fetchFeaturedProducts(featuredSearch, 1);
  };

  const handleToggleFeatured = async (product: FeaturedProduct) => {
    try {
      setTogglingId(product.id);
      const { data } = await api.patch(`/home-banners/featured-products/${product.id}/toggle`);
      setFeaturedProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...data } : p)));
      toast.success(data.isFeatured ? "Added to Featured Collections" : "Removed from Featured Collections");
    } catch {
      toast.error("Failed to update featured status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveOrder = async (product: FeaturedProduct) => {
    const parsed = parseInt(orderInput);
    if (isNaN(parsed)) { toast.error("Order must be a number"); return; }
    try {
      const { data } = await api.patch(`/home-banners/featured-products/${product.id}/order`, { order: parsed });
      setFeaturedProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...data } : p)));
      setOrderEditId(null);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  const filtered = (activeTab === "DISCOUNT_PANEL" || activeTab === "CAROUSEL_ITEM" || activeTab === "PROMO_BANNER")
    ? banners.filter((b) => b.type === activeTab)
    : [];

  // â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openHeaderEdit = (section: "DISCOUNT" | "CAROUSEL" | "FEATURED" | "PROMO") => {
    const current =
      section === "DISCOUNT" ? discountSection
      : section === "CAROUSEL" ? carouselSection
      : section === "PROMO" ? promoSection
      : featuredSection;
    setSectionForm({ title: current.title, subtitle: current.subtitle });
    setEditingSection(section);
  };

  const saveHeader = async () => {
    if (!editingSection) return;
    try {
      setSavingSection(true);
      const endpoint =
        editingSection === "DISCOUNT" ? "/home-banners/discount-header"
        : editingSection === "CAROUSEL" ? "/home-banners/carousel-header"
        : editingSection === "PROMO" ? "/home-banners/promo-header"
        : "/home-banners/featured-header";
      await api.put(endpoint, sectionForm);
      if (editingSection === "DISCOUNT") setDiscountSection({ ...sectionForm });
      else if (editingSection === "CAROUSEL") setCarouselSection({ ...sectionForm });
      else if (editingSection === "PROMO") setPromoSection({ ...sectionForm });
      else setFeaturedSection({ ...sectionForm });
      setEditingSection(null);
      toast.success("Header updated");
    } catch {
      toast.error("Failed to update header");
    } finally {
      setSavingSection(false);
    }
  };

  // â”€â”€ Banner form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openCreate = () => {
    setEditBanner(null);
    const bannerType: BannerType =
      activeTab === "DISCOUNT_PANEL" || activeTab === "CAROUSEL_ITEM" || activeTab === "PROMO_BANNER"
        ? activeTab : "DISCOUNT_PANEL";
    setForm({ ...emptyForm, type: bannerType });
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (banner: HomeBanner) => {
    setEditBanner(banner);
    setForm({
      type: banner.type,
      title: banner.title,
      discount: banner.discount ?? "",
      description: banner.description ?? "",
      sortOrder: String(banner.sortOrder),
      isActive: banner.isActive,
    });
    setImageFile(null);
    setImagePreview(banner.image);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBanner && !imageFile) { toast.error("Please select an image"); return; }
    const fd = new FormData();
    fd.append("type", form.type);
    fd.append("title", form.title);
    fd.append("discount", form.discount);
    fd.append("description", form.description);
    fd.append("sortOrder", form.sortOrder);
    fd.append("isActive", String(form.isActive));
    if (imageFile) fd.append("image", imageFile);
    try {
      setSaving(true);
      if (editBanner) {
        await api.put(`/home-banners/${editBanner.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Banner updated");
      } else {
        await api.post("/home-banners", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Banner created");
      }
      setShowModal(false);
      fetchBanners();
    } catch {
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await api.delete(`/home-banners/${id}`);
      toast.success("Banner deleted");
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (banner: HomeBanner) => {
    try {
      const { data } = await api.patch(`/home-banners/${banner.id}/toggle`);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? data : b)));
    } catch {
      toast.error("Failed to toggle banner");
    }
  };

  // â”€â”€ Tab definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "ANNOUNCEMENT", label: "Announcement Bar", icon: <SpeakerWaveIcon className="w-4 h-4" /> },
    { key: "HERO", label: "Hero Section", icon: <HeroPhotoIcon className="w-4 h-4" /> },
    { key: "PROMO_BANNER", label: "Banner Carousel", icon: <RectangleStackIcon className="w-4 h-4" /> },
    { key: "DISCOUNT_PANEL", label: "Discount Panels", icon: null },
    { key: "CAROUSEL_ITEM", label: "Curated Carousel", icon: null },
    { key: "FEATURED", label: "Featured Collections", icon: null },
    { key: "FOOTER", label: "Footer Section", icon: <Squares2X2Icon className="w-4 h-4" /> },
  ];

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Homepage Manager</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage every section of the customer-facing homepage â€” announcement bar, hero, banners, and footer.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* â”€â”€ ANNOUNCEMENT TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "ANNOUNCEMENT" && (
        <div className="max-w-2xl">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-amber-900 text-sm mb-1 flex items-center gap-2">
              <SpeakerWaveIcon className="w-4 h-4" />
              Announcement Bar
            </h3>
            <p className="text-xs text-amber-700">
              This scrolling bar appears at the very top of the home page. Separate multiple messages with <code className="bg-amber-100 px-1 rounded">|</code> (pipe character).
            </p>
          </div>

          {/* Live preview */}
          <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5 bg-gray-50 border-b border-gray-200">Preview</p>
            <div className="bg-gray-900 text-white py-2.5 px-4 overflow-hidden">
              <div className="flex gap-8 text-xs font-medium tracking-widest uppercase whitespace-nowrap">
                {announcementText
                  .split("|")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-3">
                      <span className="text-yellow-400">âœ¦</span>
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Announcement Messages <span className="font-normal text-gray-400">(pipe-separated)</span>
              </label>
              <textarea
                rows={4}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"
                placeholder="100% authentic products | Free shipping on orders above â‚¹999 | New arrivals every week"
              />
              <p className="text-xs text-gray-400 mt-1">
                Each entry separated by <code>|</code> becomes a separate message in the scrolling bar.
              </p>
            </div>

            <button
              onClick={saveAnnouncement}
              disabled={savingAnnouncement}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingAnnouncement ? "Savingâ€¦" : "Save Announcement"}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ HERO TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "HERO" && (
        <div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-indigo-700 font-medium">
              Choose one of 4 modern hero section templates. Edit each template's content independently. The <span className="font-bold">active</span> template is shown on the live homepage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {["1", "2", "3", "4"].map((key) => {
              const label = HERO_TEMPLATE_LABELS[key];
              const isActive = String(heroConfig.activeTemplate) === key;
              const isEditing = editingHeroTemplate === key;
              return (
                <div
                  key={key}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    isActive ? "border-indigo-500 shadow-md shadow-indigo-100" : "border-gray-200"
                  }`}
                >
                  {/* Template preview strip */}
                  <div className={`h-24 flex items-center justify-center text-xs font-bold text-white tracking-wider uppercase ${
                    key === "1" ? "bg-gradient-to-r from-gray-100 to-indigo-100 text-gray-700"
                    : key === "2" ? "bg-gradient-to-r from-gray-900 to-gray-700"
                    : key === "3" ? "bg-gradient-to-r from-indigo-950 to-slate-900"
                    : "bg-gradient-to-r from-rose-50 to-purple-100 text-gray-900"
                  }`}>
                    <div className="text-center px-3">
                      <p className={`text-base font-black tracking-tight mb-1 ${key === "2" || key === "3" ? "text-white" : "text-gray-900"}`}>
                        {label.name}
                      </p>
                      <p className={`text-[10px] font-normal ${key === "2" || key === "3" ? "text-white/60" : "text-gray-500"}`}>
                        Template {key}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <p className="text-xs text-gray-500 mb-3 leading-snug">{label.desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHeroTemplateSelect(Number(key))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 cursor-default"
                            : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {isActive ? "Active" : "Set Active"}
                      </button>
                      <button
                        onClick={() => isEditing ? setEditingHeroTemplate(null) : openHeroEdit(key)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Headline</label>
                        <input
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={heroForm.title}
                          onChange={(e) => setHeroForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Hero headline"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Subtitle / Description</label>
                        <textarea
                          rows={2}
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          value={heroForm.subtitle}
                          onChange={(e) => setHeroForm((p) => ({ ...p, subtitle: e.target.value }))}
                          placeholder="Supporting text below the headline"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">CTA Button Text</label>
                          <input
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={heroForm.ctaText}
                            onChange={(e) => setHeroForm((p) => ({ ...p, ctaText: e.target.value }))}
                            placeholder="Shop Now"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">CTA Link</label>
                          <input
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={heroForm.ctaLink}
                            onChange={(e) => setHeroForm((p) => ({ ...p, ctaLink: e.target.value }))}
                            placeholder="/products"
                          />
                        </div>
                      </div>
                      {key === "1" && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Hero Images <span className="font-normal text-gray-400">(9 slots — fills the 3×3 image grid)</span>
                          </label>
                          <p className="text-[11px] text-gray-400 mb-2">Leave empty to use built-in sample images.</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 9 }).map((_, i) => {
                              const imgUrl = heroForm.images?.[i] ?? "";
                              const uploading = uploadingHeroImage === i;
                              return (
                                <label key={i} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors bg-gray-50 flex items-center justify-center group">
                                  {imgUrl ? (
                                    <>
                                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-[9px] font-bold">Replace</span>
                                      </div>
                                      <button type="button" onClick={(e) => { e.preventDefault(); removeHeroImage(i); }} className="absolute top-0.5 right-0.5 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center z-10 leading-none">×</button>
                                    </>
                                  ) : uploading ? (
                                    <span className="text-[9px] text-indigo-400 font-medium">Uploading…</span>
                                  ) : (
                                    <div className="text-center">
                                      <PhotoIcon className="w-4 h-4 text-gray-300 mx-auto" />
                                      <span className="text-[9px] text-gray-400 mt-0.5 block">{i + 1}</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroImage(f, i); e.target.value = ""; }} />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {key === "2" && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Background Image <span className="font-normal text-gray-400">(leave blank for default)</span></label>
                          <div className="mt-1 flex gap-2">
                            <input
                              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={heroForm.bgImage ?? ""}
                              onChange={(e) => setHeroForm((p) => ({ ...p, bgImage: e.target.value }))}
                              placeholder="https://..."
                            />
                            <label className="flex-none cursor-pointer flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white whitespace-nowrap">
                              <PhotoIcon className="w-3.5 h-3.5" />
                              {uploadingBgImage ? "…" : "Upload"}
                              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroBgImage(f); e.target.value = ""; }} />
                            </label>
                          </div>
                          {heroForm.bgImage && (
                            <div className="mt-2 h-20 rounded-lg overflow-hidden border border-gray-200">
                              <img src={heroForm.bgImage} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}
                      {key === "3" && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Accent Label <span className="font-normal text-gray-400">(small text above headline)</span></label>
                            <input
                              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={heroForm.accentText ?? ""}
                              onChange={(e) => setHeroForm((p) => ({ ...p, accentText: e.target.value }))}
                              placeholder="New Season"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Collage Images <span className="font-normal text-gray-400">(4 slots — first spans full width)</span>
                            </label>
                            <p className="text-[11px] text-gray-400 mb-2">Leave empty to use built-in sample images.</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {Array.from({ length: 4 }).map((_, i) => {
                                const imgUrl = heroForm.images?.[i] ?? "";
                                const uploading = uploadingHeroImage === i;
                                return (
                                  <label key={i} className={`relative overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors bg-gray-50 flex items-center justify-center group rounded-lg ${i === 0 ? "col-span-2" : ""}`} style={{ aspectRatio: i === 0 ? "3/1" : "1/1" }}>
                                    {imgUrl ? (
                                      <>
                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-white text-[9px] font-bold">Replace</span>
                                        </div>
                                        <button type="button" onClick={(e) => { e.preventDefault(); removeHeroImage(i); }} className="absolute top-0.5 right-0.5 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center z-10 leading-none">×</button>
                                      </>
                                    ) : uploading ? (
                                      <span className="text-[9px] text-indigo-400 font-medium">Uploading…</span>
                                    ) : (
                                      <div className="text-center">
                                        <PhotoIcon className="w-4 h-4 text-gray-300 mx-auto" />
                                        <span className="text-[9px] text-gray-400 mt-0.5 block">{i === 0 ? "Wide image" : `Slot ${i + 1}`}</span>
                                      </div>
                                    )}
                                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroImage(f, i); e.target.value = ""; }} />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                      {key === "4" && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Accent Label <span className="font-normal text-gray-400">(small text above headline)</span></label>
                            <input
                              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={heroForm.accentText ?? ""}
                              onChange={(e) => setHeroForm((p) => ({ ...p, accentText: e.target.value }))}
                              placeholder="Trendy Collections"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Highlighted Word</label>
                            <input
                              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={heroForm.highlightText ?? ""}
                              onChange={(e) => setHeroForm((p) => ({ ...p, highlightText: e.target.value }))}
                              placeholder="Create"
                            />
                            <p className="text-[11px] text-gray-400 mt-0.5">This exact word in the title will be rendered in rose/pink color.</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Product / Model Image <span className="font-normal text-gray-400">(leave blank for default)</span></label>
                            <div className="mt-1 flex gap-2">
                              <input
                                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                value={heroForm.bgImage ?? ""}
                                onChange={(e) => setHeroForm((p) => ({ ...p, bgImage: e.target.value }))}
                                placeholder="https://..."
                              />
                              <label className="flex-none cursor-pointer flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white whitespace-nowrap">
                                <PhotoIcon className="w-3.5 h-3.5" />
                                {uploadingBgImage ? "…" : "Upload"}
                                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroBgImage(f); e.target.value = ""; }} />
                              </label>
                            </div>
                            {heroForm.bgImage && (
                              <div className="mt-2 h-20 rounded-lg overflow-hidden border border-gray-200">
                                <img src={heroForm.bgImage} alt="" className="w-full h-full object-contain" />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Floating Badge Text <span className="font-normal text-gray-400">(optional)</span></label>
                            <textarea
                              rows={2}
                              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"
                              value={heroForm.badgeText ?? ""}
                              onChange={(e) => setHeroForm((p) => ({ ...p, badgeText: e.target.value }))}
                              placeholder={"25%\nDiscount on Everything"}
                            />
                            <p className="text-[11px] text-gray-400 mt-0.5">First line = big text (e.g. &quot;25%&quot;), second line = subtitle. Leave blank to hide the badge.</p>
                          </div>
                        </>
                      )}
                      <button
                        onClick={saveHeroTemplate}
                        disabled={savingHero}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingHero ? "Saving..." : "Save Template"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€ FOOTER TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "FOOTER" && (
        <div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-700 font-medium">
              Choose one of 3 footer templates. The active template renders on every page. Each template's content (tagline, etc.) can be edited independently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["1", "2", "3"].map((key) => {
              const label = FOOTER_TEMPLATE_LABELS[key];
              const isActive = String(footerConfig.activeTemplate) === key;
              const isEditing = editingFooterTemplate === key;
              return (
                <div
                  key={key}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    isActive ? "border-indigo-500 shadow-md shadow-indigo-100" : "border-gray-200"
                  }`}
                >
                  {/* Preview strip */}
                  <div className={`h-24 flex items-center justify-center ${
                    key === "1" ? "bg-[#0a0a0a]"
                    : key === "2" ? "bg-gray-50 border-b border-gray-200"
                    : "bg-gradient-to-br from-indigo-950 via-slate-900 to-gray-950"
                  }`}>
                    <div className="text-center">
                      <p className={`text-base font-black tracking-tight mb-0.5 ${key === "2" ? "text-gray-900" : "text-white"}`}>
                        {label.name}
                      </p>
                      <p className={`text-[10px] ${key === "2" ? "text-gray-400" : "text-white/50"}`}>
                        Template {key}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <p className="text-xs text-gray-500 mb-3 leading-snug">{label.desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFooterTemplateSelect(Number(key))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 cursor-default"
                            : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {isActive ? "Active" : "Set Active"}
                      </button>
                      <button
                        onClick={() => isEditing ? setEditingFooterTemplate(null) : openFooterEdit(key)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Tagline / Description</label>
                        <textarea
                          rows={3}
                          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          value={footerForm.tagline}
                          onChange={(e) => setFooterForm((p) => ({ ...p, tagline: e.target.value }))}
                          placeholder="Short brand description shown in the footer"
                        />
                      </div>
                      {key === "3" && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Newsletter Section Title</label>
                          <input
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={footerForm.newsletterTitle ?? ""}
                            onChange={(e) => setFooterForm((p) => ({ ...p, newsletterTitle: e.target.value }))}
                            placeholder="Stay in the loop"
                          />
                        </div>
                      )}
                      <button
                        onClick={saveFooterTemplate}
                        disabled={savingFooter}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingFooter ? "Savingâ€¦" : "Save Template"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* â”€â”€ BANNER TABS (DISCOUNT / CAROUSEL / PROMO) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(activeTab === "DISCOUNT_PANEL" || activeTab === "CAROUSEL_ITEM" || activeTab === "PROMO_BANNER") && (
        <>
          {/* Section header editor */}
          {(() => {
            const sectionKey: "DISCOUNT" | "CAROUSEL" | "PROMO" =
              activeTab === "DISCOUNT_PANEL" ? "DISCOUNT"
              : activeTab === "CAROUSEL_ITEM" ? "CAROUSEL"
              : "PROMO";
            const current =
              sectionKey === "DISCOUNT" ? discountSection
              : sectionKey === "CAROUSEL" ? carouselSection
              : promoSection;
            const isEditing = editingSection === sectionKey;
            return (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Section Title</label>
                          <input
                            className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={sectionForm.title}
                            onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Subtitle</label>
                          <input
                            className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={sectionForm.subtitle}
                            onChange={(e) => setSectionForm((p) => ({ ...p, subtitle: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveHeader} disabled={savingSection} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                            {savingSection ? "Savingâ€¦" : "Save"}
                          </button>
                          <button onClick={() => setEditingSection(null)} className="px-4 py-1.5 text-gray-600 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Section Header</p>
                        <p className="text-lg font-bold text-gray-900">{current.title}</p>
                        {current.subtitle && <p className="text-sm text-gray-500">{current.subtitle}</p>}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <button onClick={() => openHeaderEdit(sectionKey)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      <PencilSquareIcon className="w-4 h-4" />Edit Header
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Action bar */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
              {filtered.filter((b) => !b.isActive).length > 0 && (
                <span className="text-gray-400"> ({filtered.filter((b) => !b.isActive).length} hidden)</span>
              )}
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add {activeTab === "DISCOUNT_PANEL" ? "Discount Panel" : activeTab === "CAROUSEL_ITEM" ? "Carousel Item" : "Promo Banner"}
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loadingâ€¦</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No items yet. Click "Add" to create one.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((banner) => (
                <div
                  key={banner.id}
                  className={`relative rounded-xl overflow-hidden border shadow-sm group transition-all ${
                    banner.isActive ? "border-gray-200" : "border-gray-300 opacity-60"
                  }`}
                >
                  <div className="relative h-52 bg-gray-100">
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowsUpDownIcon className="w-3 h-3" />{banner.sortOrder}
                    </span>
                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${banner.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {banner.isActive ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                      {banner.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="font-semibold text-gray-900 text-sm truncate">{banner.title}</p>
                    {banner.discount && <p className="text-indigo-600 font-bold text-sm">{banner.discount}</p>}
                    {banner.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{banner.description}</p>}
                  </div>
                  <div className="flex border-t border-gray-100">
                    <button onClick={() => handleToggle(banner)} className="flex-1 py-2 text-xs text-gray-500 hover:bg-gray-50 font-medium">
                      {banner.isActive ? "Hide" : "Show"}
                    </button>
                    <button onClick={() => openEdit(banner)} className="flex-1 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-medium flex items-center justify-center gap-1">
                      <PencilSquareIcon className="w-3.5 h-3.5" />Edit
                    </button>
                    <button onClick={() => handleDelete(banner.id)} disabled={deletingId === banner.id} className="flex-1 py-2 text-xs text-red-500 hover:bg-red-50 font-medium flex items-center justify-center gap-1">
                      <TrashIcon className="w-3.5 h-3.5" />{deletingId === banner.id ? "â€¦" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* â”€â”€ FEATURED TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "FEATURED" && (
        <div className="space-y-4">
          {/* Section header */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editingSection === "FEATURED" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Section Title</label>
                      <input className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={sectionForm.title} onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Subtitle</label>
                      <input className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={sectionForm.subtitle} onChange={(e) => setSectionForm((p) => ({ ...p, subtitle: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveHeader} disabled={savingSection} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{savingSection ? "Savingâ€¦" : "Save"}</button>
                      <button onClick={() => setEditingSection(null)} className="px-4 py-1.5 text-gray-600 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Section Header</p>
                    <p className="text-lg font-bold text-gray-900">{featuredSection.title}</p>
                    {featuredSection.subtitle && <p className="text-sm text-gray-500">{featuredSection.subtitle}</p>}
                  </>
                )}
              </div>
              {editingSection !== "FEATURED" && (
                <button onClick={() => openHeaderEdit("FEATURED")} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <PencilSquareIcon className="w-4 h-4" />Edit Header
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleFeaturedSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={featuredSearch}
                onChange={(e) => setFeaturedSearch(e.target.value)}
                placeholder="Search products by nameâ€¦"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Search</button>
            {featuredSearch && (
              <button type="button" onClick={() => { setFeaturedSearch(""); setFeaturedPage(1); fetchFeaturedProducts("", 1); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">Clear</button>
            )}
          </form>

          <p className="text-xs text-gray-500">Toggle the star to add or remove a product from Featured Collections. Use the order field to control display order (lower = shown first).</p>

          {featuredLoading ? (
            <div className="text-center py-16 text-gray-400">Loading productsâ€¦</div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No products found.</div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-center">Featured</th>
                    <th className="px-4 py-3 text-center">Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {featuredProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.isFeatured ? "bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <PhotoIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                            <p className="text-gray-400 text-xs">{product.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{product.category?.name ?? "â€”"}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">â‚¹{product.price.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleFeatured(product)}
                          title={product.isFeatured ? "Remove from Featured" : "Add to Featured"}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${product.isFeatured ? "bg-amber-100 text-amber-500 hover:bg-amber-200" : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-400"} disabled:opacity-50`}
                        >
                          {product.isFeatured ? <StarSolidIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.isFeatured ? (
                          orderEditId === product.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" className="w-14 border border-indigo-300 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" value={orderInput} onChange={(e) => setOrderInput(e.target.value)} autoFocus />
                              <button onClick={() => handleSaveOrder(product)} className="text-xs text-indigo-600 hover:underline font-medium">Save</button>
                              <button onClick={() => setOrderEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">âœ•</button>
                            </div>
                          ) : (
                            <button onClick={() => { setOrderEditId(product.id); setOrderInput(String(product.featuredOrder ?? 0)); }} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                              <ArrowsUpDownIcon className="w-3.5 h-3.5" />{product.featuredOrder ?? "â€”"}
                            </button>
                          )
                        ) : (
                          <span className="text-gray-300 text-xs">â€”</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {featuredTotalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button disabled={featuredPage <= 1} onClick={() => { const p = featuredPage - 1; setFeaturedPage(p); fetchFeaturedProducts(featuredSearch, p); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">â† Prev</button>
              <span className="text-sm text-gray-500">Page {featuredPage} of {featuredTotalPages}</span>
              <button disabled={featuredPage >= featuredTotalPages} onClick={() => { const p = featuredPage + 1; setFeaturedPage(p); fetchFeaturedProducts(featuredSearch, p); }} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next â†’</button>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ BANNER MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editBanner ? "Edit" : "Add"}{" "}
                {form.type === "DISCOUNT_PANEL" ? "Discount Panel" : form.type === "CAROUSEL_ITEM" ? "Carousel Item" : "Promo Banner"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image {editBanner && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-44 cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <PhotoIcon className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-400 mt-2">Click to upload</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Panel title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>

              {/* Discount (DISCOUNT_PANEL only) */}
              {form.type === "DISCOUNT_PANEL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Label</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. 20% OFF" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} />
                </div>
              )}

              {/* Description (DISCOUNT_PANEL + PROMO_BANNER) */}
              {(form.type === "DISCOUNT_PANEL" || form.type === "PROMO_BANNER") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="Short description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
              )}

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-0.5">Lower numbers appear first.</p>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                <span className="text-sm text-gray-700">Show on home page (active)</span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? "Savingâ€¦" : editBanner ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

