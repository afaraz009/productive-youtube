// PROTOTYPE — throwaway. Variant A2: "Press and hold"
// Tap is too easy — adds a hold gesture so the switch feels deliberate.
import React, { useEffect, useRef, useState } from "react";
import { Zap, Coffee, Moon, Sun, MoreHorizontal } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

const HOLD_MS = 700;

const VariantA2: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  const isFocus = settings.mode === "focus";
  const [progress, setProgress] = useState(0); // 0..1
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setProgress(0);
  };

  const tick = (now: number) => {
    if (startRef.current == null) startRef.current = now;
    const p = Math.min(1, (now - startRef.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      onModeChange(isFocus ? "relax" : "focus");
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  const fillPct = Math.round(progress * 100);

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

      <div className="px-6 pt-4 pb-8">
        <div
          onMouseDown={start}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchEnd={stop}
          onTouchCancel={stop}
          className={`select-none w-full aspect-square rounded-[36px] flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden cursor-pointer ${
            isFocus ? "bg-blue-950/90" : "bg-amber-950/90"
          }`}
          style={{ userSelect: "none" }}
        >
          {/* Fill layer — grows as user holds */}
          <div
            className={`absolute inset-0 transition-[clip-path] duration-75 ease-linear ${
              isFocus
                ? "bg-gradient-to-br from-blue-500 to-blue-700"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}
            style={{
              clipPath: `inset(${100 - fillPct}% 0 0 0)`,
              opacity: fillPct === 0 ? 1 : 1,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {isFocus ? (
              <Zap size={72} strokeWidth={2.5} className="text-white drop-shadow-lg" />
            ) : (
              <Coffee size={72} strokeWidth={2.5} className="text-white drop-shadow-lg" />
            )}
            <div className="text-white text-[34px] font-black mt-4 tracking-tight drop-shadow">
              {isFocus ? "Focus" : "Relax"}
            </div>
            <div className="text-white/80 text-[11px] font-semibold uppercase tracking-[0.25em] mt-1">
              {progress > 0
                ? "Keep holding…"
                : isFocus
                  ? "Hold to relax"
                  : "Hold to focus"}
            </div>
          </div>
        </div>

        {/* Hint line + progress dots */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                progress * 4 > i ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VariantA2;
