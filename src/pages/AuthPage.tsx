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
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#faf9f5] dark:bg-slate-950 text-[#263e40] dark:text-slate-100 font-sans selection:bg-[#086972]/20">
      {/* Top Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-7 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#086972] text-white text-xs font-bold flex items-center justify-center shadow-sm">
              YT
            </span>
            <span className="text-lg font-bold tracking-tight text-[#263e40] dark:text-slate-100">
              Productive YouTube
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#e5ebe7] dark:border-slate-800 flex items-center gap-2.5 text-[11px] font-medium text-[#879493] dark:text-slate-400">
            <span>Your mindful YouTube experience</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </header>

      {/* Main Centered Area + Decorative Line-Art Illustration */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        {/* Background Editorial Illustration (Desktop / Tablet) */}
        <svg
          className="pointer-events-none select-none hidden md:block absolute inset-0 w-full h-full max-w-5xl mx-auto"
          viewBox="0 0 1100 620"
          fill="none"
          aria-hidden="true"
        >
          {/* Ground baseline */}
          <line
            x1="120"
            y1="495"
            x2="980"
            y2="495"
            stroke="#dce5e2"
            strokeWidth="1.5"
          />

          {/* Left decorative squiggle & dot */}
          <path
            d="M170 220 C185 235, 200 200, 212 220 C222 235, 232 205, 248 212 C265 218, 275 198, 290 212"
            stroke="#263e40"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="275" cy="182" r="3" stroke="#263e40" strokeWidth="1.2" />

          {/* Left wireframe note card */}
          <rect
            x="200"
            y="265"
            width="92"
            height="72"
            fill="#faf9f5"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          <line x1="220" y1="292" x2="262" y2="292" stroke="#263e40" strokeWidth="1.2" />
          <line x1="220" y1="312" x2="274" y2="312" stroke="#263e40" strokeWidth="1.2" />
          <circle cx="322" cy="342" r="5" stroke="#263e40" strokeWidth="1.2" />

          {/* Left sage-teal accent block */}
          <rect x="160" y="365" width="76" height="130" fill="#d9ebe6" />
          <circle cx="178" cy="385" r="3.5" fill="#086972" />
          <circle cx="212" cy="395" r="3.5" fill="#086972" />
          <circle cx="192" cy="418" r="3.5" fill="#086972" />
          <circle cx="175" cy="445" r="3.5" fill="#086972" />
          <circle cx="215" cy="442" r="3.5" fill="#086972" />
          <circle cx="195" cy="472" r="3.5" fill="#086972" />

          {/* Left white card with upward arrow */}
          <rect
            x="248"
            y="405"
            width="68"
            height="90"
            fill="#ffffff"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          <path
            d="M272 475 Q286 452 290 426 M282 434 L290 426 L297 435"
            stroke="#086972"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right wireframe speech bubble */}
          <rect
            x="768"
            y="222"
            width="54"
            height="42"
            fill="#faf9f5"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          <line x1="780" y1="238" x2="808" y2="238" stroke="#263e40" strokeWidth="1.2" />
          <line x1="780" y1="249" x2="800" y2="249" stroke="#263e40" strokeWidth="1.2" />

          {/* Right decorative squiggle */}
          <path
            d="M915 262 C930 274, 944 244, 956 262 C966 274, 976 248, 992 254 C1006 258, 1014 242, 1026 254"
            stroke="#263e40"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="1015" cy="222" r="2.8" stroke="#263e40" strokeWidth="1.2" />

          {/* Right sage-teal accent block */}
          <rect x="920" y="385" width="72" height="110" fill="#d9ebe6" />
          <circle cx="938" cy="405" r="3.5" fill="#086972" />
          <circle cx="972" cy="415" r="3.5" fill="#086972" />
          <circle cx="952" cy="442" r="3.5" fill="#086972" />
          <circle cx="936" cy="468" r="3.5" fill="#086972" />
          <circle cx="974" cy="465" r="3.5" fill="#086972" />

          {/* Seated person with laptop on white pedestal */}
          <rect
            x="832"
            y="362"
            width="74"
            height="133"
            fill="#ffffff"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          {/* Person hair & head */}
          <path
            d="M884 252 C906 252, 916 278, 932 292 L892 294 Z"
            fill="#263e40"
          />
          <circle cx="888" cy="245" r="7" fill="#263e40" />
          <circle cx="876" cy="260" r="11" fill="#263e40" />
          <path
            d="M866 258 C864 268, 870 276, 880 274 C885 273, 887 266, 884 260 Z"
            fill="#ffffff"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          {/* Patterned dark top */}
          <path
            d="M862 284 L894 284 L904 334 L856 334 Z"
            fill="#263e40"
          />
          <line x1="872" y1="296" x2="878" y2="302" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="888" y1="306" x2="882" y2="313" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="870" y1="318" x2="877" y2="322" stroke="#ffffff" strokeWidth="1.2" />
          {/* Trousers & shoes */}
          <path
            d="M856 334 L816 346 L810 412 L824 412 L832 362 L898 362 L898 334 Z"
            fill="#ffffff"
            stroke="#263e40"
            strokeWidth="1.2"
          />
          <path d="M808 412 L824 412 L822 424 L802 424 Z" fill="#263e40" />
          {/* Arms & teal laptop */}
          <path
            d="M866 296 L836 326 L814 334"
            stroke="#263e40"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M866 296 L836 326 L814 334"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M782 292 L796 334 L834 334"
            stroke="#086972"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Central White Card */}
        <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-white dark:bg-slate-900 px-8 sm:px-10 py-10 shadow-sm border border-[#e5ebe7] dark:border-slate-800">
          {auth.loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#879493] dark:text-slate-400">
                Loading…
              </p>
            </div>
          ) : auth.user ? (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#a18a4c] uppercase">
                  YOUR ACCOUNT
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[#263e40] dark:text-slate-100 mt-1">
                  You’re Signed In
                </h1>
                <p className="mt-1.5 text-xs text-[#879493] dark:text-slate-400">
                  Your notes and focus preferences are ready to sync.
                </p>
              </div>

              {justSignedIn && (
                <p
                  role="status"
                  className="rounded-xl bg-[#e8f2ef] dark:bg-teal-950/50 px-3.5 py-2.5 text-center text-xs font-medium text-[#086972] dark:text-teal-300"
                >
                  You’re signed in. This tab will close in a moment.
                </p>
              )}

              <AccountBar
                user={auth.user}
                busy={auth.busy}
                onSignOut={() => void auth.signOut()}
              />

              <button
                type="button"
                onClick={closeThisTab}
                className="w-full py-2.5 px-4 rounded-lg border border-[#cbded8] dark:border-slate-700 text-xs font-semibold text-[#086972] dark:text-teal-300 hover:bg-[#e8f2ef] dark:hover:bg-slate-800 transition-colors"
              >
                Close this tab
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-7">
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#a18a4c] uppercase">
                  YOUR EXPERIENCE
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[#263e40] dark:text-slate-100 mt-1">
                  {mode === "login" ? "Member Login" : "Create Account"}
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#879493] dark:text-slate-400 max-w-[260px] mx-auto">
                  {mode === "login"
                    ? "Hey, Enter your details to get sign in to your account"
                    : "Enter your details below to create your Productive YouTube account"}
                </p>
              </div>

              <AuthPanel
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
      </main>

      {/* Bottom Copyright & Policy Footer */}
      <footer className="relative z-10 pb-6 pt-2 text-center text-[11px] font-medium text-[#879493] dark:text-slate-400">
        <span>Copyright @ProductiveYouTube 2026</span>
        <span className="mx-2 text-[#cbded8] dark:text-slate-700">|</span>
        <a
          href="#privacy"
          onClick={(e) => e.preventDefault()}
          className="hover:text-[#086972] dark:hover:text-teal-300 transition-colors"
        >
          Privacy Policy
        </a>
      </footer>
    </div>
  );
};

export default AuthPage;