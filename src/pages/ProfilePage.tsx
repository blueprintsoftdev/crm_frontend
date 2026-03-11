import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  User,
  Mail,
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle,
  LogOut,
  ShoppingBag,
  Heart,
  Edit2,
  KeyRound,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Profile {
  username: string;
  email: string;
  role?: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, checkAuthStatus, logout } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({ newUsername: "", newEmail: "" });

  // OTP States
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get("/user/profile");
        if (!res.data || !res.data.users) throw new Error("Invalid response");

        const data = res.data.users;
        setProfile(data);
        setFormData({
          newUsername: data.username || "",
          newEmail: data.email || "",
        });
      } catch (err) {
        const e = err as any;
        if (e.response?.status === 401) {
          toast("Please log in.");
          setTimeout(() => navigate("/login"), 1500);
        } else {
          toast.error("Failed to load profile.");
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { newUsername, newEmail } = formData;

    if (!newUsername.trim() || !newEmail.trim())
      return void toast("Fill all fields.");
    if (
      profile &&
      newUsername === profile.username &&
      newEmail === profile.email
    )
      return void toast("No changes detected.");

    try {
      setRequestingOtp(true);
      const res = await api.post("/user/profile/request-update", {
        newEmail,
        newUsername,
      });
      toast.success(res.data?.message || `OTP sent to ${newEmail}`);
      setOtpRequested(true);
    } catch (err) {
      const e = err as any;
      toast.error(e.response?.data?.message || "Update failed.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return void toast("Enter OTP.");

    try {
      setVerifyingOtp(true);
      const res = await api.post("/user/profile/verify-update", {
        otp: otp.trim(),
      });
      toast.success("Profile updated successfully!");

      if (res.data?.user) {
        setProfile(res.data.user);
        setFormData({
          newUsername: res.data.user.username,
          newEmail: res.data.user.email,
        });
      }
      if (checkAuthStatus) checkAuthStatus();
      setOtp("");
      setOtpRequested(false);
    } catch (err) {
      const e = err as any;
      toast.error(e.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (loadingProfile) return <Loader />;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Profile Unavailable
        </h2>
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 bg-black text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-900 transition-all"
        >
          Login Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-24 pb-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* --- Header & Back Button --- */}
        <div className="mb-10">
          <button
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-black hover:text-white transition-all duration-300 shadow-sm mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-800 to-rose-700 sm:text-5xl mb-2">
                My Profile
              </h1>
              <p className="text-gray-500 font-medium">
                Manage your account settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT: IDENTITY CARD ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-gray-100 to-gray-50 z-0"></div>

              <div className="relative z-10 pt-4">
                <div className="w-28 h-28 mx-auto rounded-full bg-white p-1 shadow-lg mb-4">
                  <div className="w-full h-full rounded-full bg-black text-white flex items-center justify-center text-4xl font-bold uppercase tracking-wider">
                    {profile.username.charAt(0)}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.username}
                </h2>
                <p className="text-gray-500 text-sm font-medium mb-6">
                  {profile.email}
                </p>

                <div className="flex justify-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                    {profile.role || "Member"}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Menu */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">
                Quick Menu
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/myorders")}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-gray-500 group-hover:text-white" />
                    <span className="font-bold text-sm">My Orders</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => navigate("/transactions")}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-white" />
                    <span className="font-bold text-sm">Transaction History</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => navigate("/WishlistPage")}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-500 group-hover:text-white" />
                    <span className="font-bold text-sm">Wishlist</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white transition-all duration-300 group text-red-600"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: EDIT FORM ================= */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 h-full">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                    Edit Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update your personal information
                  </p>
                </div>
              </div>

              {!otpRequested ? (
                <form onSubmit={handleRequestUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Username Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 ml-1">
                        Display Name
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                          name="newUsername"
                          type="text"
                          value={formData.newUsername}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent text-gray-900 placeholder-gray-400 focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                          placeholder="Enter username"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 ml-1">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                          name="newEmail"
                          type="email"
                          value={formData.newEmail}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent text-gray-900 placeholder-gray-400 focus:bg-white focus:border-black focus:ring-0 transition-all font-medium"
                          placeholder="Enter email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={requestingOtp}
                      className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      {requestingOtp ? "Sending OTP..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto py-10 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                    <KeyRound className="w-10 h-10" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Verify Email
                  </h3>
                  <p className="text-gray-500 text-sm mb-8">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-gray-900">
                      {formData.newEmail}
                    </span>
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 border-gray-200 focus:border-black focus:ring-0 transition-colors bg-white"
                      placeholder="000000"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={verifyingOtp}
                      className="w-full px-8 py-4 bg-black text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-900 disabled:opacity-70 transition-all shadow-lg"
                    >
                      {verifyingOtp ? "Verifying..." : "Confirm & Update"}
                    </button>
                  </form>

                  <button
                    onClick={() => setOtpRequested(false)}
                    className="mt-6 text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                  >
                    Cancel Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: { borderRadius: "12px", fontFamily: "sans-serif" },
        }}
      />
    </div>
  );
};

export default ProfilePage;
