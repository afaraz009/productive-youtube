// PROTOTYPE — throwaway. Variant A4: "Now / not-now"
// Splits the popup vertically: active mode is the giant hero, the OTHER mode
// is a small swap card pinned below — always advertising the alternative.
import React from "react";
import { Zap, Coffee, Moon, Sun, MoreHorizontal, ArrowDown } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

const VariantA4: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  const isFocus = settings.mode === "focus";
  const activeMode: ExtensionMode = isFocus ? "focus" : "relax";
  const otherMode: ExtensionMode = isFocus ? "relax" : "focus";

  const heroIsFocus = activeMode === "focus";

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

      <div className="px-5 pt-3 pb-5 space-y-3">
        {/* Active hero card */}
        <div
          className={`w-full rounded-[32px] flex flex-col items-center justify-center pt-9 pb-8 relative overflow-hidden ${
            heroIsFocus
              ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]"
              : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_20px_60px_-20px_rgba(245,158,11,0.6)]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="absolute top-3 left-4 text-white/70 text-[9px] font-black uppercase tracking-[0.25em]">
            Now
          </div>
          {heroIsFocus ? (
            <Zap size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          ) : (
            <Coffee size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          )}
          <div className="text-white text-[30px] font-black mt-3 tracking-tight drop-shadow">
            {heroIsFocus ? "Focus" : "Relax"}
          </div>
          <div className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.25em] mt-1">
            {heroIsFocus ? "Deep work" : "Default YouTube"}
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex justify-center -my-1">
          <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm">
            <ArrowDown size={14} className="text-slate-400" />
          </div>
        </div>

        {/* Swap card — always shows what you'd switch to */}
        <button
          onClick={() => onModeChange(otherMode)}
          className="w-full rounded-2xl flex items-center gap-4 px-4 py-3.5 bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] border border-black/5 dark:border-white/5 transition-colors text-left"
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              otherMode === "focus"
                ? "bg-blue-500/15 text-blue-500 dark:text-blue-400"
                : "bg-amber-500/15 text-amber-500 dark:text-amber-400"
            }`}
          >
            {otherMode === "focus" ? (
              <Zap size={20} strokeWidth={2.5} />
            ) : (
              <Coffee size={20} strokeWidth={2.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Switch to
            </div>
            <div className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">
              {otherMode === "focus" ? "Focus" : "Relax"}
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-tight">
              {otherMode === "focus" ? "Hide shorts, feed, comments" : "Show everything"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default VariantA4;
