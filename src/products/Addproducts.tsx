import React, { useState, useEffect } from "react";
import axios from "axios";
import { domainUrl } from "../utils/constant";
import api from "../utils/api";
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
  Tag,
  DollarSign,
  Layers,
} from "lucide-react";

// ---------------------- Toast ----------------------



interface ValidationField {
  isValid: boolean;
  message: string;
}

interface ProductFormData {
  categoryCode: string;
  productCode: string;
  productName: string;
  brand: string;
  description: string;
  purchasePrice: string;
  price: string;
  stock: string;
  discount: string;
  image: File | null;
  additionalImages: File[];
}

interface ProductValidation {
  category: ValidationField;
  productCode: ValidationField;
  productName: ValidationField;
  description: ValidationField;
  purchasePrice: ValidationField;
  price: ValidationField;
  image: ValidationField;
  stock: ValidationField;
}

interface ProductCategory {
  id: string;
  name: string;
  code: string;
}

interface CategoryAttr {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  values: { id: string; value: string }[];
}

// ---------------- Validation Indicator -------------
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


const AddProducts = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    categoryCode: "",
    productCode: "",
    productName: "",
    brand: "",
    description: "",
    purchasePrice: "",
    price: "",
    stock: "",
    discount: "",
    image: null,
    additionalImages: [],
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttr[]>([]);
  const [attrsLoading, setAttrsLoading] = useState(false);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({}); // attributeId -> value or valueId;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const [validation, setValidation] = useState<ProductValidation>({
    category: { isValid: false, message: "Category is required" },
    productCode: { isValid: false, message: "Numbers only" },
    productName: { isValid: false, message: "Letters, numbers & basic symbols" },
    description: { isValid: false, message: "Minimum 10 characters" },
    purchasePrice: { isValid: true, message: "Optional" },
    price: { isValid: false, message: "Price must be greater than 0" },
    image: { isValid: false, message: "Image required" },
    stock: { isValid: true, message: "Optional" },
  });

  // ------------- Load categories (COOKIE AUTH) -------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/category/list', {
          // withCredentials: true,
        });
        setCategories(res.data.list || []);
      } catch (err) {
      const _e = err as any;
        toast.error("Failed to load categories",{ id: "failed load categories" });

      }
    };
    fetchCategories();
  }, []);

  // Load category attributes when category changes
  useEffect(() => {
    if (!formData.categoryCode) {
      setCategoryAttrs([]);
      setAttrsLoading(false);
      setAttrValues({});
      return;
    }
    setAttrsLoading(true);
    api
      .get(`/category/${formData.categoryCode}/attributes`)
      .then(res => {
        setCategoryAttrs(res.data.attributes ?? []);
        setAttrValues({});
      })
      .catch(() => {})
      .finally(() => setAttrsLoading(false));
  }, [formData.categoryCode]);

  // Cleanup preview URL
  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview]
  );

  // ------------- Real-time validation -------------
  useEffect(() => {
    const {
      categoryCode,
      productCode,
      productName,
      description,
      purchasePrice,
      price,
      stock,
      image,
    } = formData;


    

   setValidation({
  category: {
    isValid: !!categoryCode,
    message: categoryCode ? "Category selected ✓" : "Category is required",
  },
  productCode: {
    isValid: /^[0-9]+$/.test(productCode) && productCode.length > 0,
    message:
      productCode.length > 0 && !/^[0-9]+$/.test(productCode)
        ? "Only numbers allowed"
        : "Numbers only",
  },
  productName: {
    isValid:
      /^[a-zA-Z0-9\s&_\-,]+$/.test(productName) &&
      productName.trim().length > 0,
    message:
      productName.length > 0 &&
      !/^[a-zA-Z0-9\s&_\-,]+$/.test(productName)
        ? "Only letters, numbers, spaces, &, -, _ and ,"
        : "Letters, numbers & basic symbols",
  },
  description: {
    isValid: description.length >= 10,
    message: `${description.length}/10 characters minimum`,
  },
  purchasePrice: {
    isValid:
      purchasePrice === "" || (parseFloat(purchasePrice) >= 0 && !isNaN(parseFloat(purchasePrice))),
    message:
      purchasePrice === ""
        ? "Optional — cost/purchase price"
        : parseFloat(purchasePrice) >= 0
        ? "Valid purchase price ✓"
        : "Must be non-negative",
  },
  price: {
    isValid: !!price && parseFloat(price) > 0,
    message: price ? "Valid price ✓" : "Price must be greater than 0",
  },
  stock: {
    isValid:
      stock === "" || (Number(stock) >= 0 && Number.isInteger(+stock)),
    message:
      stock === ""
        ? "Optional"
        : Number(stock) >= 0
        ? "Valid stock ✓"
        : "Stock cannot be negative",
  },
  image: {
    isValid: image !== null,
    message: image ? "Image selected ✓" : "Image required",
  },
});


    setCharCount(description.length);
  }, [formData]);

  // -------------------- Handlers --------------------


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;

    if (name === "image") {
      const file = files?.[0];
      if (file) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        const url = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, image: file }));
        setImagePreview(url);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    const remaining = 9 - formData.additionalImages.length;
    const allowed = newFiles.slice(0, remaining);
    const newUrls = allowed.map((f) => URL.createObjectURL(f));
    setFormData((prev) => ({ ...prev, additionalImages: [...prev.additionalImages, ...allowed] }));
    setAdditionalPreviews((prev) => [...prev, ...newUrls]);
    e.target.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    URL.revokeObjectURL(additionalPreviews[index]);
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== index) }));
  };



  const handleReset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    additionalPreviews.forEach(URL.revokeObjectURL);
    setFormData({
      categoryCode: "",
      productCode: "",
      productName: "",
      brand: "",
      description: "",
      purchasePrice: "",
      price: "",
      stock: "",
      discount: "",
      image: null,
      additionalImages: [],
    });
    setAttrValues({});
    setCategoryAttrs([]);
    setImagePreview(null);
    setAdditionalPreviews([]);
    setCharCount(0);

    const input = document.getElementById("imageUpload") as HTMLInputElement | null;
    if (input) input.value = "";
    const addInput = document.getElementById("additionalImagesUpload") as HTMLInputElement | null;
    if (addInput) addInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allValid = Object.values(validation).every((v) => v.isValid);
    if (!allValid) {
      toast.error(
        "Please ensure all required fields are valid before submitting.",{ id: "fill all feilds" },
      );
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

     data.append("category", formData.categoryCode);
data.append("code", formData.productCode);
data.append("name", formData.productName);
if (formData.brand.trim()) data.append("brand", formData.brand.trim());
data.append("description", formData.description);
if (formData.purchasePrice !== "") data.append("purchasePrice", formData.purchasePrice);
data.append("price", formData.price);
if (formData.image) data.append("image", formData.image);
// Additional images
formData.additionalImages.forEach((img) => data.append("images", img));
if (formData.stock !== "") data.append("stock", formData.stock);
if (formData.discount !== "") data.append("discount", formData.discount);
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
if (attrPayload.length > 0) data.append("attributeValues", JSON.stringify(attrPayload));

      const res = await api.post("/product/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data.message || "Product added successfully!", { id: "product-added" });
      handleReset();
    } catch (err) {
      const _e = err as any;
      toast.error(
        _e.response?.data?.message ||
          _e.response?.data?.Error ||
          "Error adding product. Please try again.",
          { id: "error adding product" }
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------- UI -----------------------
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-6">

        <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4">

          {/* Header */}
          <div className="mb-8 mt-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {/* <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
                    <Palette className="h-6 w-6 text-white" />
                  </div> */}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Add New Product
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                      Create a new product for your catalogue
                    </p>
                  </div>
                </div>
              </div>

              {/* Header buttons */}
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
                  form="add-product-form"
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
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {/* Category */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.category.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.category.isValid ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <Layers
                      className={`h-4 w-4 ${
                        validation.category.isValid ? "text-white" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">Category</div>
                    <div
                      className={`text-xs ${
                        validation.category.isValid
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {validation.category.isValid ? "✓ Selected" : "Required"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Code */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.productCode.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.productCode.isValid
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  >
                    <Hash
                      className={`h-4 w-4 ${
                        validation.productCode.isValid
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">
                      Product Code
                    </div>
                    <div
                      className={`text-xs ${
                        validation.productCode.isValid
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {validation.productCode.isValid ? "✓ Valid" : "Required"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.productName.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.productName.isValid
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  >
                    <Type
                      className={`h-4 w-4 ${
                        validation.productName.isValid
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">
                      Product Name
                    </div>
                    <div
                      className={`text-xs ${
                        validation.productName.isValid
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {validation.productName.isValid ? "✓ Valid" : "Required"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.description.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.description.isValid
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 ${
                        validation.description.isValid
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">
                      Description
                    </div>
                    <div
                      className={`text-xs ${
                        validation.description.isValid
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {validation.description.isValid ? "✓ Valid" : "Required"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.price.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.price.isValid ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <DollarSign
                      className={`h-4 w-4 ${
                        validation.price.isValid ? "text-white" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">Price</div>
                    <div
                      className={`text-xs ${
                        validation.price.isValid ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {validation.price.isValid ? "✓ Valid" : "Required"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div
                className={`p-4 rounded-xl border ${
                  validation.image.isValid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                } transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      validation.image.isValid ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <ImageIcon
                      className={`h-4 w-4 ${
                        validation.image.isValid ? "text-white" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-700">Image</div>
                    <div
                      className={`text-xs ${
                        validation.image.isValid ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {validation.image.isValid ? "✓ Selected" : "Required"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <form
            id="add-product-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* LEFT: Product Fields */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Tag className="h-4 w-4 text-slate-700" />
                    </div>
                    Product Information
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Define your product details and attributes
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Category Select */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Product Category
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Select from existing categories
                      </span>
                    </div>
                    <select
                      name="categoryCode"
                      value={formData.categoryCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.code})
                        </option>
                      ))}
                    </select>
                    <ValidationIndicator
                      isValid={validation.category.isValid}
                      message={validation.category.message}
                    />
                  </div>

                  {/* Product Code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Product Code
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Numbers only
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="productCode"
                        value={formData.productCode}
                        onChange={handleChange}
                        placeholder="Eg: 1001"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validation.productCode.isValid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : formData.productCode ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : null}
                      </div>
                    </div>
                    <ValidationIndicator
                      isValid={validation.productCode.isValid}
                      message={validation.productCode.message}
                    />
                  </div>

                  {/* Product Name */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Product Name
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Display name
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="productName"
                        value={formData.productName}
                        onChange={handleChange}
                        placeholder="Eg: Puffer Jacket with Pocket Detail"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validation.productName.isValid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : formData.productName ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : null}
                      </div>
                    </div>
                    <ValidationIndicator
                      isValid={validation.productName.isValid}
                      message={validation.productName.message}
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">Brand</label>
                      <span className="text-xs font-medium text-slate-500">Optional</span>
                    </div>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Eg: Nike, Adidas…"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Description
                      </label>
                      <span
                        className={`text-xs font-medium ${
                          charCount >= 10 ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {charCount}/10 characters
                      </span>
                    </div>
                    <div className="relative">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe this product in detail..."
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

                  {/* Dynamic Category Attributes – always visible */}
                  <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40 space-y-4">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                      Category Attributes
                    </p>
                    {!formData.categoryCode ? (
                      <p className="text-sm text-slate-400 italic">Select a category above to see its product attributes.</p>
                    ) : attrsLoading ? (
                      <p className="text-sm text-slate-400">Loading attributes…</p>
                    ) : categoryAttrs.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No attributes defined for this category. You can add them from <span className="text-indigo-600 font-medium">Category Management › List Categories › Attributes</span>.</p>
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

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Purchase Price */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-800">
                            Purchase Price
                          </label>
                          <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                            Cost Price
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            name="purchasePrice"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                            placeholder="Eg: 1200"
                            className="w-full px-4 py-3.5 rounded-xl border border-amber-100 bg-amber-50/30 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-transparent transition-all duration-200"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-semibold">
                            ₹
                          </div>
                        </div>
                        <ValidationIndicator
                          isValid={validation.purchasePrice.isValid}
                          message={validation.purchasePrice.message}
                        />
                      </div>

                      {/* Selling Price */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-800">
                            Selling Price
                          </label>
                          <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Current Price
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Eg: 2499"
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                            ₹
                          </div>
                        </div>
                        <ValidationIndicator
                          isValid={validation.price.isValid}
                          message={validation.price.message}
                        />
                      </div>
                    </div>

                    {/* Profit Indicator */}
                    {formData.purchasePrice !== "" && formData.price !== "" && parseFloat(formData.price) > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 text-sm">
                        <DollarSign className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-600">Estimated profit:</span>
                        <span className={`font-bold ${parseFloat(formData.price) - parseFloat(formData.purchasePrice || "0") >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          ₹{(parseFloat(formData.price) - parseFloat(formData.purchasePrice || "0")).toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-xs">
                          ({parseFloat(formData.purchasePrice || "0") > 0
                            ? (((parseFloat(formData.price) - parseFloat(formData.purchasePrice)) / parseFloat(formData.purchasePrice)) * 100).toFixed(1)
                            : "—"}% margin)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Stock
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        (Update stock)
                      </span>
                    </div>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="Eg: 50"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Discount %
                      </label>
                      <span className="text-xs font-medium text-slate-500">
                        Optional — 0 to 100
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        placeholder="Eg: 10"
                        min={0}
                        max={100}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                        %
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>

            {/* RIGHT: Image Upload */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden h-full">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <ImageIcon className="h-4 w-4 text-slate-700" />
                    </div>
                    Product Image
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload a high-quality product image
                  </p>
                </div>

                <div className="p-6 h-full">
                  <div className="flex flex-col h-full">
                    <label
                      htmlFor="imageUpload"
                      className="cursor-pointer transition-all duration-300 block"
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl group">
                          <img
                            src={imagePreview}
                            alt="Product preview"
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
                            Upload Product Image
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

                    <div className="mt-6 space-y-4">
                      <ValidationIndicator
                        isValid={validation.image.isValid}
                        message={validation.image.message}
                      />

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
                                  {(
                                    formData.image!.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Gallery Images */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        <Layers className="h-4 w-4 text-slate-700" />
                      </div>
                      Gallery Images
                    </h2>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                      {formData.additionalImages.length}/9
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Add up to 9 extra product images for a complete gallery view</p>
                </div>
                <div className="p-5 space-y-4">
                  {additionalPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {additionalPreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={url} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(i)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] rounded px-1">{i + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.additionalImages.length < 9 && (
                    <label
                      htmlFor="additionalImagesUpload"
                      className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {additionalPreviews.length === 0 ? "Add gallery images" : "Add more images"}
                      </span>
                      <span className="text-[11px] text-slate-400">PNG, JPG, WEBP up to 5MB each</span>
                    </label>
                  )}
                  <input
                    type="file"
                    id="additionalImagesUpload"
                    multiple
                    accept="image/*"
                    onChange={handleAdditionalImages}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

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

export default AddProducts;
