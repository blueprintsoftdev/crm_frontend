import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
// import { ToastContainer, toast, Slide } from "react-toastify";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../utils/api";
import logo123 from "../assets/logo.png";

// **BRAND COLORS**
const DEEP_GREEN = "#34433d";
const ACCENT_GREEN = "#dbe7cf";
const HOVER_GREEN = "#4a5c53";
const LIGHT_BACKGROUND = "#f9f9f9";

export default function Signup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // FORM VALIDATION
  const validateForm = () => {
    const { username, email, phone, password, confirmPassword } = formData;

    if (!username || !email || !phone || !password || !confirmPassword) {
      return "Please fill in all fields.";
    }

    // Full Name
    if (!/^[a-zA-Z\s]{3,}$/.test(username)) {
      return "Name should contain only letters and at least 3 characters.";
    }

    // Strong Email Regex
    const strongEmailRegex =
      /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!strongEmailRegex.test(email.trim())) {
      return "Enter a valid email address.";
    }

    // India Mobile Number (6-9 start + 10 digits)
    const strongPhoneRegex = /^[6-9][0-9]{9}$/;

    if (!strongPhoneRegex.test(phone.trim())) {
      return "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";
    }

    // Strong Password Rule
    // MEDIUM PASSWORD VALIDATION (letters + numbers, 6+ chars)
    const mediumPasswordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*()_+\-=!?.]{6,}$/;

    if (!mediumPasswordRegex.test(password)) {
      return "Please create a strong password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error, { id: "error" });
      return;
    }

    try {
      setLoading(true);
      const { confirmPassword, ...dataToSend } = formData;

      const res = await api.post("/auth/signup", dataToSend);

      toast.success("Account created successfully!", {
        id: "Account Created Successfully",
      });

      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err) {
      const e = err as any;
      toast.error(
        e.response?.data?.Error || e.response?.data?.message || "Signup failed",
        { id: "signupfailed" },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen  bg-[#f9f9f9] overflow-hidden">
        {/* LEFT SECTION (same as login) */}
        <div
          className="hidden lg:flex w-1/2 relative items-center justify-center px-10"
          style={{
            backgroundColor: DEEP_GREEN,
            clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md"
          >
            <span
              className="text-sm font-light"
              style={{ color: ACCENT_GREEN }}
            >
              Step into classic style
            </span>

            <h2
              className="text-4xl font-extrabold mt-2 leading-tight"
              style={{ color: ACCENT_GREEN }}
            >
              Begin your journey with sustainable fashion
            </h2>
          </motion.div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10"
          style={{ backgroundColor: LIGHT_BACKGROUND }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md"
          >
            {/* LOGO */}
            <div className="flex justify-center mb-6">
              <img
                className="h-14 w-14 object-contain"
                src={logo123}
                alt="Logo"
              />
            </div>

            {/* TITLE */}
            <h2
              className="text-2xl font-extrabold text-center"
              style={{ color: DEEP_GREEN }}
            >
              Create your account
            </h2>

            <p className="text-gray-600 text-center text-sm mt-2">
              Join Blueprint CRM today
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
              <input
                type="text"
                name="username"
                placeholder="Full Name"
                value={formData.username}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
              />

              <input
                type="text"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
              />

              <input
                type="tel"
                name="phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="Phone Number (10 digits)"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
              />

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm w-full"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm w-full"
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[45px] font-semibold rounded-md shadow-md text-white mt-3"
                style={{ backgroundColor: DEEP_GREEN }}
              >
                {loading ? (
                  <ClipLoader color="white" size={18} />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* LOGIN LINK */}
            <div className="text-sm text-center mt-6 text-gray-700">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold hover:underline"
                style={{ color: DEEP_GREEN }}
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* <ToastContainer position="top-center" autoClose={2000} transition={Slide} /> */}
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
}
