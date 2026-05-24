// PROTOTYPE — throwaway. Variant C: "Focus⇄Relax slider"
// Question: what if Focus/Relax isn't binary but a slider? Drag the dot,
// the popup updates a single number; everything else is derived.
import React from "react";
import { Zap, Coffee, Moon, Sun, Cpu } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

// 0 = full relax, 100 = full focus. Snaps to 0/50/100.
const VariantC: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  // Derive starting position from current mode.
  const position = settings.mode === "focus" ? 100 : 0;

  // Three snap points.
  const stops = [
    { value: 0, label: "Relax", blurb: "Full YouTube", icon: Coffee, mode: "relax" as ExtensionMode },
    { value: 50, label: "Light", blurb: "Hide shorts only", icon: Coffee, mode: "focus" as ExtensionMode },
    { value: 100, label: "Focus", blurb: "Block everything", icon: Zap, mode: "focus" as ExtensionMode },
  ];

  // Active stop by closest value.
  const activeStop = stops.reduce((closest, s) =>
    Math.abs(s.value - position) < Math.abs(closest.value - position) ? s : closest,
  stops[0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    const snap = stops.reduce((closest, s) =>
      Math.abs(s.value - v) < Math.abs(closest.value - v) ? s : closest,
    stops[0]);
    onModeChange(snap.mode);
  };

  // Track gradient driven by position.
  const trackBg = `linear-gradient(90deg, #f59e0b 0%, #f59e0b ${position}%, #1e293b ${position}%, #1e293b 100%)`;

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans select-none px-6 pt-5 pb-6">
      {/* Top: brand + theme */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] font-black tracking-[0.25em] uppercase text-slate-400">
          Focus&nbsp;Tube
        </span>
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {settings.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Current state read-out */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-3 shadow-inner">
          <activeStop.icon
            size={30}
            strokeWidth={2.4}
            className={position > 50 ? "text-blue-500" : position > 0 ? "text-emerald-500" : "text-amber-500"}
          />
        </div>
        <h2 className="text-[28px] font-black tracking-tight leading-none">
          {activeStop.label}
        </h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-1.5 uppercase tracking-[0.15em]">
          {activeStop.blurb}
        </p>
      </div>

      {/* The slider */}
      <div className="relative px-1">
        <input
          type="range"
          min={0}
          max={100}
          step={50}
          value={position}
          onChange={handleChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: trackBg }}
        />
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background: white;
            border: 3px solid #3b82f6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            cursor: grab;
          }
          input[type='range']::-webkit-slider-thumb:active { cursor: grabbing; }
        `}</style>

        {/* Tick labels under the track */}
        <div className="flex justify-between mt-4 px-0.5">
          {stops.map((s) => (
            <div
              key={s.value}
              className={`text-[10px] font-black uppercase tracking-wider ${
                activeStop.value === s.value
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-600"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Single footer link: AI */}
      <div className="mt-7 pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <Cpu size={13} />
          <span className="text-[11px] font-semibold capitalize">{settings.aiService}</span>
        </div>
        <button className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.15em] hover:text-blue-700">
          Change
        </button>
      </div>
    </div>
  );
};

export default VariantC;
