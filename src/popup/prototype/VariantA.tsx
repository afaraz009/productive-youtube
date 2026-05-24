// PROTOTYPE — throwaway. Variant A: "One Big Switch"
// Question: what if the whole popup is just one dominant Focus/Relax toggle,
// and everything else (settings, AI provider) hides behind a tiny menu?
import React, { useState } from "react";
import { Zap, Coffee, MoreHorizontal, Moon, Sun } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

const VariantA: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFocus = settings.mode === "focus";

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans select-none relative overflow-hidden">
      {/* Tiny top bar — just brand + overflow */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">
          Focus&nbsp;Tube
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {settings.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="More"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* The hero — one giant switch */}
      <div className="px-6 pt-4 pb-8">
        <button
          onClick={() => onModeChange(isFocus ? "relax" : "focus")}
          className={`w-full aspect-square rounded-[36px] flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden ${
            isFocus
              ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.6)]"
              : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_20px_60px_-20px_rgba(245,158,11,0.6)]"
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          {isFocus ? (
            <Zap size={72} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          ) : (
            <Coffee size={72} strokeWidth={2.5} className="text-white drop-shadow-lg" />
          )}
          <div className="text-white text-[34px] font-black mt-4 tracking-tight drop-shadow">
            {isFocus ? "Focus" : "Relax"}
          </div>
          <div className="text-white/80 text-[12px] font-semibold uppercase tracking-[0.25em] mt-1">
            {isFocus ? "Deep work" : "Default YouTube"}
          </div>
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
          Tap to switch · changes apply instantly
        </p>
      </div>

      {/* Slide-down overflow menu */}
      {menuOpen && (
        <div className="px-5 pb-5 border-t border-black/5 dark:border-white/5 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Advanced
          </div>
          <button className="block w-full text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 py-2 hover:text-blue-500">
            Customize what's hidden →
          </button>
          <button className="block w-full text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 py-2 hover:text-blue-500">
            AI provider · {settings.aiService} →
          </button>
        </div>
      )}
    </div>
  );
};

export default VariantA;
