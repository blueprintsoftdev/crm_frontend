// src/dashboard/StaffProfile.tsx
// Profile settings page for STAFF users.
// Allows viewing profile info and updating username.
// Displays assigned permissions in read-only format.

import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield,
  Mail,
  User,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Lock,
  Camera,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions, PERMISSION_GROUPS } from "../context/StaffPermissionContext";

interface StaffProfileData {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  permissions: string[];
}

const StaffProfile = () => {
  const { checkAuthStatus } = useAuth();
  const { refresh } = useStaffPermissions();

  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [newUsername, setNewUsername] = useState("");

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get<StaffProfileData>("/staff/profile");
        setProfile(res.data);
        setNewUsername(res.data.username);
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? "Failed to load profile.", { id: "profile-load" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Save username ────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      toast.error("Username must be at least 3 characters.", { id: "username-val" });
      return;
    }
    if (newUsername.trim() === profile?.username) {
      toast("No changes detected.", { id: "no-change" });
      return;
    }
    try {
      setSaving(true);
      const res = await api.patch("/staff/me", { username: newUsername.trim() });
      setProfile((prev) => prev ? { ...prev, username: res.data.user.username } : prev);
      toast.success("Profile updated successfully!", { id: "profile-save" });
      await checkAuthStatus();
      await refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update profile.", { id: "profile-save-err" });
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar handlers ────────────────────────────────────────────────────────
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
      const res = await api.patch("/staff/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => (prev ? { ...prev, avatar: res.data.avatar } : prev));
      toast.success("Profile photo updated!", { id: "avatar-save" });
      await checkAuthStatus();
      await refresh();
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
      await api.delete("/staff/me/avatar");
      setProfile((prev) => (prev ? { ...prev, avatar: undefined } : prev));
      toast.success("Profile photo removed.", { id: "avatar-rm" });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to remove photo.", { id: "avatar-rm-err" });
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load profile.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-semibold mb-3">
            <Shield className="w-4 h-4" />
            <span>Staff Panel</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your staff account details
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Upload overlay */}
              <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {avatarUploading ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
              {/* Remove button */}
              {profile.avatar && !avatarUploading && (
                <button
                  onClick={handleAvatarRemove}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-colors"
                  title="Remove photo"
                >
                  ×
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
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border flex-shrink-0 ${
              profile.isActive
                ? "bg-green-50 border-green-100"
                : "bg-red-50 border-red-100"
            }`}>
              <div className={`w-2 h-2 rounded-full ${profile.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className={`text-sm font-semibold ${profile.isActive ? "text-green-700" : "text-red-700"}`}>
                {profile.isActive ? "Active" : "Inactive"}
              </span>
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
                <p className="text-xs text-gray-500">Update your display name</p>
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

            {/* Edit Username */}
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Update Username</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">New Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all text-sm"
                        placeholder="Enter new username"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Email — read-only notice */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400">Email can only be changed by your admin.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Permissions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-900">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Assigned Permissions</h2>
                <p className="text-xs text-gray-500">
                  These are the actions you are allowed to perform. Contact your admin to change them.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.permissions.map((perm) => {
                    const granted = profile.permissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          granted
                            ? "bg-green-50 border-green-100"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          granted ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          {granted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Lock className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${granted ? "text-gray-900" : "text-gray-400"}`}>
                          {perm.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffProfile;
