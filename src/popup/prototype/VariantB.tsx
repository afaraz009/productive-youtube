// PROTOTYPE — throwaway. Variant B: "Intent picker"
// Question: what if we don't ask the user to configure anything — we ask
// "what are you here for?" and pick presets behind the scenes?
import React from "react";
import { GraduationCap, Search, Sparkles, MonitorPlay, Moon, Sun } from "lucide-react";
import type { Settings, ExtensionMode } from "../../types/types";

interface Props {
  settings: Settings;
  onModeChange: (mode: ExtensionMode) => void;
  onToggleTheme: () => void;
}

interface Intent {
  id: string;
  label: string;
  blurb: string;
  icon: React.ElementType;
  mode: ExtensionMode;
  tint: string;
}

const INTENTS: Intent[] = [
  {
    id: "learn",
    label: "I'm here to learn",
    blurb: "Hide shorts, comments, feed. Show transcript.",
    icon: GraduationCap,
    mode: "focus",
    tint: "from-blue-500 to-indigo-600",
  },
  {
    id: "lookup",
    label: "Quick look-up",
    blurb: "Watch one video, nothing else.",
    icon: Search,
    mode: "focus",
    tint: "from-emerald-500 to-teal-600",
  },
  {
    id: "browse",
    label: "Just browsing",
    blurb: "Full YouTube, no changes.",
    icon: MonitorPlay,
    mode: "relax",
    tint: "from-amber-400 to-orange-500",
  },
];

const VariantB: React.FC<Props> = ({ settings, onModeChange, onToggleTheme }) => {
  // Crude inference: focus = learn (default), relax = browse. Lookup is sticky-only.
  const activeId = settings.mode === "relax" ? "browse" : "learn";

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans select-none px-6 pt-5 pb-6 relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-black tracking-tight leading-none">
            What's on your mind?
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Pick one. We'll set things up.
          </p>
        </div>
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {settings.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="space-y-2.5">
        {INTENTS.map((intent) => {
          const active = intent.id === activeId;
          const Icon = intent.icon;
          return (
            <button
              key={intent.id}
              onClick={() => onModeChange(intent.mode)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 ${
                active
                  ? "border-transparent bg-white dark:bg-slate-900/80 shadow-lg shadow-black/5 dark:shadow-black/40 scale-[1.01]"
                  : "border-transparent bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${intent.tint} shadow-md`}
              >
                <Icon size={22} strokeWidth={2.4} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[14px] font-bold ${
                      active ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {intent.label}
                  </span>
                  {active && (
                    <Sparkles size={12} className="text-blue-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                  {intent.blurb}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        Set up manually
      </button>
    </div>
  );
};

export default VariantB;
