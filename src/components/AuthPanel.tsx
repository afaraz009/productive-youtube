import React, { useState } from "react";
import type { AuthResponse } from "../auth/types";

type Mode = "login" | "signup";

interface AuthPanelProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  busy: boolean;
  error: string | null;
  onSignIn: (email: string, password: string) => Promise<AuthResponse>;
  onSignUp: (email: string, password: string) => Promise<AuthResponse>;
  onClearError: () => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 text-xs font-medium rounded-lg border border-[#e5ebe7] dark:border-slate-700 bg-[#faf9f5] dark:bg-slate-800 text-[#263e40] dark:text-slate-100 placeholder-[#879493] focus:outline-none focus:border-[#086972] focus:ring-2 focus:ring-[#086972]/30 transition-all";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPanel: React.FC<AuthPanelProps> = ({
  mode,
  onModeChange,
  busy,
  error,
  onSignIn,
  onSignUp,
  onClearError,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = () => {
    onModeChange(mode === "login" ? "signup" : "login");
    setLocalError(null);
    setNotice(null);
    onClearError();
  };

  const submit = async () => {
    if (busy) return;
    setNotice(null);

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    setLocalError(null);

    if (mode === "login") {
      const res = await onSignIn(trimmed, password);
      if (res.success) setPassword("");
      return;
    }

    const res = await onSignUp(trimmed, password);
    if (res.success) {
      setPassword("");
      if (res.needsEmailConfirmation) {
        setNotice("Check your email to confirm your account, then log in.");
        onModeChange("login");
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void submit();
  };

  const shownError = localError ?? error;

  return (
    <div className="space-y-4">
      {/* Email Input */}
      <div>
        <label htmlFor="auth-email" className="sr-only">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          className={inputClass}
        />
      </div>

      {/* Password Input with Inline Show / Hide Toggle */}
      <div className="relative">
        <label htmlFor="auth-password" className="sr-only">
          Password
        </label>
        <input
          id="auth-password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Passcode"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          className={`${inputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#086972] dark:text-teal-300 hover:text-[#07545b] transition-colors"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {/* Helper Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setNotice(
              mode === "login"
                ? "Use the email and 8+ character password you registered with."
                : "Choose an email and at least 8 characters for your password."
            )
          }
          className="text-[11px] font-semibold text-[#879493] dark:text-slate-400 hover:text-[#086972] dark:hover:text-teal-300 transition-colors"
        >
          {mode === "login"
            ? "Having trouble in sign in?"
            : "Password must be at least 8 characters"}
        </button>
      </div>

      {/* Validation Error / Status Notice */}
      {shownError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {shownError}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="text-xs text-[#086972] dark:text-teal-300 font-medium"
        >
          {notice}
        </p>
      )}

      {/* Primary Submit Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#086972] hover:bg-[#07545b] text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>

      {/* Mode Switch Prompt */}
      <div className="pt-3 border-t border-[#e5ebe7] dark:border-slate-800 text-center">
        <button
          type="button"
          onClick={switchMode}
          className="text-[11px] text-[#879493] dark:text-slate-400 hover:text-[#263e40] dark:hover:text-slate-100 transition-colors"
        >
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <span className="font-bold text-[#086972] dark:text-teal-300">
                Sign up now
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span className="font-bold text-[#086972] dark:text-teal-300">
                Sign in
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthPanel;