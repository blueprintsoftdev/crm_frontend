import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrash, FaSearch, FaTag, FaBoxOpen, FaInfoCircle, FaTimes, FaEllipsisV, FaImage } from "react-icons/fa";
import { domainUrl } from "../utils/constant";
// Import Heroicons for the product card look
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from "../utils/api";
import { Upload } from "lucide-react";
import toast, { Toaster, } from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions } from "../context/StaffPermissionContext";



// SAME FILE – ListProducts.jsx
const LoaderSpinner = ({ size = "sm", color = "white" }: { size?: "sm" | "md"; color?: "white" | "slate" }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  const colors = {
    white: "text-white",
    slate: "text-slate-600",
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
};



interface CategoryAttr {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  values: { id: string; value: string }[];
}

interface ProductAttrValue {
  id: string;
  attributeId: string;
  attributeValueId: string | null;
  textValue: string | null;
  attribute: { id: string; name: string; type: string };
  attributeValue: { id: string; value: string } | null;
}

interface ListProduct {
  id: string;
  name: string;
  code?: string;
  description?: string;
  purchasePrice?: number | null;
  price?: number;
  stock?: number;
  sizes?: string[];
  discount?: number;
  image?: string;
  images?: string[];
  category?: { id?: string; name?: string; code?: string } | string;
  attributeValues?: ProductAttrValue[];
  createdAt?: string;
  updatedAt?: string;
}

interface ListCategoryItem {
  id: string;
  name: string;
  code?: string;
}

interface ProductFormData {
  categoryCode: string;
  productCode: string;
  productName: string;
  description: string;
  purchasePrice: number | string;
  price: number | string;
  stock: number | string;
  discount: number | string;
  image: File | null;
  additionalImages: File[];
  removeImages: string[];
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

// Color Palette
const colors = {
  primary: "#2D5A27", // Dark green - Main brand color
  secondary: "#4A7C59", // Medium green
  accent: "#8FB996", // Light green
  light: "#C8D5B9", // Very light green
  background: "#F5F9F4", // Off-white background
  text: "#1A1F16", // Dark text
  textLight: "#5A6D57", // Light text
  danger: "#D32F2F", // Red for delete
  warning: "#FF9800", // Orange for warnings
  border: "#E0E0E0", // Light border
};

// --- Custom Components for Modals & Model (Dropdown) ---

/**  Generic Modal Component - Updated Design */
const Modal = ({ title, children, isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 transition-opacity duration-300 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-slideUp relative">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**  Custom Model Dropdown Component (Replaces direct icons) */
const ActionModel = ({ onEdit, onDelete, canEdit = true, canDelete = true }: { onEdit: () => void; onDelete: () => void; canEdit?: boolean; canDelete?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (isOpen && !(event.target as HTMLElement).closest('.action-model-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div className="relative action-model-container">
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-pointer"
                title="Product Actions"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right animate-fadeIn ring-1 ring-gray-100 overflow-hidden">
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); setIsOpen(false); }}
                        disabled={!canEdit}
                        className={`w-full text-left flex items-center px-4 py-3 text-sm transition-all duration-200 border-b border-gray-100 ${
                          canEdit ? 'text-gray-700 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                    >
                        <PencilSquareIcon className={`w-4 h-4 mr-3 ${canEdit ? 'text-blue-600' : 'text-gray-300'}`} /> 
                        <span className="font-medium">{canEdit ? 'Edit Product' : 'No Edit Permission'}</span>
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); setIsOpen(false); }}
                        disabled={!canDelete}
                        className={`w-full text-left flex items-center px-4 py-3 text-sm transition-all duration-200 ${
                          canDelete ? 'text-gray-700 hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                    >
                        <TrashIcon className={`w-4 h-4 mr-3 ${canDelete ? 'text-red-600' : 'text-gray-300'}`} /> 
                        <span className="font-medium">{canDelete ? 'Delete Product' : 'No Delete Permission'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Product Card Component adapted for Dashboard ---

const DashboardProductCard = ({ product, handleEditClick, handleDeleteClick, handleViewProduct, canEdit = true, canDelete = true }: { product: ListProduct; handleEditClick: (p: ListProduct) => void; handleDeleteClick: (p: ListProduct) => void; handleViewProduct: (p: ListProduct) => void; canEdit?: boolean; canDelete?: boolean }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dashboardBase = location.pathname.split('/').slice(0, 2).join('/');
    const name = product?.name || "No Name";
    const price = product?.price ? `₹${product.price}` : "N/A";
    const description = product?.description || "No description available";
    
    // Truncate description for card view
    const truncatedDescription = description.length > 100 
        ? `${description.substring(0, 100)}...` 
        : description;
    
    // Adapted image logic for dashboard use
    const imageUrl = product?.image
        ? product.image
        : "https://placehold.co/500x500?text=No+Image";

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-gray-300 group">
            {/* IMAGE */}
            <div className="bg-gray-50 rounded-lg overflow-hidden relative mb-4">
                <div className="w-full h-[220px] md:h-[240px] xl:h-[280px] flex items-center justify-center">
                    {imageUrl ? (
                        <img
  src={`${imageUrl}?v=${product.updatedAt || Date.now()}`}
  alt={name}
  className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-300 group-hover:scale-105"
/>

                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-sm text-gray-400">
                            <FaImage className="text-3xl mb-2 text-gray-300" />
                            No Image
                        </div>
                    )}
                </div>
            </div>

            {/* INFO + ACTION MODEL */}
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-800 truncate" title={name}>{name}</h3>
                        <p className="text-xs text-gray-500 mb-2">Code: {product.code}</p>
                    </div>
                    <ActionModel 
                        onEdit={() => handleEditClick(product)}
                        onDelete={() => handleDeleteClick(product)}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </div>
                
                {/* PRICE */}
                <span className="text-black font-bold text-xl block">{price}</span>
                
                {/* DESCRIPTION */}

                {/* <div className="mt-2 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-3" title={description}>
                        {truncatedDescription}
                    </p>
                </div> */}

{/* DESCRIPTION */}
{/* VIEW DETAILS (EYE BUTTON) */}
<div className="flex items-center justify-between pt-4 flex-wrap gap-2">
  <button
    onClick={() => handleViewProduct(product)}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
  >
    <FaInfoCircle className="h-3 w-3 " />
    View Details
  </button>



  {/* KEEP EXISTING ACTION MENU */}
  {/* <ActionModel
    onEdit={() => handleEditClick(product)}
    onDelete={() => handleDeleteClick(product)}
  /> */}
</div>



            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Listproducts = () => {
    const [categories, setCategories] = useState<ListCategoryItem[]>([]);
    const [productsByCategory, setProductsByCategory] = useState<Record<string, ListProduct[]>>({});
    const [currentProducts, setCurrentProducts] = useState<ListProduct[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<ListProduct | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>({
        categoryCode: "",
        productCode: "",
        productName: "",
        description: "",
        purchasePrice: "",
        price: "",
        stock: "",
        discount: "",
        image: null,
        additionalImages: [],
        removeImages: [],
    });
    const [imagePreview, setImagePreview] = useState("");
    const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
    const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showProductDetailModal, setShowProductDetailModal] = useState(false);
    const [detailProduct, setDetailProduct] = useState<ListProduct | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productFetchError, setProductFetchError] = useState<string | null>(null);

    // ── Pagination state ──────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const PAGE_SIZE = 20;

    const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttr[]>([]);
    const [attrValues, setAttrValues] = useState<Record<string, string>>({});
    const initialAttrValuesRef = useRef<Record<string, string>>({});

    const { user } = useAuth();
    const { hasPermission } = useStaffPermissions();
    const isStaff = user.role === "STAFF";
    const canEdit   = !isStaff || hasPermission("PRODUCT_EDIT");
    const canDelete = !isStaff || hasPermission("PRODUCT_DELETE");

    // 🔹 Fetch Categories on Mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/category/list');
            const list = res.data.list || [];
            setCategories(list);
            if (list.length > 0) {
                setSelectedCategoryId(list[0].id);
            }
        } catch (err) {
            const _e = err as any;
            console.error("Error fetching categories:", err);
        }
    };

    // 🔹 Fetch products with backend pagination
    const fetchProductsByCategory = useCallback(async (categoryId: string, page = 1) => {
        setLoadingProducts(true);
        setProductFetchError(null);
        setCurrentProducts([]);
        try {
            const res = await api.get(`/product/list?categoryId=${categoryId}&page=${page}&limit=${PAGE_SIZE}`);
            const products = res.data.list || [];
            const pagination = res.data.pagination ?? {};
            setCurrentProducts(products);
            setProductsByCategory((prev) => ({ ...prev, [categoryId]: products }));
            setCurrentPage(pagination.page ?? page);
            setTotalPages(pagination.totalPages ?? 1);
            setTotalProducts(pagination.total ?? products.length);
        } catch (err) {
            const _e = err as any;
            const msg = _e?.response?.data?.message || _e?.message || 'Failed to load products';
            setProductFetchError(msg);
            console.error("Error fetching products:", err);
        } finally {
            setLoadingProducts(false);
        }
    }, [PAGE_SIZE]);

    // Re-fetch whenever the selected category changes — reset to page 1
    useEffect(() => {
        if (selectedCategoryId) {
            setCurrentPage(1);
            fetchProductsByCategory(selectedCategoryId, 1);
        } else {
            setCurrentProducts([]);
            setTotalPages(1);
            setTotalProducts(0);
        }
    }, [selectedCategoryId, fetchProductsByCategory]);

    // Refresh button handler
    const refreshProducts = useCallback(() => {
        if (selectedCategoryId) fetchProductsByCategory(selectedCategoryId, currentPage);
    }, [selectedCategoryId, currentPage, fetchProductsByCategory]);

    // Page change handler
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        setCurrentPage(page);
        fetchProductsByCategory(selectedCategoryId!, page);
        // Scroll product panel back to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
  if (showEditModal || showDeleteModal || showProductDetailModal) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }

  // Cleanup (important)
  return () => {
    document.body.style.overflow = "unset";
  };
}, [showEditModal, showDeleteModal, showProductDetailModal]);


    // 🔹 Filtered Categories and Products (for search)
    const filteredCategories = useMemo(() => {
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const productsToDisplay = useMemo(() => {
        return currentProducts;
    }, [currentProducts]);
    
    const selectedCategoryName = useMemo(() => {
        return categories.find(c => c.id === selectedCategoryId)?.name;
    }, [categories, selectedCategoryId]);


    // 🔹 Fetch category attributes when edit modal's category changes
    useEffect(() => {
      if (!showEditModal || !formData.categoryCode) {
        setCategoryAttrs([]);
        return;
      }
      api
        .get(`/category/${formData.categoryCode}/attributes`)
        .then(res => setCategoryAttrs(res.data.attributes ?? []))
        .catch(() => {});
    }, [showEditModal, formData.categoryCode]);

    // 🔹 Handle Edit / Delete setup
    const handleEditClick = (product: ListProduct) => {
  setSelectedProduct(product);
  const categoryId = (typeof product.category === "object" ? product.category?.id : undefined) ?? "";

  // Pre-populate attribute values from existing product data
  const existingAttrs: Record<string, string> = {};
  (product.attributeValues ?? []).forEach(av => {
    if (av.attributeValueId) {
      existingAttrs[av.attributeId] = existingAttrs[av.attributeId]
        ? `${existingAttrs[av.attributeId]},${av.attributeValueId}`
        : av.attributeValueId;
    } else if (av.textValue) {
      existingAttrs[av.attributeId] = av.textValue;
    }
  });
  setAttrValues(existingAttrs);
  initialAttrValuesRef.current = existingAttrs;

  setFormData({
    categoryCode: categoryId,
    productCode: product.code ?? "",
    productName: product.name,
    description: product.description || "",
    purchasePrice: product.purchasePrice ?? "",
    price: product.price ?? "",
    stock: product.stock || 0,
    discount: product.discount ?? "",
    image: null,
    additionalImages: [],
    removeImages: [],
  });
  setImagePreview(product.image || "");
  setExistingAdditionalImages(product.images || []);
  setAdditionalPreviews([]);
  setShowEditModal(true);
};

const handleViewProduct = (product: ListProduct) => {
  setDetailProduct(product);
  setShowProductDetailModal(true);
};

    const handleDeleteClick = (product: ListProduct) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  const files = (e.target as HTMLInputElement).files;

  if (name === "image") {
    const file = files?.[0];
    setFormData(prev => ({ ...prev, image: file || null }));

    if (file) {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(selectedProduct?.image ?? "");
    }
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newFiles = Array.from(e.target.files || []);
  if (!newFiles.length) return;
  const remaining = 9 - existingAdditionalImages.length - formData.additionalImages.length;
  const allowed = newFiles.slice(0, Math.max(0, remaining));
  const newUrls = allowed.map((f) => URL.createObjectURL(f));
  setFormData(prev => ({ ...prev, additionalImages: [...prev.additionalImages, ...allowed] }));
  setAdditionalPreviews(prev => [...prev, ...newUrls]);
  e.target.value = "";
};

const removeNewAdditionalImage = (index: number) => {
  URL.revokeObjectURL(additionalPreviews[index]);
  setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  setFormData(prev => ({ ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== index) }));
};

const removeExistingImage = (url: string) => {
  setExistingAdditionalImages(prev => prev.filter(img => img !== url));
  setFormData(prev => ({ ...prev, removeImages: [...prev.removeImages, url] }));
};

const handleUpdate = async (e: React.FormEvent) => {
  if (!selectedProduct) return;
  e.preventDefault();

  // 🔍 No changes check
  const isUnchanged =
    formData.productName === selectedProduct.name &&
    formData.price === selectedProduct.price &&
    formData.description === selectedProduct.description &&
    formData.stock === selectedProduct.stock &&
    formData.purchasePrice === (selectedProduct.purchasePrice ?? "") &&
    String(formData.discount) === String(selectedProduct.discount ?? "") &&
    !formData.image &&
    formData.additionalImages.length === 0 &&
    formData.removeImages.length === 0 &&
    JSON.stringify(attrValues) === JSON.stringify(initialAttrValuesRef.current);

  if (isUnchanged) {
    toast("No changes detected", {
      icon: "ℹ️",
      id: "no-change-toast",
    });
    return;
  }

  setIsUpdating(true);

  try {
    const data = new FormData();
    data.append("category", formData.categoryCode);
    data.append("code", formData.productCode);
    data.append("name", formData.productName);
    data.append("description", formData.description);
    data.append("price", String(formData.price));
    if (formData.purchasePrice !== "" && formData.purchasePrice !== null) {
      data.append("purchasePrice", String(formData.purchasePrice));
    }
    data.append("stock", String(formData.stock));

    if (formData.discount !== "" && formData.discount !== null) {
      data.append("discount", String(formData.discount));
    }

    if (formData.image) {
      data.append("image", formData.image);
    }
    // Additional images
    formData.additionalImages.forEach((img) => data.append("images", img));
    // Images to be removed
    if (formData.removeImages.length > 0) {
      data.append("removeImages", JSON.stringify(formData.removeImages));
    }

    // Dynamic attribute values
    const attrPayload = Object.entries(attrValues)
      .filter(([, v]) => v)
      .map(([attributeId, v]) => {
        const attr = categoryAttrs.find(a => a.id === attributeId);
        if (attr && (attr.type === "SELECT" || attr.type === "MULTISELECT")) {
          return { attributeId, attributeValueId: v };
        }
        return { attributeId, textValue: v };
      });
    data.append("attributeValues", JSON.stringify(attrPayload));

    // ✅ Capture response
    const res = await api.put(
      `/product/update/${selectedProduct.id}`,
      data,
      {
        headers: {
            "Content-Type": "multipart/form-data", // Forces the browser to send the file correctly
        }
      }
    );

    const updatedProduct = res.data.product;

    // Update both the current list and the cache
    setCurrentProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setProductsByCategory(prev => ({
      ...prev,
      [formData.categoryCode]: (prev[formData.categoryCode] || []).map(p =>
        p.id === updatedProduct.id ? updatedProduct : p
      )
    }));

    // Handle category change
    const catId = typeof selectedProduct?.category === 'object' ? (selectedProduct.category as { id?: string }).id : undefined;
    if (catId !== formData.categoryCode) {
      setSelectedCategoryId(formData.categoryCode as string);
    }

    toast.success(
      `Product "${formData.productName}" updated successfully`,
      { id: "product-updated" }
    );

    setShowEditModal(false);

  } catch (err) {
      const _e = err as any;
    console.error("Error updating product:", err);
    toast.error(
      "Error updating product. Please check the data",
      { id: "product-update-error" }
    );
  } finally {
    setIsUpdating(false);
  }
};


    // 🔹 Delete Product
    const handleDelete = async () => {
        if (!selectedProduct) return;
        setIsDeleting(true);

        const categoryId = typeof selectedProduct.category === "object" ? selectedProduct.category?.id ?? "" : selectedProduct.category ?? "";
        const productName = selectedProduct.name;
        const deletedId = selectedProduct.id;
        try {
        await api.delete(`/product/delete/${selectedProduct.id}`, {
            // withCredentials: true,
           });
            setShowDeleteModal(false);
            setCurrentProducts(prev => prev.filter(p => p.id !== deletedId));
            setProductsByCategory(prev => ({
                ...prev,
                [categoryId]: (prev[categoryId] || []).filter(p => p.id !== deletedId),
            }));
            toast.success(`Product "${productName}" deleted successfully`,{id:"product deleted"});

        } catch (err) {
      const _e = err as any;
            console.error("Error deleting product:", err);
            // 409 = server blocked deletion due to open orders — show the exact reason
            const msg = _e?.response?.data?.message || "Error deleting product";
            toast.error(msg, { id: "error deleting products", duration: 6000 });

        }finally {
  setIsDeleting(false);
}
    };

    // Add CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            .animate-slideUp { animation: slideUp 0.3s ease-out; }
            .line-clamp-3 {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    // --- RENDERING ---

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-sans">
            <div className="w-full max-w-[1700px] mx-auto pt-4 pb-12 px-3 sm:px-4  md:px-6 lg:px-8 ">


                {/* 📌 UPDATED HEADING - Left Aligned */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                        Product Management Dashboard
                    </h1>
                    <p className="text-gray-600 max-w-3xl">
                        Manage your inventory by category, update product details, and organize your catalog efficiently.
                    </p>
                </div>
                

                <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">



                    
                    {/*  Category Sidebar (Master View) */}
                    {/* <div className="w-full lg:w-1/4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 h-fit lg:sticky top-20 self-start md:w-100 xl:w-1/4 xl:sticky "> */}
                    <div className="w-full xl:w-1/4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 h-fit xl:sticky top-20">



                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            {/* <FaTag className="mr-3 text-[#4A7C59]" />  */}
                            Categories
                            <span className="ml-auto text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {categories.length} total
                            </span>
                        </h2>
                        
                        {/* Search Input */}
                        <div className="relative mb-5">
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent transition duration-200"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        </div>

                        <nav className="space-y-2 max-h-[500px] overflow-y-auto pr-2 ">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategoryId(category.id)}
                                        className={`w-full text-left flex justify-between items-center px-5 py-4 rounded-lg font-medium transition-all duration-200 group cursor-pointer 
                                            ${selectedCategoryId === category.id 
                                                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md' 
                                                : 'text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="font-medium  ">{category.name}</span>
                                        <span className={`text-xs font-mono px-2 py-1 rounded ${selectedCategoryId === category.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            {category.code}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <FaSearch className="text-gray-300 text-2xl mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">
                                        No categories found
                                    </p>
                                </div>
                            )}
                        </nav>
                    </div>

                    {/* ➡️ Product Detail/List (Detail View) */}
                    <div className="w-full  xl:w-3/4">

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                        {selectedCategoryName ? `${selectedCategoryName} Products` : "Select a Category"}
                                    </h2>
                                    {selectedCategoryName && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            {totalProducts > 0
                                                ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalProducts)} of ${totalProducts} products`
                                                : "No products in this category"}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedCategoryId && (
                                        <button
                                            onClick={refreshProducts}
                                            disabled={loadingProducts}
                                            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <svg className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            {loadingProducts ? 'Loading…' : 'Refresh'}
                                        </button>
                                    )}
                                    {selectedCategoryId && totalProducts > 0 && (
                                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                                            {totalProducts} total
                                        </span>
                                    )}
                                </div>
                            </div>

                            {selectedCategoryId && (
                                loadingProducts ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <svg className="animate-spin h-10 w-10 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        <p className="text-gray-500">Loading products…</p>
                                    </div>
                                ) : productFetchError ? (
                                    <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-dashed border-red-200">
                                        <FaBoxOpen size={48} className="text-red-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-red-700 mb-2">Failed to load products</h3>
                                        <p className="text-red-500 max-w-md mx-auto mb-4">{productFetchError}</p>
                                        <button
                                            onClick={refreshProducts}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : productsToDisplay.length > 0 ? (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                                        {productsToDisplay.map((prod) => (
                                            <DashboardProductCard 
                                                key={prod.id}
                                                product={prod}
                                                handleEditClick={handleEditClick}
                                                handleDeleteClick={handleDeleteClick}
                                                handleViewProduct={handleViewProduct}
                                                canEdit={canEdit}
                                                canDelete={canDelete}
                                            />
                                        ))}
                                    </div>

                                    {/* ── Pagination ── */}
                                    {totalPages > 1 && (
                                        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                                            {/* Page info */}
                                            <p className="text-sm text-gray-500 hidden sm:block">
                                                Page <span className="font-semibold text-gray-800">{currentPage}</span> of <span className="font-semibold text-gray-800">{totalPages}</span>
                                            </p>

                                            {/* Controls */}
                                            <div className="flex items-center gap-1 mx-auto sm:mx-0">
                                                {/* Prev */}
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                    <span className="hidden sm:inline">Prev</span>
                                                </button>

                                                {/* Page numbers */}
                                                {(() => {
                                                    const pages: (number | "...")[] = [];
                                                    if (totalPages <= 7) {
                                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                                    } else {
                                                        pages.push(1);
                                                        if (currentPage > 3) pages.push("...");
                                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                                        if (currentPage < totalPages - 2) pages.push("...");
                                                        pages.push(totalPages);
                                                    }
                                                    return pages.map((p, idx) =>
                                                        p === "..." ? (
                                                            <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-400">…</span>
                                                        ) : (
                                                            <button
                                                                key={p}
                                                                onClick={() => handlePageChange(p as number)}
                                                                className={`min-w-[36px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                                                    p === currentPage
                                                                        ? "bg-gray-900 text-white border-gray-900"
                                                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                {p}
                                                            </button>
                                                        )
                                                    );
                                                })()}

                                                {/* Next */}
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    </>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                        <FaBoxOpen size={48} className="text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">No products found</h3>
                                        <p className="text-gray-500 max-w-md mx-auto">
                                            There are no products in <span className="font-semibold text-[#2D5A27]">{selectedCategoryName}</span> yet.
                                        </p>
                                    </div>
                                )
                            )}

                            {!selectedCategoryId && (
                                <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <FaBoxOpen size={28} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-700 mb-3">Select a Category</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Choose a category from the sidebar to view and manage its products
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🛠 Updated Edit Modal */}
{showEditModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-sm">

    <div className="bg-white rounded-2xl shadow-2xl w-full sm:w-[90%] md:w-[75%] lg:w-[60%] max-h-[90vh] overflow-y-auto">

      {/* HEADER */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 ">
              Edit Product
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Update product details and image
            </p>
          </div>

          <button
            onClick={() => setShowEditModal(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <FaTimes className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* BODY – SAME GRID AS ADD CATEGORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">

        {/* LEFT – FORM */}
        <form onSubmit={handleUpdate} className="space-y-6">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <select
              name="categoryCode"
              value={formData.categoryCode}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50
                         focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-300"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product Code
            </label>
            <input
              type="number"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50"
              required
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50"
              required
            />
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Purchase Price
                <span className="ml-2 text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">Cost</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="e.g. 1200"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-semibold">₹</span>
              </div>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Selling Price
                <span className="ml-2 text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">Current</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">₹</span>
              </div>
            </div>
          </div>

          {/* Profit indicator */}
          {formData.purchasePrice !== "" && formData.price !== "" && parseFloat(String(formData.price)) > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <span>Margin:</span>
              <span className={`font-bold ${parseFloat(String(formData.price)) - parseFloat(String(formData.purchasePrice || 0)) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                ₹{(parseFloat(String(formData.price)) - parseFloat(String(formData.purchasePrice || 0))).toFixed(2)}
              </span>
              {parseFloat(String(formData.purchasePrice)) > 0 && (
                <span className="text-slate-400">
                  ({(((parseFloat(String(formData.price)) - parseFloat(String(formData.purchasePrice))) / parseFloat(String(formData.purchasePrice))) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          )}

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50"
              required
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Discount % <span className="text-xs text-slate-400">(Optional — 0 to 100)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="Eg: 10"
                min={0}
                max={100}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">%</span>
            </div>
          </div>

          {/* Dynamic Category Attributes */}
          <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40 space-y-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Category Attributes
            </p>
            {categoryAttrs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No attributes defined for this category.</p>
            ) : (
              categoryAttrs.map(attr => (
                <div key={attr.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {attr.name}
                    {attr.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {attr.type === "SELECT" && (
                    <select
                      value={attrValues[attr.id] ?? ""}
                      onChange={e => setAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="">— Select —</option>
                      {attr.values.map(v => (
                        <option key={v.id} value={v.id}>{v.value}</option>
                      ))}
                    </select>
                  )}
                  {attr.type === "MULTISELECT" && (
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map(v => {
                        const selected = (attrValues[attr.id] ?? "").split(",").filter(Boolean).includes(v.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              const current = (attrValues[attr.id] ?? "").split(",").filter(Boolean);
                              const next = selected ? current.filter(x => x !== v.id) : [...current, v.id];
                              setAttrValues(prev => ({ ...prev, [attr.id]: next.join(",") }));
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {(attr.type === "TEXT" || attr.type === "NUMBER" || attr.type === "BOOLEAN") && (
                    attr.type === "BOOLEAN" ? (
                      <select
                        value={attrValues[attr.id] ?? ""}
                        onChange={e => setAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">— Select —</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type={attr.type === "NUMBER" ? "number" : "text"}
                        value={attrValues[attr.id] ?? ""}
                        onChange={e => setAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    )
                  )}
                </div>
              ))
            )}
          </div>

          {/* IMAGE UPLOAD – PRIMARY */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Image
            </label>

            <label
              htmlFor="productImage"
              className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed
                         border-slate-200 rounded-xl bg-slate-50/30 hover:bg-slate-50/50
                         cursor-pointer transition"
            >
               <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">
                {formData.image ? formData.image.name : "Click to change primary image"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP up to 5MB
              </span>
            </label>

            <input
              type="file"
              id="productImage"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
          </div>

          {/* GALLERY IMAGES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Gallery Images</label>
              <span className="text-xs text-slate-400">{existingAdditionalImages.length + formData.additionalImages.length}/9</span>
            </div>
            {/* Existing images */}
            {existingAdditionalImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {existingAdditionalImages.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={url.startsWith("http") ? url : `${url}`} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <FaTimes className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* New images to be added */}
            {additionalPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {additionalPreviews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50">
                    <img src={url} alt={`new ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] rounded px-1">New</div>
                    <button
                      type="button"
                      onClick={() => removeNewAdditionalImage(i)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <FaTimes className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {existingAdditionalImages.length + formData.additionalImages.length < 9 && (
              <label
                htmlFor="editAdditionalImages"
                className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-xs text-slate-500">Add gallery images</span>
              </label>
            )}
            <input
              type="file"
              id="editAdditionalImages"
              multiple
              accept="image/*"
              onChange={handleAdditionalImages}
              className="hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 resize-none"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
           <button
  type="submit"
  disabled={isUpdating}
  className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800
             text-white flex items-center justify-center gap-2
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isUpdating ? (
    <>
      <LoaderSpinner />
      Updating...
    </>
  ) : (
    "Save Changes"
  )}
</button>

          </div>
        </form>

        {/* RIGHT – CARD PREVIEW (EXACT SAME AS CATEGORY) */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Card Preview
          </h3>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 mb-3 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <FaImage className="text-5xl text-slate-300" />
              )}
            </div>

            {/* Gallery thumbnail mini-strip */}
            {(existingAdditionalImages.length > 0 || additionalPreviews.length > 0) && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                {existingAdditionalImages.map((url, i) => (
                  <div key={`ex-${i}`} className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                    <img src={url.startsWith("http") ? url : url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {additionalPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 border-dashed border-emerald-300">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-500">
                Product Name
              </div>
              <div className="text-lg font-bold text-slate-900">
                {formData.productName || "Untitled Product"}
              </div>

              <div className="text-sm font-medium text-slate-500 mt-4">
                Price
              </div>
              <div className="text-slate-900 font-semibold">
                ₹ {formData.price || "0"}
              </div>

              <div className="text-sm font-medium text-slate-500 mt-4">
                Description
              </div>
              <div className="text-sm text-slate-600 line-clamp-3">
                {formData.description || "No description provided"}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
)}


{showProductDetailModal && detailProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

      {/* HEADER */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">
          Product Details
        </h2>
        <button
          onClick={() => setShowProductDetailModal(false)}
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <FaTimes className="text-slate-500" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* IMAGE */}
        <div className="flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
          {detailProduct.image ? (
            <img
              src={`${detailProduct.image}?v=${detailProduct.updatedAt || Date.now()}`}
              alt={detailProduct.name}
              className="max-h-[400px] w-auto object-contain"
            />
          ) : (
            <FaImage className="text-6xl text-slate-300" />
          )}
        </div>

        {/* DETAILS */}
        <div className="space-y-4 ">
          <div>
            <p className="text-sm text-slate-500">Product Name</p>
            <p className="text-xl font-bold text-slate-900 break-all break-words max-w-full">
              {detailProduct.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Code</p>
            <p className="font-mono text-slate-800">
              {detailProduct.code}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Price</p>
            <p className="text-lg font-semibold text-[#2D5A27]">
              ₹{detailProduct.price}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Description</p>
            <p className="text-slate-600 whitespace-pre-wrap break-words">
              {detailProduct.description || "No description available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
                {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8 text-center">
        
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <TrashIcon className="h-8 w-8 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
          Delete Product
        </h3>

        {/* Message */}
        <p className="text-slate-600 mb-2">
          Are you sure you want to delete{" "}
          <span className="font-bold text-slate-900">
            {selectedProduct?.name}
          </span>
          ?
        </p>

        {/* Product Meta */}
        <p className="text-sm text-slate-500 mb-2">
          Code: {selectedProduct?.code} • Price: ₹{selectedProduct?.price}
        </p>

        <p className="text-sm text-slate-500 mb-8">
          This action cannot be undone. The product will be permanently removed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <LoaderSpinner size="sm" color="white" />
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            </div>
            <Toaster
                                position="top-right"
                                toastOptions={{
                                  duration: 2000,
                                  style: {
                                    borderRadius: "10px",
                                    fontFamily: "Inter, sans-serif",
                                  },
                                }}
                              />
        </div>
    );
};

export default Listproducts;


