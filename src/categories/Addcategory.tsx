import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";
import { CategoryAttributes } from "./CategoryAttributes";
import toast, { Toaster, } from 'react-hot-toast';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Palette,
  Type,
  FileText,
  Hash,
  RefreshCw,
  Zap,
} from "lucide-react";




  

interface ValidationField {
  isValid: boolean;
  message: string;
}

interface CategoryFormData {
  code: string;
  name: string;
  description: string;
  image: File | null;
}

interface CategoryValidation {
  code: ValidationField;
  name: ValidationField;
  description: ValidationField;
  image: ValidationField;
}

// Input Validation Indicator
const ValidationIndicator = ({ isValid, message }: { isValid: boolean; message: string }) => (
  <div className="flex items-center gap-2 mt-1">
    {isValid ? (
      <CheckCircle className="h-3 w-3 text-emerald-500" />
    ) : (
      <AlertCircle className="h-3 w-3 text-amber-500" />
    )}
    <span className="text-xs text-slate-500">{message}</span>
  </div>
);

const AddCategory = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CategoryFormData>({
    code: "",
    name: "",
    description: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<CategoryValidation>({
    code: { isValid: false, message: "Letters and numbers only" },
    name: { isValid: false, message: "Letters and spaces only" },
    description: { isValid: false, message: "Minimum 10 characters" },
    image: { isValid: false, message: "Image required" },
  });
  const [charCount, setCharCount] = useState(0);
  const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);
  const [createdCategoryName, setCreatedCategoryName] = useState("");

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB


  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Real-time validation
  useEffect(() => {
    const { code, name, description, image } = formData;

    setValidation({
      code: {
        isValid: /^[a-zA-Z0-9]+$/.test(code) && code.length > 0,
        message:
          code.length > 0 && !/^[a-zA-Z0-9]+$/.test(code)
            ? "Only letters and numbers allowed"
            : "Letters and numbers only",
      },
      name: {
        isValid: /^[a-zA-Z\s]+$/.test(name) && name.length > 0,
        message:
          name.length > 0 && !/^[a-zA-Z\s]+$/.test(name)
            ? "Only letters and spaces allowed"
            : "Letters and spaces only",
      },
      description: {
        isValid: description.length >= 10,
        message: `${description.length}/10 characters minimum`,
      },
      image: {
        isValid: image !== null,
        message: image ? "Image selected ✓" : "Image required",
      },
    });

    setCharCount(description.length);
  }, [formData]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  const files = (e.target as HTMLInputElement).files;

  if (name === "image") {
    const file = files?.[0];
    if (!file) return;

    // Image size validation
    if (file.size > MAX_IMAGE_SIZE) {
      toast.dismiss();
      toast.error("Image size must be less than 5 MB.");

      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);

      const input = document.getElementById("imageUpload") as HTMLInputElement | null;
      if (input) input.value = "";
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(url);

  } else {
    // ✅ THIS WAS MISSING
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};




  const handleReset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setFormData({
      code: "",
      name: "",
      description: "",
      image: null,
    });
    setImagePreview(null);
    setCharCount(0);

    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const allValid = Object.values(validation).every(v => v.isValid);

  if (!allValid) {
    toast.dismiss();
    toast.error("Please fill all the feilds.");
    return;
  }

  try {
    setLoading(true);

    const data = new FormData();
    data.append("code", formData.code);
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.image) data.append("image", formData.image);

    const res = await api.post("/category/add", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const newCategoryId = res.data.category?.id;
    const newCategoryName = res.data.category?.name || formData.name;
    toast.dismiss();
    toast.success(res.data.message || "Category added successfully!");
    handleReset();
    if (newCategoryId) {
      setCreatedCategoryId(newCategoryId);
      setCreatedCategoryName(newCategoryName);
    }

  } catch (err) {
      const _e = err as any;
    toast.dismiss();
    toast.error(
      _e.response?.data?.message ||
      _e.response?.data?.error ||
      "Category creation failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <>
     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-2 sm:px-4 lg:px-4 py-6">

        <div className="max-w-[92rem] mx-auto">
          {!createdCategoryId ? (
          <>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              {/* Title & Subtitle */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {/* <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
                    {/* <Palette className="h-6 w-6 text-white" /> */}
                  {/* </div> */} 
                  <div>
                    <h1 className="text-3xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Add New Category
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Create a new product category for your catalogue
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="submit"
                  form="add-category-form"
                  disabled={loading}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Indicators - Responsive grid for all validation states */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Object.entries(validation).map(([key, val]) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl border ${
                    val.isValid
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  } transition-all duration-300`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        val.isValid ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      {key === "code" && (
                        <Hash
                          className={`h-4 w-4 ${
                            val.isValid ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                      {key === "name" && (
                        <Type
                          className={`h-4 w-4 ${
                            val.isValid ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                      {key === "description" && (
                        <FileText
                          className={`h-4 w-4 ${
                            val.isValid ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                      {key === "image" && (
                        <ImageIcon
                          className={`h-4 w-4 ${
                            val.isValid ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-700 capitalize">
                        {key}
                      </div>
                      <div
                        className={`text-xs ${
                          val.isValid ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {val.isValid ? "✓ Valid" : "Required"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Form - Switches from single to three-column layout */}
          <form
            id="add-category-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-8">
              {/* Card 1: Basic Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Hash className="h-4 w-4 text-slate-700" />
                    </div>
                    Category Information
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Define your category with unique identifiers
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Category Code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="categoryCode" className="block text-sm font-semibold text-slate-800">
                        Category Code
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Unique identifier
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="categoryCode" // Added id for better accessibility
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Eg: CAT001"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validation.code.isValid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : formData.code ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : null}
                      </div>
                    </div>
                    <ValidationIndicator
                      isValid={validation.code.isValid}
                      message={validation.code.message}
                    />
                  </div>

                  {/* Category Name */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="categoryName" className="block text-sm font-semibold text-slate-800">
                        Category Name
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Display name
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="categoryName" // Added id for better accessibility
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Eg: Electronics"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validation.name.isValid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : formData.name ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : null}
                      </div>
                    </div>
                    <ValidationIndicator
                      isValid={validation.name.isValid}
                      message={validation.name.message}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="categoryDescription" className="block text-sm font-semibold text-slate-800">
                        Description
                      </label>
                      <span
                        className={`text-xs font-medium ${
                          charCount >= 10
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }`}
                      >
                        {charCount}/10 characters
                      </span>
                    </div>
                    <div className="relative">
                      <textarea
                        id="categoryDescription" // Added id for better accessibility
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Describe this category in detail..."
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200 resize-none"
                      />
                      <div className="absolute right-3 top-3">
                        {validation.description.isValid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : formData.description ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : null}
                      </div>
                    </div>
                    <ValidationIndicator
                      isValid={validation.description.isValid}
                      message={validation.description.message}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload ONLY */}
            <div className="space-y-8">
              {/* Image Upload Card - `h-full` to match height of content next to it on large screens */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden h-full">
                <div className="p-6  border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <ImageIcon className="h-4 w-4 text-slate-700" />
                    </div>
                    Category Image
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload a high-quality image for this category
                  </p>
                </div>

                <div className="p-6 h-full">
                  <div className="flex flex-col h-full">
                    {/* Image Upload Area */}
                   <label
  htmlFor="imageUpload"
  className={`cursor-pointer transition-all duration-300 block`}
>

                      {imagePreview ? (
                        <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl group">
                          {/* object-contain is better than cover for image preview to prevent cropping */}
                          <img
                            src={imagePreview}
                            alt="Category image preview"
                            className="w-full h-full object-contain rounded-xl border-2 border-slate-200 bg-white p-2"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 rounded-xl">
                            <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-slate-800 mb-2">
                              Change Image
                            </div>
                            <p className="text-xs text-white/80 text-center max-w-xs">
                              Click to upload a different image
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="border-3 border-dashed border-slate-300 rounded-xl p-8 pb-12 text-center bg-gradient-to-b from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all duration-300 h-full min-h-[300px] flex flex-col items-center justify-center">
                          <div className="p-4 rounded-full bg-slate-100 mb-4">
                            <Upload className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-2">
                            Upload Category Image
                          </h3>
                          <p className="text-xs text-slate-500 mb-4 max-w-xs">
                            Drag & drop or click to browse. Supports PNG, JPG,
                            WEBP up to 5MB.
                          </p>
                          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-medium hover:shadow-lg transition-all duration-200">
                            <Upload className="h-4 w-4" />
                            Select Image File
                          </div>
                        </div>
                      )}
                    </label>

                    <input
                      type="file"
                      id="imageUpload"
                      name="image"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />

                    {/* Image Info & Validation */}
                    <div className="mt-6 space-y-4">
                      <ValidationIndicator
                        isValid={validation.image.isValid}
                        message={validation.image.message}
                      />

                      {/* Image Details (when uploaded) */}
                      {formData.image && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <div>
                                <p className="text-xs font-medium text-emerald-800 truncate max-w-[150px] sm:max-w-xs">
                                  {formData.image!.name}
                                </p>
                                <p className="text-xs text-emerald-600">
                                  {(formData.image!.size / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (imagePreview)
                                  URL.revokeObjectURL(imagePreview);
                                setFormData((prev) => ({
                                  ...prev,
                                  image: null,
                                }));
                                setImagePreview(null);
                                const input =
                                  document.getElementById("imageUpload") as HTMLInputElement | null;
                                if (input) input.value = "";
                              }}
                              className="text-xs text-rose-600 hover:text-rose-700 font-medium mt-10"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
          </>
          ) : (
            <div className="py-4">
              {/* Success banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">Category &ldquo;{createdCategoryName}&rdquo; created!</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Now add optional attributes to enable dynamic product filtering for this category.
                  </p>
                </div>
                <div className="flex gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { setCreatedCategoryId(null); setCreatedCategoryName(""); }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Add Another
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin-dashboard/manage-categories")}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium hover:shadow-lg transition-all duration-200"
                  >
                    <Zap className="h-4 w-4" />
                    Done
                  </button>
                </div>
              </div>

              {/* Inline attribute management */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Hash className="h-5 w-5 text-slate-600" />
                    Category Attributes
                    <span className="ml-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Define the filterable specs for products in this category.
                  </p>
                </div>
                <CategoryAttributes inline={true} categoryId={createdCategoryId ?? undefined} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {/* {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )} */}

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

      {/* Add CSS for slideDown animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AddCategory;




