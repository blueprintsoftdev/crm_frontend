import React, { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { domainUrl } from "../utils/constant";
// import { ToastContainer, toast, Slide } from "react-toastify";
import toast, { Toaster, } from 'react-hot-toast';
import api from "../utils/api";


const AddUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const { username, email, phone, password, role } = formData;

    if (
      !username.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !role
    ) {
      return "Please fill in all fields.";
    }

    if (!/^[a-zA-Z\s]+$/.test(username)) {
      return "Name should contain only letters and spaces.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Enter a valid email address.";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return "Enter a valid 10-digit phone number.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (!role) {
      return "Please select a role.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
       toast.dismiss();
      toast.error(validationError, {
         id: "validation-error",
        style: {
          background: "#fff",
          color: "#000",
          fontWeight: "500",
        },
      });
      return;
    }

    try {
      setLoading(true);
      

     const res = await api.post(
  "/admin/users",
  formData,
  {
    headers: {
      "Content-Type": "application/json",
    },
    // withCredentials: true, // cookies sent automatically
  }
);

       toast.dismiss();
      toast.success(res.data.message || "User added successfully!", {
         id: "add-user-success",
        style: {
          background: "#fff",
          color: "#000",
          fontWeight: "500",
        },
        icon: "🌿",
      });

      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "ADMIN",
      });
    } catch (err) {
      const _e = err as any;
      const msg =
        _e.response?.data?.Error ||
        _e.response?.data?.message ||
        "Failed to add user. Please try again.";

       toast.dismiss(); 
      toast.error(msg, {
       
        style: {
          background: "#ffffff",
          color: "#000",
          fontWeight: "500",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
     <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">


        <div className="max-w-[92rem] mx-auto space-y-6">


          {/* Top header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                User Management · Create
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Add new user
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-md break-words">

                Create a secure account for a new team member or customer with
                controlled access to blueprint_crm.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-slate-500">
              <span className="font-medium text-slate-800">
                blueprint_crm · Admin Console
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-[10px] font-medium uppercase tracking-wide text-slate-100 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Secure workspace
              </span>
            </div>
          </header>

          {/* Main layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xl:gap-6 items-start">




            {/* Left info / brand panel */}
            <aside className="xl:col-span-1 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-5 py-5 sm:px-6 sm:py-6 text-slate-100">
                <div className="absolute inset-y-0 right-0 w-40 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top,_#4ade80_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#22c55e_0,_transparent_55%)]" />

                <div className="relative space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1.5">
                      Onboarding overview
                    </p>
                    <p className="text-sm font-medium text-slate-100">
                      Create accounts with a consistent, high-end experience.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
                      <p className="text-slate-300">Default role</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-300">
                        Customer
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
                      <p className="text-slate-300">Access level</p>
                      <p className="mt-1 text-xs font-semibold text-slate-100">
                        Restricted
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 backdrop-blur-sm">
                      <p className="text-slate-300">Security</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-300">
                        Enforced login
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-[11px] text-slate-300 pt-1">
                    <span className="mt-[3px] h-4 w-4 rounded-full border border-emerald-400/60 flex items-center justify-center text-[9px] text-emerald-300">
                      ✓
                    </span>
                    <p>
                      Share credentials securely and ask the user to reset their
                      password on first login for best practice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-4 sm:px-5 sm:py-5 text-xs text-slate-600 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Smart onboarding tips
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    Recommended
                  </span>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Use unique email and phone number for each user.</li>
                  <li>Reserve the “Admin” role for trusted internal staff.</li>
                  <li>
                    For customers, prefer the “Customer” role with limited and
                    safe access.
                  </li>
                  <li>
                    Keep passwords temporary and encourage password updates on
                    first login.
                  </li>
                </ul>
              </div>
            </aside>

            {/* Right form panel */}
            <section className="xl:col-span-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm">
                <form
                  onSubmit={handleSubmit}
                  className="p-5 sm:p-6 lg:p-7 space-y-7"
                  autoComplete="off"
                >
                  {/* Form header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        User details
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        These details will be used for sign-in and
                        communication.
                      </p>
                    </div>
                    {/* <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1">
                        Step 1 of 1
                      </span>
                    </div> */}
                  </div>

                  {/* Full name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="username"
                        className="text-xs font-medium text-slate-700"
                      >
                        Full name
                      </label>
                      <span className="text-[10px] text-slate-400">
                        As it should appear in the system
                      </span>
                    </div>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter Your Name"
                      className="block w-full h-11 rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 text-sm text-slate-900
                        placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
                        focus:ring-emerald-500/80 focus:border-emerald-500/80 transition"
                    />
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs font-medium text-slate-700"
                      >
                        Email address
                      </label>
                      <input
                        id="email"
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        className="block w-full h-11 rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 text-sm text-slate-900
                          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
                          focus:ring-emerald-500/80 focus:border-emerald-500/80 transition"
                      />
                      <p className="text-[11px] text-slate-500">
                        This will be used as the primary login ID and for
                        updates.
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="phone"
                        className="text-xs font-medium text-slate-700"
                      >
                        Phone number
                      </label>
                      <input
                        id="phone"
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder=" Mobile number"
                        className="block w-full h-11 rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 text-sm text-slate-900
                          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
                          focus:ring-emerald-500/80 focus:border-emerald-500/80 transition"
                      />
                    </div>
                  </div>

                  {/* Security & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="password"
                        className="text-xs font-medium text-slate-700"
                      >
                         Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Minimum 6 Characters"
                          className="block w-full h-11 rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 pr-9 text-sm text-slate-900
                            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
                            focus:ring-emerald-500/80 focus:border-emerald-500/80 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-emerald-600"
                        >
                          {showPassword ? (
                            <FaEyeSlash className="text-sm" />
                          ) : (
                            <FaEye className="text-sm" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Share this once and ask the user to change it after
                        first login.
                      </p>
                    </div>

                    {/* Role selector — Admin only (customers register via mobile OTP) */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700">
                        Role & access
                      </label>
                      <div className="flex flex-wrap gap-1 rounded-full bg-slate-50/60 p-1 text-xs sm:text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              role: "ADMIN",
                            }))
                          }
                          className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                            formData.role === "ADMIN"
                              ? "bg-slate-900 text-slate-50 shadow-sm"
                              : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          <span className="text-[11px]">🛡️</span>
                          Admin
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Admins have extended access. Assign only to trusted
                        internal members. Customers register via mobile OTP.
                      </p>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      You can edit, suspend, or deactivate this user later from
                      the user list.
                    </p>
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          setFormData({
                            username: "",
                            email: "",
                            phone: "",
                            password: "",
                            role: "",
                          })
                        }
                        className="text-xs sm:text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-60"
                      >
                        Clear
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2
                          px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-medium rounded-lg
                          bg-slate-900 text-white hover:bg-slate-800
                          focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-slate-900
                          disabled:opacity-70 disabled:cursor-not-allowed transition"
                      >
                        {loading ? "Adding user…" : "Add user"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {/* <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        transition={Slide}
        toastStyle={{
          borderRadius: "10px",
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      /> */}

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
    </>
  );
};

export default AddUser;