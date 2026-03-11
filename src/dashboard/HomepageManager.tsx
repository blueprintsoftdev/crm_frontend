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
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

type BannerType = "DISCOUNT_PANEL" | "CAROUSEL_ITEM";
type Tab = BannerType | "FEATURED";

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

// ─── Empty form defaults ──────────────────────────────────────────────────────

const emptyForm = {
  type: "DISCOUNT_PANEL" as BannerType,
  title: "",
  discount: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomepageManager() {
  const [activeTab, setActiveTab] = useState<Tab>("DISCOUNT_PANEL");

  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [discountSection, setDiscountSection] = useState<SectionHeader>({
    title: "SHOP NOW AND SAVE 30%",
    subtitle: "Grace at a Great Price! Sarees on Discount",
  });
  const [carouselSection, setCarouselSection] = useState<SectionHeader>({
    title: "Curated Looks For You",
    subtitle: "",
  });
  const [featuredSection, setFeaturedSection] = useState<SectionHeader>({
    title: "Featured Collections",
    subtitle: "",
  });
  const [loading, setLoading] = useState(true);

  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [featuredPage, setFeaturedPage] = useState(1);
  const [featuredTotalPages, setFeaturedTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [orderEditId, setOrderEditId] = useState<string | null>(null);
  const [orderInput, setOrderInput] = useState("");

  // Header edit state
  const [editingSection, setEditingSection] = useState<"DISCOUNT" | "CAROUSEL" | "FEATURED" | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", subtitle: "" });
  const [savingSection, setSavingSection] = useState(false);

  // Banner form state
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<HomeBanner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/home-banners/admin");
      setBanners(data.banners);
      setDiscountSection(data.discountSection);
      if (data.carouselSection) setCarouselSection(data.carouselSection);
      if (data.featuredSection) setFeaturedSection(data.featuredSection);
    } catch {
      toast.error("Failed to load homepage banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

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

  const filtered = activeTab !== "FEATURED" ? banners.filter((b) => b.type === activeTab) : [];

  // ── Header ─────────────────────────────────────────────────────────────────

  const openHeaderEdit = (section: "DISCOUNT" | "CAROUSEL" | "FEATURED") => {
    const current =
      section === "DISCOUNT" ? discountSection
      : section === "CAROUSEL" ? carouselSection
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
        : "/home-banners/featured-header";
      await api.put(endpoint, sectionForm);
      if (editingSection === "DISCOUNT") setDiscountSection({ ...sectionForm });
      else if (editingSection === "CAROUSEL") setCarouselSection({ ...sectionForm });
      else setFeaturedSection({ ...sectionForm });
      setEditingSection(null);
      toast.success("Header updated");
    } catch {
      toast.error("Failed to update header");
    } finally {
      setSavingSection(false);
    }
  };

  // ── Banner form ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditBanner(null);
    const bannerType: BannerType = activeTab !== "FEATURED" ? activeTab : "DISCOUNT_PANEL";
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
    if (!editBanner && !imageFile) {
      toast.error("Please select an image");
      return;
    }

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
        await api.put(`/home-banners/${editBanner.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Banner updated");
      } else {
        await api.post("/home-banners", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Homepage Manager</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage the discount/offer section, curated looks carousel, and featured collections shown on the home page.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {(["DISCOUNT_PANEL", "CAROUSEL_ITEM", "FEATURED"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "DISCOUNT_PANEL" ? "Discount / Offer Panels"
              : tab === "CAROUSEL_ITEM" ? "Carousel Panels"
              : "Featured Collections"}
          </button>
        ))}
      </div>

      {/* Section header editor — shown for all three tabs */}
      {(() => {
        const sectionKey: "DISCOUNT" | "CAROUSEL" | "FEATURED" =
          activeTab === "DISCOUNT_PANEL" ? "DISCOUNT"
          : activeTab === "CAROUSEL_ITEM" ? "CAROUSEL"
          : "FEATURED";
        const current =
          sectionKey === "DISCOUNT" ? discountSection
          : sectionKey === "CAROUSEL" ? carouselSection
          : featuredSection;
        const isEditing = editingSection === sectionKey;
        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                        Section Title
                      </label>
                      <input
                        className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={sectionForm.title}
                        onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. SHOP NOW AND SAVE 30%"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                        Subtitle
                      </label>
                      <input
                        className="mt-1 w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={sectionForm.subtitle}
                        onChange={(e) => setSectionForm((p) => ({ ...p, subtitle: e.target.value }))}
                        placeholder="Optional tagline shown below the title"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveHeader}
                        disabled={savingSection}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingSection ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-1.5 text-gray-600 rounded-lg text-sm hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
                      Section Header
                    </p>
                    <p className="text-lg font-bold text-gray-900">{current.title}</p>
                    {current.subtitle && <p className="text-sm text-gray-500">{current.subtitle}</p>}
                  </>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => openHeaderEdit(sectionKey)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit Header
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Featured Collections tab — full product picker */}
      {activeTab === "FEATURED" && (
        <div className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleFeaturedSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={featuredSearch}
                onChange={(e) => setFeaturedSearch(e.target.value)}
                placeholder="Search products by name…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              Search
            </button>
            {featuredSearch && (
              <button
                type="button"
                onClick={() => { setFeaturedSearch(""); setFeaturedPage(1); fetchFeaturedProducts("", 1); }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear
              </button>
            )}
          </form>

          <p className="text-xs text-gray-500">
            Toggle the star to add or remove a product from the Featured Collections section on the homepage.
            Use the order field to control display order (lower = shown first).
          </p>

          {/* Product list */}
          {featuredLoading ? (
            <div className="text-center py-16 text-gray-400">Loading products…</div>
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
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors ${product.isFeatured ? "bg-amber-50/40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
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
                      <td className="px-4 py-3 text-gray-500">{product.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleFeatured(product)}
                          title={product.isFeatured ? "Remove from Featured" : "Add to Featured"}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            product.isFeatured
                              ? "bg-amber-100 text-amber-500 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-400"
                          } disabled:opacity-50`}
                        >
                          {product.isFeatured ? (
                            <StarSolidIcon className="w-5 h-5" />
                          ) : (
                            <StarIcon className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.isFeatured ? (
                          orderEditId === product.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                className="w-14 border border-indigo-300 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                value={orderInput}
                                onChange={(e) => setOrderInput(e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveOrder(product)}
                                className="text-xs text-indigo-600 hover:underline font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setOrderEditId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setOrderEditId(product.id); setOrderInput(String(product.featuredOrder ?? 0)); }}
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
                              title="Set display order"
                            >
                              <ArrowsUpDownIcon className="w-3.5 h-3.5" />
                              {product.featuredOrder ?? "—"}
                            </button>
                          )
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {featuredTotalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                disabled={featuredPage <= 1}
                onClick={() => { const p = featuredPage - 1; setFeaturedPage(p); fetchFeaturedProducts(featuredSearch, p); }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {featuredPage} of {featuredTotalPages}</span>
              <button
                disabled={featuredPage >= featuredTotalPages}
                onClick={() => { const p = featuredPage + 1; setFeaturedPage(p); fetchFeaturedProducts(featuredSearch, p); }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      {activeTab !== "FEATURED" && (
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
          {filtered.filter((b) => b.isActive).length !== filtered.length && (
            <span className="text-gray-400">
              {" "}({filtered.filter((b) => !b.isActive).length} hidden)
            </span>
          )}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />
          Add{" "}
          {activeTab === "DISCOUNT_PANEL" ? "Discount Panel" : "Carousel Item"}
        </button>
      </div>
      )}

      {/* Grid */}
      {activeTab !== "FEATURED" && (
        <>
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No items yet. Click "Add" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((banner) => (
                <div
                  key={banner.id}
                  className={`relative rounded-xl overflow-hidden border shadow-sm group transition-all ${
                    banner.isActive ? "border-gray-200" : "border-gray-300 opacity-60"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-52 bg-gray-100">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Sort order badge */}
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowsUpDownIcon className="w-3 h-3" />
                      {banner.sortOrder}
                    </span>
                    {/* Active badge */}
                    <span
                      className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {banner.isActive ? (
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      ) : (
                        <XCircleIcon className="w-3.5 h-3.5" />
                      )}
                      {banner.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-3 bg-white">
                    <p className="font-semibold text-gray-900 text-sm truncate">{banner.title}</p>
                    {banner.discount && (
                      <p className="text-indigo-600 font-bold text-sm">{banner.discount}</p>
                    )}
                    {banner.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{banner.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => handleToggle(banner)}
                      title={banner.isActive ? "Hide" : "Show"}
                      className="flex-1 py-2 text-xs text-gray-500 hover:bg-gray-50 font-medium"
                    >
                      {banner.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => openEdit(banner)}
                      className="flex-1 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-medium flex items-center justify-center gap-1"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={deletingId === banner.id}
                      className="flex-1 py-2 text-xs text-red-500 hover:bg-red-50 font-medium flex items-center justify-center gap-1"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      {deletingId === banner.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editBanner ? "Edit" : "Add"}{" "}
                {form.type === "DISCOUNT_PANEL" ? "Discount Panel" : "Carousel Item"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image{" "}
                  {editBanner && (
                    <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  )}
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-44 cursor-pointer hover:border-indigo-400 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <>
                      <PhotoIcon className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-400 mt-2">Click to upload</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder={
                    form.type === "DISCOUNT_PANEL"
                      ? "e.g. Women's Collection"
                      : "e.g. Classic Look"
                  }
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Discount (DISCOUNT_PANEL only) */}
              {form.type === "DISCOUNT_PANEL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Label
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. 20% OFF"
                    value={form.discount}
                    onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
                  />
                </div>
              )}

              {/* Description (DISCOUNT_PANEL only) */}
              {form.type === "DISCOUNT_PANEL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    placeholder="Short description shown on the panel overlay"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              )}

              {/* Sort order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">Lower numbers appear first.</p>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-indigo-600"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Show on home page (active)</span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editBanner ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
