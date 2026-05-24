// PROTOTYPE — throwaway. Variant A1: "Hero + receipt"
// Same giant button as A, but a tiny ticker reveals WHAT changes when you flip.
import React from "react";
import { Zap, Coffee, MoreHorizontal, Moon, Sun, Check, X } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

const VariantA1: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  const isFocus = settings.mode === "focus";

  // Receipt items — show what is on/off in this mode.
  const items: { label: string; on: boolean }[] = [
    { label: "Shorts", on: settings.removeShorts },
    { label: "Home feed", on: settings.removeHomepageVideos },
    { label: "Sidebar", on: settings.removeWatchPageSuggestions },
    { label: "Comments", on: settings.removeComments },
  ];

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans select-none relative overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">
          Focus&nbsp;Tube
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            {settings.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="px-6 pt-3 pb-6">
        <button
          onClick={() => onModeChange(isFocus ? "relax" : "focus")}
          className={`w-full rounded-[36px] flex flex-col items-center justify-center pt-10 pb-9 transition-all duration-500 relative overflow-hidden ${
            isFocus
              ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]"
              : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_20px_60px_-20px_rgba(245,158,11,0.6)]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          {isFocus ? (
            <Zap size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          ) : (
            <Coffee size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          )}
          <div className="text-white text-[28px] font-black mt-3 tracking-tight drop-shadow">
            {isFocus ? "Focus" : "Relax"}
          </div>
          <div className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.25em] mt-1">
            {isFocus ? "Deep work" : "Default YouTube"}
          </div>
        </button>

        {/* Receipt — tells the user what is actually being changed */}
        <div className="mt-4 px-1">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Right now we're hiding
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((it) => (
              <span
                key={it.label}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                  it.on
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-200/60 dark:bg-slate-800/60 text-slate-400 line-through"
                }`}
              >
                {it.on ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                {it.label}
              </span>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">
            Tap the button to switch
          </p>
        </div>
      </div>
    </div>
  );
};

export default VariantA1;
