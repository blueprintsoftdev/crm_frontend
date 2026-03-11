// src/components/CustomerAuthModal.tsx
// Modal for customer auth with two modes:
//   Sign In:  phone → OTP → login  (404 = offer to create account)
//   Register: name + email + phone → OTP → register → auto-login

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ClipLoader } from "react-spinners";
import OtpInput from "react-otp-input";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const DEEP_GREEN = "#34433d";

// ── MSG91 Widget (client-side public keys — safe to expose in browser) ────────
const MSG91_TOKEN_AUTH = "470679Ta3KdMQSELGw68d4f098P1";
const MSG91_WIDGET_ID  = "356979674149373833343037";

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = "sign-in" | "register";
type Step = "form" | "otp";

// ── OTP input style ───────────────────────────────────────────────────────────
const OTP_CLASS =
  "!w-16 !h-16 border-2 border-gray-300 rounded-xl text-center " +
  "text-2xl font-bold text-gray-900 bg-white focus:outline-none " +
  "focus:border-[#34433d] focus:ring-2 focus:ring-[#c0ddd1] transition-all";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CustomerAuthModal({ open, onClose }: Props) {
  const { checkAuthStatus } = useAuth();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState("");
  const [timer, setTimer] = useState(0);

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Reset state ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("form");
    setPhone("");
    setName("");
    setEmail("");
    setOtp("");
    setReqId("");
    setTimer(0);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const switchMode = (m: Mode) => { reset(); setMode(m); };

  // ── MSG91 browser call ─────────────────────────────────────────────────────
  const callMsg91 = async (endpoint: string, body: Record<string, unknown>) => {
    const r = await fetch(`https://control.msg91.com/api/v5/widget/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenAuth: MSG91_TOKEN_AUTH, widgetId: MSG91_WIDGET_ID, ...body }),
    });
    const text = await r.text();
    try { return JSON.parse(text) as { type: string; message?: string; [k: string]: unknown }; }
    catch { return { type: "error", message: text }; }
  };

  // ── Step 1: Validate form + send OTP ──────────────────────────────────────
  const handleSendOtp = async () => {
    if (!/^[6-9][0-9]{9}$/.test(phone.trim())) {
      toast.error("Enter a valid 10-digit mobile number", { id: "phone-invalid" });
      return;
    }
    if (mode === "register") {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Enter your full name (at least 2 characters)", { id: "name-invalid" });
        return;
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error("Enter a valid email address", { id: "email-invalid" });
        return;
      }
    }
    try {
      setLoading(true);

      // For sign-in: verify the phone exists in the DB BEFORE wasting an OTP
      if (mode === "sign-in") {
        try {
          await api.post("/auth/mobile/check-phone", { phone: phone.trim() });
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string; code?: string } } };
          const code = e?.response?.data?.code;
          if (code === "NO_ACCOUNT") {
            toast.error("No account found with this number. Please create an account.", {
              id: "no-account",
              duration: 4000,
            });
            const savedPhone = phone;
            reset();
            setMode("register");
            setPhone(savedPhone);
          } else {
            toast.error(e?.response?.data?.message ?? "Could not verify number. Try again.", { id: "check-fail" });
          }
          return;
        }
      }

      const data = await callMsg91("sendOtp", { identifier: `91${phone.trim()}` });
      if (data.type !== "success") {
        toast.error(data.message ?? "Failed to send OTP", { id: "otp-fail" });
        return;
      }
      // MSG91 sendOtp returns the reqId in data.message
      setReqId((data.message ?? "") as string);
      toast.success("OTP sent to your mobile!", { id: "otp-sent" });
      setOtp("");
      setStep("otp");
      setTimer(300);
    } catch {
      toast.error("Failed to send OTP. Check your connection.", { id: "otp-fail" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP → call backend login or register ───────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      toast.error("Enter the complete 4-digit OTP", { id: "otp-incomplete" });
      return;
    }
    try {
      setLoading(true);

      // Browser verifies OTP with MSG91 → gets JWT access token
      const verifyData = await callMsg91("verifyOtp", { reqId, otp });
      if (verifyData.type !== "success") {
        toast.error(verifyData.message ?? "Invalid or expired OTP", { id: "otp-verify-fail" });
        return;
      }
      const accessToken = (verifyData.message ?? "") as string;
      if (!accessToken) {
        toast.error("Verification failed. Please try again.", { id: "otp-no-token" });
        return;
      }

      if (mode === "sign-in") {
        const res = await api.post("/auth/mobile/login", { phone: phone.trim(), accessToken });
        toast.success(res.data.message ?? "Welcome back!", { id: "login-ok" });
        await checkAuthStatus();
        handleClose();
      } else {
        const res = await api.post("/auth/mobile/register", {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          accessToken,
        });
        toast.success(res.data.message ?? "Account created! Welcome.", { id: "register-ok" });
        await checkAuthStatus();
        handleClose();
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; code?: string } } };
      const msg = e?.response?.data?.message;
      const code = e?.response?.data?.code;

      if (code === "NO_ACCOUNT") {
        // No account with this number — guide user to sign up
        const savedPhone = phone;
        toast.error("No account found. Please create an account.", { id: "no-account", duration: 4000 });
        reset();
        setMode("register");
        setPhone(savedPhone);
      } else if (code === "DUPLICATE") {
        toast.error("Account already exists. Please sign in instead.", { id: "duplicate", duration: 4000 });
        const savedPhone = phone;
        reset();
        setMode("sign-in");
        setPhone(savedPhone);
      } else {
        toast.error(msg ?? "Something went wrong. Please try again.", { id: "otp-verify-fail" });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setLoading(true);
      const data = await callMsg91("retryOtp", { reqId });
      if (data.type !== "success") {
        toast.error(data.message ?? "Failed to resend OTP", { id: "resend-fail" });
        return;
      }
      // MSG91 retryOtp returns the new reqId in message
      if (data.message) setReqId(data.message as string);
      toast.success("OTP resent!", { id: "otp-resent" });
      setOtp("");
      setTimer(300);
    } catch {
      toast.error("Failed to resend OTP.", { id: "resend-fail" });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const title = step === "otp"
    ? "Verify OTP"
    : mode === "sign-in" ? "Sign In" : "Create Account";

  const subtitle = step === "otp"
    ? `OTP sent to +91 ${phone}`
    : mode === "sign-in"
      ? "Enter your mobile number to continue"
      : "Sign up with your details";

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-[100]">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 relative">
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Mode toggle (only on form step) */}
          {step === "form" && (
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => switchMode("sign-in")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                  mode === "sign-in"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("register")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                  mode === "register"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: DEEP_GREEN }}>{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>

          {/* ── Form step ────────────────────────────────────────────────── */}
          {step === "form" && (
            <div className="flex flex-col gap-4">
              {/* Register: name + email */}
              {mode === "register" && (
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name *"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#c0ddd1] focus:border-[#34433d]"
                    autoFocus
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address (optional)"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#c0ddd1] focus:border-[#34433d]"
                  />
                </>
              )}

              {/* Phone */}
              <div className="flex items-stretch border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#c0ddd1] focus-within:border-[#34433d]">
                <span className="flex items-center px-3 text-sm font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Mobile number *"
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  autoFocus={mode === "sign-in"}
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-11 font-semibold rounded-lg text-white text-sm shadow disabled:opacity-60 transition"
                style={{ backgroundColor: DEEP_GREEN }}
              >
                {loading ? <ClipLoader color="white" size={18} /> : "Send OTP"}
              </button>

              <p className="text-xs text-center text-gray-400">
                By continuing, you agree to our{" "}
                <a href="#" className="underline hover:text-gray-600">Terms of Service</a>
              </p>
            </div>
          )}

          {/* ── OTP step ─────────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="flex flex-col gap-5">
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={4}
                shouldAutoFocus
                renderInput={(props) => (
                  <input
                    {...props}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={OTP_CLASS}
                  />
                )}
                containerStyle={{ width: "100%", display: "flex", justifyContent: "center", gap: "12px" }}
              />

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 4}
                className="w-full h-11 font-semibold rounded-lg text-white text-sm shadow disabled:opacity-60 transition"
                style={{ backgroundColor: DEEP_GREEN }}
              >
                {loading
                  ? <ClipLoader color="white" size={18} />
                  : mode === "sign-in" ? "Sign In" : "Create Account"}
              </button>

              <p className="text-sm text-center text-gray-500">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || loading}
                  className="underline font-semibold disabled:opacity-50 transition"
                  style={{ color: DEEP_GREEN }}
                >
                  {timer > 0 ? `Resend in ${formatTimer(timer)}` : "Resend OTP"}
                </button>
              </p>

              <button
                type="button"
                onClick={() => { setStep("form"); setOtp(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline text-center"
              >
                ← {mode === "register" ? "Edit details" : "Change number"}
              </button>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
