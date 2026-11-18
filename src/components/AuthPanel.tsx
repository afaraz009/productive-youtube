//AuthPanel.tsx displays the form 

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
  "w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#802C62] focus:ring-1 focus:ring-[#802C62]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//signup ... the auth panel recieves the props from AuthPage 
const AuthPanel: React.FC<AuthPanelProps> = ({
  mode,
  onModeChange,
  busy,
  error,
  onSignIn,
  //signup ... 
  onSignUp,
  onClearError,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="space-y-3">
      <div>
        <label
          htmlFor="auth-email"
          className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
        >
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="auth-password"
          className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
        >
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          className={inputClass}
        />
      </div>

      {shownError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {shownError}
        </p>
      )}
      {notice && (
        <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
          {notice}
        </p>
      )}

      <button
        onClick={() => void submit()}
        disabled={busy}
        className="w-full px-3 py-2.5 text-sm font-medium rounded-md bg-[#802C62] text-white hover:bg-[#6d2653] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </button>

      <button
        onClick={switchMode}
        className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-[#802C62] dark:hover:text-slate-200 transition-colors"
      >
        {mode === "login"
          ? "No account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
};

export default AuthPanel;