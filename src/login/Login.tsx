// src/login/Login.tsx
// Pure presentational shell  all state/logic lives in useLoginFlow.

import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import OtpInput from "react-otp-input";

import logo from "../assets/logo.png";
import { useLoginFlow, type LoginStep, type LoginFlowState } from "./useLoginFlow";

//  Brand tokens 
const DEEP_GREEN = "#34433d";
const ACCENT_GREEN = "#dbe7cf";
const FOCUS_RING = "#c0ddd1";

//  Shared atoms 

/** Primary action button  disables + shows spinner while loading */
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
      className="w-full h-[45px] mt-2 font-semibold rounded-md shadow-md text-white
                 transition-opacity disabled:opacity-60 cursor-pointer"
      style={{ backgroundColor: DEEP_GREEN }}
    >
      {loading ? <ClipLoader color="white" size={18} /> : label}
    </button>
  );
}

/** Text input with consistent focus ring */
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
      className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full
                 focus:outline-none focus:ring-2 focus:ring-[#c0ddd1]"
    />
  );
}

/** Password input with show/hide toggle  each instance has its own local visibility state */
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
        className="border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm w-full
                   focus:outline-none focus:ring-2 focus:ring-[#c0ddd1]"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((p) => !p)}
        tabIndex={-1}
        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
      >
        {visible ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
      </button>
    </div>
  );
}

/** 6-input OTP widget */
function OtpWidget({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
            className="!w-14 !h-14 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold text-gray-900 bg-white focus:outline-none focus:border-[#34433d] focus:ring-2 focus:ring-[#c0ddd1] transition-all"
          />
        )}
        containerStyle={{ width: "100%", display: "flex", justifyContent: "center", gap: "10px" }}
      />
    </div>
  );
}

/** Resend OTP control with MM:SS countdown */
function ResendControl({
  timer,
  formatTimer,
  onClick,
  loading,
}: {
  timer: number;
  formatTimer: (s: number) => string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <p className="text-sm text-gray-600 mt-1">
      Didn't receive the code?{" "}
      <button
        type="button"
        onClick={onClick}
        disabled={timer > 0 || loading}
        className="ml-1 underline font-semibold disabled:opacity-50 transition-opacity"
        style={{ color: DEEP_GREEN }}
      >
        {timer > 0 ? `Resend in ${formatTimer(timer)}` : "Resend OTP"}
      </button>
    </p>
  );
}

/** Inline back link */
function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm underline text-gray-500 hover:text-gray-700 self-center mt-1"
    >
      {label}
    </button>
  );
}

//  Step views 

function CredentialsForm({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        flow.handleLoginSubmit();
      }}
      className="flex flex-col gap-3 mt-6"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
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

      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          value={flow.password}
          onChange={flow.setPassword}
          placeholder="Enter your password"
        />
      </div>

      <button
        type="button"
        className="text-sm text-right text-blue-700 hover:underline self-end"
        onClick={() => flow.setStep("forgot-email")}
      >
        Forgot password?
      </button>

      <ActionButton label="Sign In" loading={flow.loading} />
    </form>
  );
}

function LoginOtpPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <div className="flex flex-col w-full gap-4 mt-6">
      <OtpWidget value={flow.otp} onChange={flow.setOtp} />

      <ActionButton
        type="button"
        label="Verify & Sign In"
        loading={flow.loading}
        onClick={flow.handleVerifyOtp}
      />

      <ResendControl
        timer={flow.timer}
        formatTimer={flow.formatTimer}
        onClick={flow.handleResendOtp}
        loading={flow.loading}
      />

      <BackButton
        label=" Back to sign in"
        onClick={() => {
          flow.setStep("credentials");
          flow.setOtp("");
        }}
      />
    </div>
  );
}

function ForgotEmailPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        flow.handleForgotSubmit();
      }}
      className="flex flex-col gap-3 mt-6"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
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

      <BackButton label=" Back to sign in" onClick={() => flow.setStep("credentials")} />
    </form>
  );
}

function ForgotOtpPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <div className="flex flex-col w-full gap-4 mt-6">
      <OtpWidget value={flow.otp} onChange={flow.setOtp} />

      <ActionButton
        type="button"
        label="Verify OTP"
        loading={flow.loading}
        onClick={flow.handleVerifyResetOtp}
      />

      <ResendControl
        timer={flow.timer}
        formatTimer={flow.formatTimer}
        onClick={flow.handleResendResetOtp}
        loading={flow.loading}
      />

      <BackButton
        label=" Back"
        onClick={() => {
          flow.setStep("forgot-email");
          flow.setOtp("");
        }}
      />
    </div>
  );
}

function ResetPasswordPanel({ flow }: { flow: LoginFlowState }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        flow.handleResetPassword();
      }}
      className="flex flex-col gap-3 mt-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
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

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
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

//  Step metadata 
const STEP_TITLE: Record<LoginStep, string> = {
  credentials:    "Sign in to your account",
  otp:            "Verify your identity",
  "forgot-email": "Forgot password",
  "forgot-otp":   "Verify your email",
  "forgot-reset": "Set a new password",
};

function StepSubtitle({
  step,
  email,
  resetEmail,
}: {
  step: LoginStep;
  email: string;
  resetEmail: string;
}) {
  const map: Record<LoginStep, string> = {
    credentials:    "Welcome back! Please enter your details.",
    otp:            `We sent a 6-digit code to ${email}`,
    "forgot-email": "We'll send a one-time code to reset your password.",
    "forgot-otp":   `We sent a 6-digit code to ${resetEmail}`,
    "forgot-reset": "Choose a strong password for your account.",
  };
  return <p className="text-gray-400 text-center text-sm mt-2">{map[step]}</p>;
}

//  Root component 
export default function Login() {
  const flow = useLoginFlow();

  // Prevent flash of login UI if the user is already authenticated
  if (flow.isInitialLoad) return null;

  return (
    <>
      <div className="flex min-h-screen bg-[#f9f9f9] overflow-hidden">

        {/*  Left decorative panel (desktop only)  */}
        <div
          aria-hidden="true"
          className="hidden lg:flex w-1/2 relative items-center justify-center px-10"
          style={{
            backgroundColor: DEEP_GREEN,
            clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-10 w-full max-w-md"
          >
            <span className="text-sm font-light" style={{ color: ACCENT_GREEN }}>
              Step into classic style
            </span>
            <h2
              className="text-4xl font-extrabold mt-2 leading-tight"
              style={{ color: ACCENT_GREEN }}
            >
              Discover your ultimate sustainable fashion destination
            </h2>
          </motion.div>
        </div>

        {/*  Right form panel  */}
        <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
          {/*
            key={flow.step} causes Framer to re-animate the card on every step
            change, giving a smooth page-turn feel for free.
          */}
          <motion.div
            key={flow.step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src={logo}
                alt="blueprint_crm"
                className="h-14 w-14 object-contain"
                loading="eager"
              />
            </div>

            {/* Title + subtitle */}
            <h1 className="text-2xl font-extrabold text-center" style={{ color: DEEP_GREEN }}>
              {STEP_TITLE[flow.step]}
            </h1>
            <StepSubtitle step={flow.step} email={flow.email} resetEmail={flow.resetEmail} />

            {/* Step views */}
            {flow.step === "credentials"   && <CredentialsForm    flow={flow} />}
            {flow.step === "otp"           && <LoginOtpPanel      flow={flow} />}
            {flow.step === "forgot-email"  && <ForgotEmailPanel   flow={flow} />}
            {flow.step === "forgot-otp"    && <ForgotOtpPanel     flow={flow} />}
            {flow.step === "forgot-reset"  && <ResetPasswordPanel flow={flow} />}
          </motion.div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: "10px",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}
