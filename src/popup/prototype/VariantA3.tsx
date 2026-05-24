// PROTOTYPE — throwaway. Variant A3: "Status-first"
// The hero is the mode word itself, blown up. Above it a thin pill confirms
// "active on youtube.com" — emphasizes STATE more than action.
import React from "react";
import { Zap, Coffee, Moon, Sun, MoreHorizontal, Circle } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

const VariantA3: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  const isFocus = settings.mode === "focus";
  const accent = isFocus ? "text-blue-500 dark:text-blue-400" : "text-amber-500 dark:text-amber-400";
  const dotBg = isFocus ? "bg-blue-500" : "bg-amber-500";

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

      <div className="px-6 pt-6 pb-7">
        {/* Live status pill */}
        <div className="flex justify-center mb-5">
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

        {/* Hero — the word IS the hero */}
        <div className="text-center pt-2 pb-6">
          <div className="flex items-center justify-center mb-3">
            {isFocus ? (
              <Zap size={32} strokeWidth={2.5} className={accent} />
            ) : (
              <Coffee size={32} strokeWidth={2.5} className={accent} />
            )}
          </div>
          <h1 className={`text-[68px] font-black leading-none tracking-tight ${accent}`}>
            {isFocus ? "Focus" : "Relax"}
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-3">
            {isFocus ? "Deep work mode" : "Default YouTube"}
          </p>
        </div>

        {/* The action — a slim flat button, intentionally NOT the hero */}
        <button
          onClick={() => onModeChange(isFocus ? "relax" : "focus")}
          className="w-full py-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors text-[13px] font-bold text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5"
        >
          Switch to {isFocus ? "Relax" : "Focus"}
        </button>
      </div>
    </div>
  );
};

export default VariantA3;
