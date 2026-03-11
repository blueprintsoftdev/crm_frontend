import React, { useEffect, useState } from "react";
import axios from "axios";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";
import toast, { Toaster, } from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Search,
  X,
  Image as ImageIcon,
  Layers,
  Filter,
  Eye,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Tag,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions } from "../context/StaffPermissionContext";


interface ListCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

interface CategoryFormData {
  code: string;
  name: string;
  description: string;
  image: File | null;
}

// Enhanced Loader Component
const LoaderSpinner = ({ size = "md", color = "slate" }: { size?: "sm" | "md" | "lg"; color?: "slate" | "white" | "emerald" }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const colors = {
    slate: "text-slate-600",
    white: "text-white",
    emerald: "text-emerald-500",
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};



// Card Skeleton Loader
const CategoryCardSkeleton = () => (
  <div className="group overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 animate-pulse">
    <div className="h-44 w-full bg-gradient-to-r from-slate-100 to-slate-200"></div>
    <div className="p-5 space-y-4">
      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-2 bg-slate-200 rounded"></div>
        <div className="h-2 bg-slate-200 rounded w-5/6"></div>
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-100">
        <div className="h-3 w-16 bg-slate-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

const ListCategory = () => {
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ListCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ListCategory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    code: "",
    name: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
const [isDeleting, setIsDeleting] = useState(false);
const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});



  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission } = useStaffPermissions();

  const isStaff = user.role === "STAFF";
  const canAdd    = !isStaff || hasPermission("CATEGORY_ADD");
  const canEdit   = !isStaff || hasPermission("CATEGORY_EDIT");
  const canDelete = !isStaff || hasPermission("CATEGORY_DELETE");

  const dashPrefix = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : location.pathname.startsWith("/staff-dashboard")
    ? "/staff-dashboard"
    : "/admin-dashboard";

  useEffect(() => {
    fetchCategories();
  }, []);

 
  // Combined Search and Sort Logic
  useEffect(() => {
    let results = [...categories];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(
        (cat) =>
          cat.name?.toLowerCase().includes(lowerSearchTerm) ||
          String(cat.code).toLowerCase().includes(lowerSearchTerm) ||
          cat.description?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Disable scrolling when any modal is open


    // Apply sorting
    results.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "code":
          // Assuming code might be numeric, if not, treat as string comparison
          return a.code.toString().localeCompare(b.code.toString());
        case "recent":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredCategories(results);
  }, [searchTerm, categories, sortBy]);


  useEffect(() => {
  const isAnyModalOpen = showEditModal || showDeleteModal || showDetailModal;

  if (isAnyModalOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }

  // Cleanup function to ensure scrolling is restored if the component unmounts
  return () => {
    document.body.style.overflow = "unset";
  };
}, [showEditModal, showDeleteModal, showDetailModal]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // **COOKIE AUTH: Added withCredentials**
      const res = await api.get('/category/list', {
        // withCredentials: true,
      });
      const list = res.data.list || [];
      setCategories(list);
    } catch (err) {
      const _e = err as any;
      console.error("Error fetching categories:", err);
      toast.error("Error loading categories");
    } finally {
      setIsLoading(false);
    }
  };

 

  const toggleDescription = (id: string) => {
  setExpandedDesc(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};


  const handleEditClick = (category: ListCategory) => {
    setSelectedCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description ?? "",
      image: null,
    });
    // Set preview to the existing image URL
    setImagePreview(category.image || "");
    setShowEditModal(true);
  };

  const handleDeleteClick = (category: ListCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleViewClick = (category: ListCategory) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;

    if (name === "image") {
      const file = files?.[0];
      setFormData((prev) => ({ ...prev, image: file || null }));

      if (file) {
        // Revoke old URL to prevent memory leaks if switching images
        if (imagePreview && imagePreview.startsWith("blob:")) {
             URL.revokeObjectURL(imagePreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        // If file input is cleared but we had a file selected
        setImagePreview(selectedCategory?.image || "");
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

 const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedCategory) return;

  // Field validation
  if (!formData.code.trim()) {
    toast.error("Category code is required.", { id: "cat-edit-validate" });
    return;
  }
  if (formData.name.trim().length < 3) {
    toast.error("Category name must be at least 3 characters.", { id: "cat-edit-validate" });
    return;
  }
  if (formData.description.trim().length > 0 && formData.description.trim().length < 10) {
    toast.error("Description must be at least 10 characters.", { id: "cat-edit-validate" });
    return;
  }

  // 🔍 CHECK: no changes made
  const noTextChange =
    formData.code === selectedCategory.code &&
    formData.name === selectedCategory.name &&
    formData.description === selectedCategory.description;

  const noImageChange = !formData.image; // no new image selected

  if (noTextChange && noImageChange) {
    toast("No changes detected. Please update the category.", {
      icon: "⚠️",
      id: "no-category-change",
    });
    return;
  }

  setIsUpdating(true);

  try {
    const data = new FormData();
    data.append("code", formData.code);
    data.append("name", formData.name);
    data.append("description", formData.description);

    if (formData.image) {
      data.append("image", formData.image);
    }

    const res = await api.put(
      `/category/update/${selectedCategory.id}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    toast.success(res.data.message || "Category updated successfully!", {
      id: "category-updated",
    });

    closeEditModal();
    fetchCategories();
  } catch (err) {
      const _e = err as any;
    toast.error(
      _e.response?.data?.message || "Error updating category",
      { id: "category-update-error" }
    );
  } finally {
    setIsUpdating(false);
  }
};


  const handleDelete = async () => {
  setIsDeleting(true);
  try {
    if (!selectedCategory) return;
    await api.delete(`/category/delete/${selectedCategory.id}`, {
      // withCredentials: true,
    });
    closeDeleteModal();
    fetchCategories();
    toast.success("Category deleted successfully!");
  } catch (err) {
      const _e = err as any;
      // 409 = server blocked deletion due to open orders — show the exact reason
      const msg = _e?.response?.data?.message || "Error deleting category";
      toast.error(msg, { duration: 6000 });
  } finally {
    setIsDeleting(false);
  }
};


  // Helper to close and reset state for Edit Modal
  const closeEditModal = () => {
    setShowEditModal(false);
    // Cleanup blob URL if one was created
    if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
    }
    setSelectedCategory(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      image: null,
    });
    setImagePreview("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedCategory(null);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCategory(null);
  };

  const btnClick = () => {
    navigate(`${dashPrefix}/manage-categories/add-category`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-6 px-2 sm:px-4 lg:px-6">
      {/* Header Section */}
      <div className="max-w-[95rem] mx-auto w-full">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {/* <div className="p-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div> */}
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Category Management
                </h1>
              </div>
              <p className="text-slate-600 max-w-2xl mt-2">
                Organize and manage your product categories.
              </p>
            </div>

            {/* Stats Card - Always visible, responsive layout */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 shadow-lg border border-slate-100 flex-1 lg:flex-none">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">{filteredCategories.length}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 flex items-center justify-center">
                      <TrendingUp className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Active Categories</p>
                    <p className="text-xs text-slate-500">Out of {categories.length} total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel - Responsive grid for search, sort, and actions */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {/* Search Box */}
              <div className="relative group col-span-1 md:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="name">Sort by Name (A-Z)</option>
                  <option value="code">Sort by Code</option>
                  <option value="recent">Sort by Recent</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Stats & Export */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 justify-start md:justify-center w-full md:w-auto">
                  <span className="font-medium">{filteredCategories.length}</span>
                  <span className="text-slate-400">of</span>
                  <span className="font-medium">{categories.length}</span>
                  <span>categories shown</span>
                </div>
                <button
                  onClick={canAdd ? btnClick : undefined}
                  disabled={!canAdd}
                  title={!canAdd ? "You don't have permission to add categories" : undefined}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    canAdd
                      ? "cursor-pointer bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:shadow-lg"
                      : "cursor-not-allowed bg-slate-300 text-slate-500 opacity-60"
                  }`}
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid - Highly responsive grid layout */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 8 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
               

                {/* Image */}
                <div
                  className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer"
                  onClick={() => handleViewClick(cat)}
                >
                  {cat.image ? (
                    <>
                 <div className="relative w-full h-full min-h-64 max-h-80 overflow-hidden bg-white flex items-center justify-center ">
  <img
    src={cat.image}
    alt={cat.name}
    className="h-full w-auto max-w-full object-cover"
  />
</div>

{/* <div className="w-full h-full  overflow-hidden bg-slate-100">
  <img
    src={cat.image}
    alt={cat.name}
    className="w-full h-full object-cover"
  />
</div> */}





                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                      <div className="p-3 rounded-full bg-slate-200/50">
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      </div>
                      <span className="text-xs font-medium text-slate-500">No image</span>
                    </div>
                  )}

                  {/* Code Overlay */}
                  <div className="absolute bottom-3 left-3">
                    <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-white text-xs font-semibold">
                      CODE: {cat.code}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      ID: {cat.id?.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
  {cat.description || "No description available."}
</p>

{cat.description && cat.description.length > 80 && (
  <button
    onClick={() => handleViewClick(cat)}   // ← OPEN DETAIL MODAL
    className="text-xs font-medium text-slate-700 hover:text-slate-900 underline mt-1"
  >
    Show more
  </button>
)}


                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 ">
                    <button
                      onClick={() => handleViewClick(cat)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => navigate(`${location.pathname.split('/').slice(0, 2).join('/')}/manage-categories/attributes/${cat.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        Attributes
                      </button>
                    )}

                  <div className="flex items-center gap-2">
                      <button
                        onClick={canEdit ? () => handleEditClick(cat) : undefined}
                        disabled={!canEdit}
                        title={!canEdit ? "You don't have permission to edit categories" : "Edit"}
                        className={`p-2 rounded-lg border transition-all duration-200 ${
                          canEdit
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={canDelete ? () => handleDeleteClick(cat) : undefined}
                        disabled={!canDelete}
                        title={!canDelete ? "You don't have permission to delete categories" : "Delete"}
                        className={`p-2 rounded-lg border transition-all duration-200 ${
                          canDelete
                            ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200"
                            : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16 text-center">
                <div className="p-4 rounded-full bg-slate-100 mb-4">
                  <Layers className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No categories found
                </h3>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                  {searchTerm
                    ? `No results found for "${searchTerm}". Try different keywords.`
                    : "Start by adding your first product category to build your catalogue."}
                </p>
                {/* Note: This button needs proper routing setup (e.g., using React Router) */}
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium hover:shadow-lg transition-all duration-200">
                  <Upload className="h-4 w-4" />
                  Add New Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Message */}
      
        

      {/* Edit Modal (Responsive) */}
      {showEditModal && (
        // <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        //  <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

  <div className="
    bg-white rounded-2xl shadow-xl
    w-full sm:w-[90%] md:w-[75%] lg:w-[60%]
    max-h-[90vh]
    overflow-y-auto
  ">



            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">Edit Category</h2>
                  <p className="text-sm text-slate-500 mt-1">Update category details and image</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Form Section */}
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-4">
                  {/* Form Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-all duration-200 resize-none"
                      placeholder="Describe this category..."
                    />
                  </div>

                  {/* Image Upload Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category Image</label>
                    <label
                      htmlFor="updateImage"
                      className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30 hover:bg-slate-50/50 cursor-pointer transition-all duration-200"
                    >
                      <Upload className="h-8 w-8 text-slate-400 mb-3" />
                      <span className="text-sm font-medium text-slate-700 text-center">
                        {formData.image ? formData.image.name : "Click to upload new image"}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        PNG, JPG, WEBP up to 5MB
                      </span>
                    </label>
                    <input
                      type="file"
                      id="updateImage"
                      name="image"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <LoaderSpinner size="sm" color="white" />
                        Updating...
                      </>
                    ) : (
                      "Update Category"
                    )}
                  </button>
                </div>
              </form>

              {/* Preview Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Card Preview</h3>
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 mb-4">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-contain"

                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-500">Category Name</div>
                      <div className="text-lg font-bold text-slate-900">{formData.name || "Untitled"}</div>
                      
                      <div className="text-sm font-medium text-slate-500 mt-4">Code</div>
                      <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium">
                        {formData.code || "N/A"}
                      </div>
                      
                      <div className="text-sm font-medium text-slate-500 mt-4">Description</div>
                      <div className="text-sm text-slate-600 line-clamp-3">
                        {formData.description || "No description provided"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (Responsive) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Delete Category</h3>
              
              <p className="text-slate-600 mb-2">
                Are you sure you want to delete <span className="font-bold text-slate-900">{selectedCategory?.name}</span>?
              </p>
              
              <p className="text-sm text-slate-500 mb-8">
                This action cannot be undone. All products under this category will be affected.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={closeDeleteModal}
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
    "Delete Category"
  )}
</button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal (Responsive) */}
      {showDetailModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
           <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 p-6 border-b border-slate-100">
  <div className="flex items-center justify-between">
    <h2 className="text-xl md:text-2xl font-bold text-slate-900">Category Details</h2>

    <button
      onClick={closeDetailModal}
      className="p-2 rounded-lg hover:bg-slate-100 transition"
    >
      <X className="h-5 w-5 text-slate-500" />
    </button>
  </div>
</div>

            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div>
                  <div className="w-full rounded-xl  mb-6 overflow-hidden flex items-center justify-center">
  {selectedCategory.image ? (
    <img
      src={selectedCategory.image}
      alt={selectedCategory.name}
      className="max-h-[400px] w-auto object-contain"
    />
  ) : (
    <div className="flex h-64 w-full items-center justify-center">
      <ImageIcon className="h-16 w-16 text-slate-300" />
    </div>
  )}
</div>

                </div>
                
                {/* Details Section */}
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-slate-500 mb-2">Category Name</div>
                    <div className="text-xl md:text-2xl font-bold text-slate-900">{selectedCategory.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-slate-500 mb-2">Category Code</div>
                    <div className="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white font-medium">
                      {selectedCategory.code}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-slate-500 mb-2">Description</div>
                    <div className="text-slate-600 whitespace-pre-wrap break-words">
  {selectedCategory.description || "No description provided"}
</div>

                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-slate-500 mb-2">Category ID</div>
                    <div className="text-xs sm:text-sm font-mono text-slate-700 bg-slate-50 p-3 rounded-lg break-words">
                      {selectedCategory.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default ListCategory;