// AuthPage.tsx controls which screen to display based on the user's auth state. It is used in the popup and in the auth tab.

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthPanel from "../components/AuthPanel";
import AccountBar from "../components/AccountBar";

type Mode = "login" | "signup";

const modeFromHash = (): Mode =>
  window.location.hash === "#signup" ? "signup" : "login";

function closeThisTab() {
  chrome.tabs.getCurrent((tab) => {
    if (tab?.id !== undefined) chrome.tabs.remove(tab.id);
    else window.close();
  });
}

const AuthPage: React.FC = () => {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(modeFromHash);
  const [justSignedIn, setJustSignedIn] = useState(false);
  // null = not known yet; true = page opened while signed out
  const startedSignedOut = useRef<boolean | null>(null);

  // React if the popup re-opens this tab with a different hash
  useEffect(() => {
    const onHash = () => setMode(modeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const changeMode = (m: Mode) => {
    setMode(m);
    history.replaceState(null, "", `#${m}`);
  };

  // Remember whether the user was signed out when the page opened
  useEffect(() => {
    if (!auth.loading && startedSignedOut.current === null) {
      startedSignedOut.current = !auth.user;
    }
  }, [auth.loading, auth.user]);

  // Auto-close after a fresh login
  useEffect(() => {
    if (auth.user && startedSignedOut.current) {
      setJustSignedIn(true);
      const t = window.setTimeout(closeThisTab, 2000);
      return () => window.clearTimeout(t);
    }
  }, [auth.user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {/* Header, matches the popup */}
        <div className="bg-[#421454] border-t-2 border-t-[#802C62] px-6 py-5 flex items-center gap-3">
          <svg
            className="w-9 h-9 flex-shrink-0 text-white"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="18" cy="18" r="15" fill="#802C62" stroke="currentColor" strokeWidth="2" />
            <path d="M15 12.5v11l9-5.5-9-5.5z" fill="currentColor" />
          </svg>
          <h1 className="text-sm font-semibold text-white tracking-tight">
            Productive YouTube
          </h1>
        </div>

        <div className="px-6 py-6">
          {auth.loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : auth.user ? (
            <div className="space-y-4">
              {justSignedIn && (
                <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
                  You're signed in. This tab will close in a moment.
                </p>
              )}
              <AccountBar
                user={auth.user}
                busy={auth.busy}
                onSignOut={() => void auth.signOut()}
              />
              <button
                onClick={closeThisTab}
                className="w-full px-3 py-2.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close this tab
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {mode === "login" ? "Log in" : "Create your account"}
              </h2>
              <AuthPanel
              //signup ... passes the current mode state from AuthPage to AuthPanel 
                mode={mode}
                onModeChange={changeMode}
                busy={auth.busy}
                error={auth.error}
                onSignIn={auth.signIn}
                onSignUp={auth.signUp}
                onClearError={auth.clearError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;