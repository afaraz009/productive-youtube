// PROTOTYPE — throwaway. Hosts the 3 popup variants and the floating switcher.
// Only mounted under vite dev (import.meta.env.DEV). In production, the real PopupApp ships.
import React, { useEffect, useState } from "react";
import type { Settings, ExtensionMode } from "../../types/types";
import PopupApp from "../components/PopupApp";
import VariantA from "./VariantA";
import VariantA1 from "./VariantA1";
import VariantA2 from "./VariantA2";
import VariantA3 from "./VariantA3";
import VariantA4 from "./VariantA4";
import VariantA5 from "./VariantA5";
import VariantB from "./VariantB";
import VariantC from "./VariantC";
import PrototypeSwitcher from "./PrototypeSwitcher";

// Default settings used when chrome.storage isn't available (running under vite dev).
const DEFAULT_SETTINGS: Settings = {
  mode: "focus",
  transcriptLanguage: "english",
  removeShorts: true,
  removeShortsButton: true,
  removeHomepageVideos: true,
  removeWatchPageSuggestions: true,
  showTranscript: true,
  removeComments: true,
  aiService: "chatgpt",
  aiPrompts: { translate: "", summarize: "", vocabulary: "", urduScript: "", romanUrdu: "" },
  theme: "dark",
};

const VARIANTS = [
  { key: "current", name: "Current (production)" },
  { key: "A", name: "One Big Switch" },
  { key: "A1", name: "Hero + receipt" },
  { key: "A2", name: "Press and hold" },
  { key: "A3", name: "Status-first (giant word)" },
  { key: "A4", name: "Now / not-now" },
  { key: "A5", name: "Status + interactive pills" },
  { key: "B", name: "Intent picker" },
  { key: "C", name: "Focus⇄Relax slider" },
];

function readVariantFromUrl(): string {
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get("variant");
  return VARIANTS.some((x) => x.key === v) ? (v as string) : "current";
}

function writeVariantToUrl(key: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("variant", key);
  window.history.replaceState(null, "", url.toString());
}

const PrototypeShell: React.FC = () => {
  const [variant, setVariant] = useState<string>(readVariantFromUrl());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Try chrome.storage first; fall back to in-memory defaults.
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(null, (r) => {
        if (r && Object.keys(r).length > 0) {
          setSettings({ ...DEFAULT_SETTINGS, ...(r as Settings) });
        }
      });
    }
  }, []);

  // Apply theme to <html> so backgrounds line up.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const changeVariant = (key: string) => {
    setVariant(key);
    writeVariantToUrl(key);
  };

  const applyModePreset = (mode: ExtensionMode): Settings => {
    const presets =
      mode === "focus"
        ? {
            removeShorts: true,
            removeShortsButton: true,
            removeHomepageVideos: true,
            removeWatchPageSuggestions: true,
            showTranscript: true,
            removeComments: true,
          }
        : {
            removeShorts: false,
            removeShortsButton: false,
            removeHomepageVideos: false,
            removeWatchPageSuggestions: false,
            showTranscript: false,
            removeComments: false,
          };
    return { ...settings, mode, ...presets };
  };

  const onModeChange = (mode: ExtensionMode) => {
    const next = applyModePreset(mode);
    setSettings(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set(next);
    }
  };

  const onToggleTheme = () => {
    const next: Settings = { ...settings, theme: settings.theme === "dark" ? "light" : "dark" };
    setSettings(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ theme: next.theme });
    }
  };

  const onSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [key]: value });
    }
  };

  return (
    <>
      {variant === "current" && <PopupApp />}
      {variant === "A" && (
        <VariantA settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "A1" && (
        <VariantA1 settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "A2" && (
        <VariantA2 settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "A3" && (
        <VariantA3 settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "A4" && (
        <VariantA4 settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "A5" && (
        <VariantA5
          settings={settings}
          onModeChange={onModeChange}
          onToggleTheme={onToggleTheme}
          onSettingChange={onSettingChange}
        />
      )}
      {variant === "B" && (
        <VariantB settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}
      {variant === "C" && (
        <VariantC settings={settings} onModeChange={onModeChange} onToggleTheme={onToggleTheme} />
      )}

      {/* State read-out so the user can see what changed on every switch */}
      <div
        style={{
          position: "fixed",
          right: 8,
          top: 8,
          maxWidth: 230,
          padding: "8px 10px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          lineHeight: 1.4,
          background: "rgba(15,23,42,0.92)",
          color: "#e2e8f0",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>state</div>
        <div>variant: {variant}</div>
        <div>mode: {settings.mode}</div>
        <div>theme: {settings.theme}</div>
        <div>ai: {settings.aiService}</div>
        <div style={{ marginTop: 4, opacity: 0.7 }}>
          blocks: {[
            settings.removeShorts && "shorts",
            settings.removeHomepageVideos && "home",
            settings.removeWatchPageSuggestions && "side",
            settings.removeComments && "comm",
            settings.showTranscript && "tx",
          ].filter(Boolean).join(", ") || "none"}
        </div>
      </div>

      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={changeVariant} />
    </>
  );
};

export default PrototypeShell;
