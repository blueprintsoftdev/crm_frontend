import React, { useEffect, useState } from "react";
// import axios from "axios";
import { domainUrl } from "../utils/constant";
import { useNavigate } from "react-router-dom";
// import { ToastContainer, toast, Slide } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import toast, { Toaster, } from 'react-hot-toast';
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { 
  ArrowLeft, 
  Shield, 
  Mail, 
  User, 
  CheckCircle, 
  Key, 
  RefreshCw,
  Smartphone,
  AlertCircle,
  Building2,
  Image,
  Type,
  Upload,
  Trash2,
  Camera,
} from "lucide-react";
import api from "../utils/api";

interface AdminProfileData {
  username: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface CompanySettings {
  COMPANY_NAME: string;
  COMPANY_TAGLINE: string;
  COMPANY_LOGO: string;
  COMPANY_FAVICON: string;
}



// axios.defaults.withCredentials = true;

const AdminProfile = () => {
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const { refresh: refreshBranding } = useBranding();

  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [formData, setFormData] = useState({
    newUsername: "",
    newEmail: "",
  });

  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showSecurityTips, setShowSecurityTips] = useState(false);

  // Company branding state
  const [company, setCompany] = useState<CompanySettings>({ COMPANY_NAME: "", COMPANY_TAGLINE: "", COMPANY_LOGO: "", COMPANY_FAVICON: "" });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ===========================
  // FETCH ADMIN PROFILE
  // ===========================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get('/admin/adminProfile', {
          // withCredentials: true,
        });

        if (!res.data || !res.data.adminData) {
          throw new Error("Invalid profile response");
        }

        const data = res.data.adminData;
        setProfile(data);

        setFormData({
          newUsername: data.username || "",
          newEmail: data.email || "",
        });

      } catch (err) {
      const _e = err as any;
        console.error("Admin profile error:", err);
        toast.error("Failed to load admin profile.");
        if (_e.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch company settings
  useEffect(() => {
    api.get("/admin/company-settings")
      .then((res) => {
        const s = res.data.settings;
        setCompany({
          COMPANY_NAME: s.COMPANY_NAME ?? "",
          COMPANY_TAGLINE: s.COMPANY_TAGLINE ?? "",
          COMPANY_LOGO: s.COMPANY_LOGO ?? "",
          COMPANY_FAVICON: s.COMPANY_FAVICON ?? "",
        });
        if (s.COMPANY_LOGO) setLogoPreview(s.COMPANY_LOGO);
        if (s.COMPANY_FAVICON) setFaviconPreview(s.COMPANY_FAVICON);
      })
      .catch(() => {})
      .finally(() => setCompanyLoading(false));
  }, []);

  // OTP Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  // 🔥 AUTO RESET WHEN OTP EXPIRES (NO RESEND)
useEffect(() => {
  if (otpRequested && otpTimer === 0) {
    toast("Security code expired. Please try again.", {
      icon: "⏰",
      id: "otp-expired",
    });

    // Reset OTP flow
    setOtpRequested(false);
    setOtp("");
    setShowSecurityTips(false);
  }
}, [otpTimer, otpRequested]);

  
  
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ===========================
  // COMPANY SETTINGS SAVE
  // ===========================
  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.COMPANY_NAME.trim()) {
      toast.error("Company name is required.");
      return;
    }
    try {
      setCompanySaving(true);
      const fd = new FormData();
      fd.append("companyName", company.COMPANY_NAME.trim());
      fd.append("companyTagline", company.COMPANY_TAGLINE.trim());
      if (logoFile) {
        fd.append("logo", logoFile);
      } else if (company.COMPANY_LOGO) {
        fd.append("logoUrl", company.COMPANY_LOGO);
      }
      if (faviconFile) {
        fd.append("favicon", faviconFile);
      } else if (company.COMPANY_FAVICON) {
        fd.append("faviconUrl", company.COMPANY_FAVICON);
      }
      const res = await api.put("/admin/company-settings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const s = res.data.settings;
      setCompany({
        COMPANY_NAME: s.COMPANY_NAME ?? "",
        COMPANY_TAGLINE: s.COMPANY_TAGLINE ?? "",
        COMPANY_LOGO: s.COMPANY_LOGO ?? "",
        COMPANY_FAVICON: s.COMPANY_FAVICON ?? "",
      });
      if (s.COMPANY_LOGO) setLogoPreview(s.COMPANY_LOGO);
      if (s.COMPANY_FAVICON) setFaviconPreview(s.COMPANY_FAVICON);
      setLogoFile(null);
      setFaviconFile(null);
      toast.success("Company branding saved!");
      refreshBranding();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to save company settings.");
    } finally {
      setCompanySaving(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setCompany((prev) => ({ ...prev, COMPANY_LOGO: "" }));
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    setCompany((prev) => ({ ...prev, COMPANY_FAVICON: "" }));
  };

  // ===========================
  // AVATAR UPLOAD / REMOVE
  // ===========================
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    try {
      setAvatarUploading(true);
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.patch("/admin/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => prev ? { ...prev, avatar: res.data.avatar } : prev);
      toast.success("Profile photo updated!", { id: "avatar-save" });
      await checkAuthStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to upload photo.", { id: "avatar-err" });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    try {
      setAvatarUploading(true);
      await api.delete("/admin/avatar");
      setProfile((prev) => prev ? { ...prev, avatar: undefined } : prev);
      toast.success("Profile photo removed.", { id: "avatar-rm" });
      await checkAuthStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to remove photo.", { id: "avatar-rm-err" });
    } finally {
      setAvatarUploading(false);
    }
  };
  const handleRequestUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  const newUsername = formData.newUsername.trim();
  const newEmail = formData.newEmail.trim();

  if (!newUsername || !newEmail) {
    toast("Please fill in both username and email.");
    return;
  }

  if (!emailRegex.test(newEmail)) {
    toast("Please enter a valid email address.");
    return;
  }

  // 🔥 IMPORTANT: No changes detected
  if (
    profile &&
    newUsername === profile.username &&
    newEmail === profile.email
  ) {
    toast("No changes detected in profile.",{
      icon:"❗",
      id:"no changes"
    });
    return;
  }

  try {
    setRequestingOtp(true);

    const res = await api.post(
      "/admin/adminProfile/request-update",
      {
        newUsername,
        newEmail,
      }
    );

    toast.success(
      res.data?.message || "Security code sent to your email."
    );

    setOtpRequested(true);
    setOtpTimer(300);
    setShowSecurityTips(true);

  } catch (err) {
      const _e = err as any;
    toast.error(
      _e.response?.data?.message ||
      "Failed to send security code."
    );
  } finally {
    setRequestingOtp(false);
  }
};


  // ===========================
  // VERIFY OTP
  // ===========================
   const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (otpTimer === 0) {
  toast("Security code expired. Please request again.", {
    icon: "⛔",
    id: "otp-expired-verify",
  });
  return;
}


  if (!otp.trim()) {
    toast("Please enter the security code.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    toast("Please enter a valid 6-digit code.");
    return;
  }

  try {
    setVerifyingOtp(true);

    const res = await api.post(
      "/admin/adminProfile/verify-update",
      { otp: otp.trim() }
    );

    toast.success("Profile updated successfully!");

    if (res.data?.user) {
      setProfile(res.data.user);
      setFormData({
        newUsername: res.data.user.username,
        newEmail: res.data.user.email,
      });
    }

    checkAuthStatus();

    // 🔥 Reset states
    setOtp("");
    setOtpRequested(false);
    setShowSecurityTips(false);

  } catch (err) {
      const _e = err as any;
    toast.error(
      _e.response?.data?.message ||
      "Invalid or expired security code."
    );
  } finally {
    setVerifyingOtp(false);
  }
};


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ===========================
  // LOADING SCREEN
  // ===========================
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load admin profile.</h2>
        </div>
      </div>
    );
  }

  // ===========================
  // MAIN UI - MODERN DESIGN
  // ===========================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-semibold mb-3">
            <Shield className="w-4 h-4" />
            <span>Admin Panel</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your administrator account with enhanced security and precision controls
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Hover overlay */}
              <label className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${avatarUploading ? "opacity-100 cursor-wait" : ""}`}>
                {avatarUploading ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              {/* Remove button */}
              {profile.avatar && !avatarUploading && (
                <button
                  onClick={handleAvatarRemove}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Remove photo"
                >
                  <span className="text-white text-xs font-bold leading-none">×</span>
                </button>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold">
                  <Shield className="w-3 h-3" />
                  {profile.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4" />
                {profile.email}
              </p>
              <p className="text-xs text-gray-400 mt-1">Click on the photo to change it</p>
            </div>
            {/* Status */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-100 flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Active</span>
            </div>
          </div>
        </div>
        {/* Edit Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-900">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Edit Profile Information</h2>
                    <p className="text-xs text-gray-500">Update your administrative credentials</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                
                {/* Current Info Cards */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Username</p>
                        <p className="font-semibold text-gray-900">{profile.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Email Address</p>
                        <p className="font-semibold text-gray-900 break-all text-sm">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                {!otpRequested ? (
                  <form onSubmit={handleRequestUpdate} className="space-y-6">
                    
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">New Information</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Username Field */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">New Username</label>
                          <div className="relative">
                            <input
                              name="newUsername"
                              type="text"
                              value={formData.newUsername}
                              onChange={handleChange}
                              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all text-sm"
                              placeholder="Enter new username"
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700">New Email Address</label>
                          <div className="relative">
                            <input
                              name="newEmail"
                              type="email"
                              value={formData.newEmail}
                              onChange={handleChange}
                              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all text-sm"
                              placeholder="Enter new email"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={requestingOtp}
                        className="w-full flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestingOtp ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Sending Security Code...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            Request Security Code
                          </>
                        )}
                      </button>
                      <p className="mt-2.5 text-center text-xs text-gray-400">
                        A verification code will be sent to your new email address
                      </p>
                    </div>
                  </form>
                ) : (
                  /* OTP Verification Section */
                  <div>
                    {/* Security Tips */}
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-6 flex items-start gap-3">
                      <Key className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-gray-700 space-y-1.5">
                        <p className="font-semibold text-gray-800">Security Tips</p>
                        <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Check spam folder if code isn't received</p>
                        <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Code expires in 5 minutes</p>
                        <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Keep your new credentials secure</p>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mb-4">
                          <Smartphone className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          Enter Security Code
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          We've sent a 6-digit code to your new email address
                        </p>

                        {/* OTP Input */}
                        <div className="relative max-w-xs mx-auto">
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20"
                            placeholder="000000"
                          />
                          {otpTimer > 0 && (
                            <p className="mt-3 text-sm text-gray-500">
                              Expires in{" "}
                              <span className="font-bold text-red-600">{formatTime(otpTimer)}</span>
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 space-y-3 max-w-xs mx-auto">
                          <button
                            type="submit"
                            disabled={verifyingOtp || otpTimer === 0}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                          >
                            {verifyingOtp ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Verifying & Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Verify & Update Profile
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOtpRequested(false);
                              setOtp("");
                              setOtpTimer(0);
                              setShowSecurityTips(false);
                            }}
                            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                          >
                            ← Back to Edit Form
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
        </div>
      </div>

      {/* Company Branding Card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-900">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Company Branding</h2>
                <p className="text-xs text-gray-500">
                  These details appear on invoices and receipts sent to customers
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {companyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <form onSubmit={handleCompanySave} className="space-y-6">
                {/* Logo upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Company Logo
                  </label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Preview box */}
                    <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0 relative group">
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Company logo preview"
                            className="w-full h-full object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl"
                          >
                            <Trash2 className="w-5 h-5 text-white" />
                          </button>
                        </>
                      ) : (
                        <Image className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    {/* Upload controls */}
                    <div className="flex-1 space-y-3">
                      <label className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full sm:w-auto">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {logoFile ? logoFile.name : "Upload logo image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoFileChange}
                        />
                      </label>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, SVG or WEBP — max 5 MB. If you have a URL, paste it below.
                      </p>
                      <div className="relative">
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={logoFile ? "" : company.COMPANY_LOGO}
                          onChange={(e) => {
                            setCompany((prev) => ({ ...prev, COMPANY_LOGO: e.target.value }));
                            setLogoPreview(e.target.value || null);
                            setLogoFile(null);
                          }}
                          disabled={!!logoFile}
                          placeholder="Or paste a logo URL…"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favicon upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Favicon <span className="font-normal normal-case text-gray-400">(browser tab icon)</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0 relative group">
                      {faviconPreview ? (
                        <>
                          <img src={faviconPreview} alt="Favicon preview" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={removeFavicon}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <Image className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full sm:w-auto">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {faviconFile ? faviconFile.name : "Upload favicon image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFaviconFileChange}
                        />
                      </label>
                      <p className="text-xs text-gray-400">PNG, ICO, SVG or WEBP — recommended 32×32 or 64×64 px.</p>
                      <div className="relative">
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={faviconFile ? "" : company.COMPANY_FAVICON}
                          onChange={(e) => {
                            setCompany((prev) => ({ ...prev, COMPANY_FAVICON: e.target.value }));
                            setFaviconPreview(e.target.value || null);
                            setFaviconFile(null);
                          }}
                          disabled={!!faviconFile}
                          placeholder="Or paste a favicon URL…"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={company.COMPANY_NAME}
                      onChange={(e) => setCompany((p) => ({ ...p, COMPANY_NAME: e.target.value }))}
                      placeholder="e.g. blueprint_crm"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>
                </div>

                {/* Company Tagline */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Company Tagline</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={company.COMPANY_TAGLINE}
                      onChange={(e) =>
                        setCompany((p) => ({ ...p, COMPANY_TAGLINE: e.target.value }))
                      }
                      placeholder="e.g. Premium Fabric & Draping Solutions"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Invoice Header Preview
                  </p>
                  <div className="bg-gray-900 text-white rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="logo"
                          className="w-12 h-12 object-contain rounded-lg bg-white/10 p-1 shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-lg font-extrabold tracking-tight">
                          {company.COMPANY_NAME || "Your Company Name"}
                        </p>
                        <p className="text-gray-400 text-sm mt-0.5">
                          {company.COMPANY_TAGLINE || "Your tagline goes here"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Invoice</p>
                      <p className="text-lg font-bold text-white mt-0.5">INV-XXXXXXXXXX</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={companySaving}
                  className="w-full flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {companySaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      Save Company Branding
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
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

export default AdminProfile;