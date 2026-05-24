// PROTOTYPE — throwaway. Variant A5: A1 + A3 merged.
// Status-first hero (giant mode word, live pill) + interactive receipt pills
// (tap to toggle individual blocks). The top-right "settings" icon opens a
// functional sheet for AI provider and transcript language.
import React, { useState } from "react";
import {
  Zap,
  Coffee,
  Moon,
  Sun,
  Check,
  Eye,
  ChevronDown,
  Cpu,
  Languages,
  Video,
  Home,
  Layout,
  MessageSquare,
  FileText,
} from "lucide-react";
import type {
  Settings,
  ExtensionMode,
  AIService,
  TranscriptLanguage,
} from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

type BlockKey =
  | "removeShorts"
  | "removeHomepageVideos"
  | "removeWatchPageSuggestions"
  | "removeComments"
  | "showTranscript";

interface Block {
  key: BlockKey;
  label: string;
  icon: React.ElementType;
  // `on` means "actively hiding / showing transcript". For removeX keys, on=true is settings[key]=true.
  // For showTranscript, on=true is settings.showTranscript=true (= transcript visible).
  invertCopy?: boolean;
}

const BLOCKS: Block[] = [
  { key: "removeShorts", label: "Shorts", icon: Video },
  { key: "removeHomepageVideos", label: "Home feed", icon: Home },
  { key: "removeWatchPageSuggestions", label: "Sidebar", icon: Layout },
  { key: "removeComments", label: "Comments", icon: MessageSquare },
  { key: "showTranscript", label: "Transcript", icon: FileText, invertCopy: true },
];

const AI_OPTIONS: { value: AIService; label: string }[] = [
  { value: "chatgpt", label: "OpenAI ChatGPT" },
  { value: "gemini", label: "Google Gemini" },
  { value: "claude", label: "Anthropic Claude" },
  { value: "grok", label: "xAI Grok" },
];

const LANG_OPTIONS: { value: TranscriptLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
  { value: "roman-urdu", label: "Roman Urdu" },
];

const VariantA5: React.FC<Props> = ({
  settings,
  onModeChange,
  onToggleTheme,
  onSettingChange,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isFocus = settings.mode === "focus";
  const accent = isFocus ? "text-blue-500 dark:text-blue-400" : "text-amber-500 dark:text-amber-400";
  const dotBg = isFocus ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans select-none relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">
          Focus&nbsp;Tube
        </span>
        <button
          onClick={onToggleTheme}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {settings.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 pt-4 pb-5">
        {/* Live status pill */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/5">
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className={`absolute inset-0 rounded-full ${dotBg} animate-ping opacity-60`} />
              <span className={`relative w-2 h-2 rounded-full ${dotBg}`} />
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active on youtube.com
            </span>
          </div>
        </div>

        {/* Giant word hero */}
        <div className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            {isFocus ? (
              <Zap size={28} strokeWidth={2.5} className={accent} />
            ) : (
              <Coffee size={28} strokeWidth={2.5} className={accent} />
            )}
          </div>
          <h1 className={`text-[62px] font-black leading-none tracking-tight ${accent}`}>
            {isFocus ? "Focus" : "Relax"}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-2">
            {isFocus ? "Deep work mode" : "Default YouTube"}
          </p>
        </div>

        {/* Switch button — slim, not the hero */}
        <button
          onClick={() => onModeChange(isFocus ? "relax" : "focus")}
          className="w-full py-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors text-[13px] font-bold text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5"
        >
          Switch to {isFocus ? "Relax" : "Focus"}
        </button>
      </div>

      {/* Interactive receipt — tap any pill to toggle */}
      <div className="px-6 pb-4">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 flex items-center justify-between">
          <span>Tap to customize</span>
          <span className="text-slate-300 dark:text-slate-600 normal-case tracking-normal font-medium">
            {countActive(settings)}/5 on
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BLOCKS.map((b) => {
            const on = settings[b.key] as boolean;
            const Icon = b.icon;
            return (
              <button
                key={b.key}
                onClick={() => onSettingChange(b.key, !on)}
                className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  on
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                    : "bg-slate-200/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-300/60 dark:hover:bg-slate-700/60"
                }`}
                title={
                  b.invertCopy
                    ? on ? "Transcript shown · tap to hide" : "Transcript hidden · tap to show"
                    : on ? `Hiding ${b.label.toLowerCase()} · tap to show` : `Showing ${b.label.toLowerCase()} · tap to hide`
                }
              >
                <Icon size={11} strokeWidth={2.8} />
                <span>{b.label}</span>
                {on ? (
                  <Check size={10} strokeWidth={3.5} className="opacity-80" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible advanced section */}
      <div className="px-6 pb-5">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
        >
          <span>Advanced</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>

        {advancedOpen && (
          <div className="mt-2 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AdvancedSection settings={settings} onSettingChange={onSettingChange} />
          </div>
        )}
      </div>
    </div>
  );
};

function countActive(s: Settings): number {
  return [
    s.removeShorts,
    s.removeHomepageVideos,
    s.removeWatchPageSuggestions,
    s.removeComments,
    s.showTranscript,
  ].filter(Boolean).length;
}

const AdvancedSection: React.FC<{
  settings: Settings;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}> = ({ settings, onSettingChange }) => {
  return (
    <>
      {/* AI provider */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={11} className="text-blue-500" />
          <h3 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            AI provider
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {AI_OPTIONS.map((o) => {
            const active = settings.aiService === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onSettingChange("aiService", o.value)}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors border text-left ${
                  active
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    : "bg-white/40 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.07]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Transcript language */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Languages size={11} className="text-emerald-500" />
          <h3 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            Transcript language
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {LANG_OPTIONS.map((o) => {
            const active = settings.transcriptLanguage === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onSettingChange("transcriptLanguage", o.value)}
                className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-colors border ${
                  active
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-white/40 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.07]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Reveal-all shortcut */}
      <section>
        <button
          onClick={() => {
            onSettingChange("removeShorts", false);
            onSettingChange("removeHomepageVideos", false);
            onSettingChange("removeWatchPageSuggestions", false);
            onSettingChange("removeComments", false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
        >
          <Eye size={12} /> Show everything (reset blocks)
        </button>
      </section>
    </>
  );
};

export default VariantA5;
