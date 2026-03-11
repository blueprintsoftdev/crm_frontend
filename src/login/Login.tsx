// src/login/Login.tsx
// Pure presentational shell — all state/logic lives in useLoginFlow.

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import OtpInput from "react-otp-input";

import logo from "../assets/logo.png";
import { useLoginFlow, type LoginStep, type LoginFlowState } from "./useLoginFlow";
import { useBranding } from "../context/BrandingContext";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const DEEP_GREEN  = "#2d3d35";
const MID_GREEN   = "#3d5247";
const ACCENT      = "#a8c5a0";
const LIGHT_TINT  = "#dff0d8";

// ── Shared atoms ──────────────────────────────────────────────────────────────

function ActionButton({
  label,
  loading,
  onClick,
  type = "submit",
  disabled,
}: {
  label: string;
  loading: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className="w-full h-[48px] mt-1 font-semibold rounded-xl text-white text-sm
                 shadow-lg shadow-[#2d3d35]/30 transition-all duration-200
                 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${DEEP_GREEN} 0%, ${MID_GREEN} 100%)` }}
    >
      {loading ? <ClipLoader color="white" size={18} /> : label}
    </button>
  );
}

function TextInput({
  id,
  type = "text",
  name,
  autoComplete,
  value,
  onChange,
  placeholder,
  required,
}: {
  id?: string;
  type?: string;
  name: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm w-full
                 text-gray-800 placeholder:text-gray-400
                 focus:outline-none focus:ring-2 focus:ring-[#a8c5a0] focus:border-transparent
                 transition-all duration-150"
    />
  );
}

function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 pr-11 text-sm w-full
                   text-gray-800 placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-[#a8c5a0] focus:border-transparent
                   transition-all duration-150"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((p) => !p)}
        tabIndex={-1}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        {visible ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
      </button>
    </div>
  );
}

function OtpWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 my-2">
      <OtpInput
        value={value}
        onChange={onChange}
        numInputs={6}
        shouldAutoFocus
        renderInput={(props) => (
          <input
            {...props}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="!w-12 !h-13 border-2 border-gray-200 rounded-xl text-center text-xl font-bold
                       text-gray-900 bg-white focus:outline-none focus:border-[#a8c5a0]
                       focus:ring-2 focus:ring-[#dff0d8] transition-all"
          />
        )}
        containerStyle={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}
      />
    </div>
  );
}

function ResendControl({
  timer, formatTimer, onClick, loading,
}: {
  timer: number; formatTimer: (s: number) => string; onClick: () => void; loading: boolean;
}) {
  return (
    <p className="text-sm text-gray-500 text-center mt-1">
      Didn't receive the code?{" "}
      <button
        type="button"
        onClick={onClick}
        disabled={timer > 0 || loading}
        className="ml-1 font-semibold underline disabled:opacity-50 transition-opacity"
        style={{ color: DEEP_GREEN }}
      >
        {timer > 0 ? `Resend in ${formatTimer(timer)}` : "Resend OTP"}
      </button>
    </p>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-gray-400 hover:text-gray-600 self-center mt-1 transition-colors"
    >
      {label}
    </button>
  );
}

// ── Step views ────────────────────────────────────────────────────────────────

function CredentialsForm({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); flow.handleLoginSubmit(); }}
      className="flex flex-col gap-4 mt-6"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Email address
        </label>
        <TextInput
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          value={flow.email}
          onChange={flow.setEmail}
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            className="text-xs font-semibold transition-colors hover:underline"
            style={{ color: MID_GREEN }}
            onClick={() => flow.setStep("forgot-email")}
          >
            Forgot password?
          </button>
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          value={flow.password}
          onChange={flow.setPassword}
          placeholder="Enter your password"
        />
      </div>

      <ActionButton label="Sign In" loading={flow.loading} />
    </form>
  );
}

function LoginOtpPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <div className="flex flex-col w-full gap-4 mt-6">
      <OtpWidget value={flow.otp} onChange={flow.setOtp} />
      <ActionButton type="button" label="Verify & Sign In" loading={flow.loading} onClick={flow.handleVerifyOtp} />
      <ResendControl timer={flow.timer} formatTimer={flow.formatTimer} onClick={flow.handleResendOtp} loading={flow.loading} />
      <BackButton label="← Back to sign in" onClick={() => { flow.setStep("credentials"); flow.setOtp(""); }} />
    </div>
  );
}

function ForgotEmailPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); flow.handleForgotSubmit(); }}
      className="flex flex-col gap-4 mt-6"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Registered email address
        </label>
        <TextInput
          id="reset-email"
          type="email"
          name="email"
          autoComplete="email"
          value={flow.resetEmail}
          onChange={flow.setResetEmail}
          placeholder="name@example.com"
          required
        />
      </div>
      <ActionButton label="Send OTP" loading={flow.loading} />
      <BackButton label="← Back to sign in" onClick={() => flow.setStep("credentials")} />
    </form>
  );
}

function ForgotOtpPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <div className="flex flex-col w-full gap-4 mt-6">
      <OtpWidget value={flow.otp} onChange={flow.setOtp} />
      <ActionButton type="button" label="Verify OTP" loading={flow.loading} onClick={flow.handleVerifyResetOtp} />
      <ResendControl timer={flow.timer} formatTimer={flow.formatTimer} onClick={flow.handleResendResetOtp} loading={flow.loading} />
      <BackButton label="← Back" onClick={() => { flow.setStep("forgot-email"); flow.setOtp(""); }} />
    </div>
  );
}

function ResetPasswordPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); flow.handleResetPassword(); }}
      className="flex flex-col gap-4 mt-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          New password
        </label>
        <PasswordInput
          id="new-password"
          name="new-password"
          autoComplete="new-password"
          value={flow.newPassword}
          onChange={flow.setNewPassword}
          placeholder="Minimum 8 characters"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Confirm password
        </label>
        <PasswordInput
          id="confirm-password"
          name="confirm-password"
          autoComplete="new-password"
          value={flow.confirmPassword}
          onChange={flow.setConfirmPassword}
          placeholder="Repeat your password"
        />
      </div>
      <ActionButton label="Reset Password" loading={flow.loading} />
    </form>
  );
}

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEP_TITLE: Record<LoginStep, string> = {
  credentials:    "Welcome back",
  otp:            "Verify your identity",
  "forgot-email": "Reset your password",
  "forgot-otp":   "Check your inbox",
  "forgot-reset": "Set a new password",
};

function StepSubtitle({ step, email, resetEmail }: { step: LoginStep; email: string; resetEmail: string }) {
  const map: Record<LoginStep, string> = {
    credentials:    "Sign in to continue to your dashboard",
    otp:            `We sent a 6-digit code to ${email}`,
    "forgot-email": "Enter your email and we'll send a reset code",
    "forgot-otp":   `Enter the code sent to ${resetEmail}`,
    "forgot-reset": "Choose a strong password for your account",
  };
  return <p className="text-sm text-gray-400 text-center mt-1">{map[step]}</p>;
}

// ── Decorative orbs for left panel ───────────────────────────────────────────

function LeftPanel({ companyName, companyTagline, logoSrc }: {
  companyName: string;
  companyTagline: string;
  logoSrc: string;
}) {
  const name = companyName || "Blueprint CRM";
  const tagline = companyTagline || "Your ultimate sustainable fashion destination";

  return (
    <div
      className="hidden lg:flex w-[52%] relative flex-col items-start justify-between p-12 overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${DEEP_GREEN} 0%, #1a2820 100%)` }}
    >
      {/* Decorative blurred circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />
      <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${LIGHT_TINT}, transparent 70%)` }} />
      <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />

      {/* Top: logo + name */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 z-10"
      >
        <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shadow-lg">
          {logoSrc ? (
            <img src={logoSrc} alt={name} className="w-7 h-7 object-contain" />
          ) : (
            <img src={logo} alt={name} className="w-7 h-7 object-contain" />
          )}
        </div>
        <span className="text-white font-bold text-lg tracking-tight">{name}</span>
      </motion.div>

      {/* Middle: tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="z-10 max-w-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
          Admin Portal
        </p>
        <h2 className="text-4xl font-extrabold leading-tight text-white">
          {tagline}
        </h2>
        <p className="mt-4 text-sm text-white/50 leading-relaxed">
          Manage your store, track orders, and grow your business — all from one place.
        </p>
      </motion.div>

      {/* Bottom: feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="z-10 flex flex-wrap gap-2"
      >
        {["Real-time analytics", "Order management", "Customer insights", "Inventory alerts"].map((f) => (
          <span
            key={f}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-white/80 border border-white/15 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function Login() {
  const flow = useLoginFlow();
  const { branding } = useBranding();

  if (flow.isInitialLoad) return null;

  const logoSrc = branding.companyLogo || "";
  const displayLogo = logoSrc || logo;

  return (
    <>
      <div className="flex min-h-screen bg-[#f4f6f3] overflow-hidden">

        {/* ── Left decorative panel ── */}
        <LeftPanel
          companyName={branding.companyName}
          companyTagline={branding.companyTagline}
          logoSrc={logoSrc}
        />

        {/* ── Right form panel ── */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">

          {/* Subtle background tints */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${LIGHT_TINT}55 0%, transparent 50%),
                                radial-gradient(circle at 10% 80%, ${ACCENT}22 0%, transparent 40%)`
            }}
          />

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 z-10">
            <img src={displayLogo} alt={branding.companyName || "Logo"} className="w-9 h-9 object-contain" />
            {branding.companyName && (
              <span className="font-bold text-gray-800 text-lg">{branding.companyName}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={flow.step}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 bg-white rounded-2xl shadow-xl shadow-gray-200/80 w-full max-w-[400px] p-8 sm:p-9 border border-gray-100"
            >
              {/* Logo + brand name inside card */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}18 0%, ${ACCENT}44 100%)` }}
                >
                  <img src={displayLogo} alt={branding.companyName || "Logo"} className="w-10 h-10 object-contain" />
                </div>
                {branding.companyName && (
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    {branding.companyName}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold text-center" style={{ color: DEEP_GREEN }}>
                {STEP_TITLE[flow.step]}
              </h1>
              <StepSubtitle step={flow.step} email={flow.email} resetEmail={flow.resetEmail} />

              {/* Divider */}
              <div className="mt-5 mb-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Step content */}
              {flow.step === "credentials"  && <CredentialsForm    flow={flow} />}
              {flow.step === "otp"          && <LoginOtpPanel      flow={flow} />}
              {flow.step === "forgot-email" && <ForgotEmailPanel   flow={flow} />}
              {flow.step === "forgot-otp"   && <ForgotOtpPanel     flow={flow} />}
              {flow.step === "forgot-reset" && <ResetPasswordPanel flow={flow} />}
            </motion.div>
          </AnimatePresence>

          <p className="mt-6 text-xs text-gray-400 z-10">
            © {new Date().getFullYear()} {branding.companyName || "Blueprint CRM"}. All rights reserved.
          </p>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: { borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "13px" },
        }}
      />
    </>
  );
}
