import React, { useState, useEffect } from "react";
import { Settings, AIService, ExtensionMode } from "../types/types";
import {
  Settings2,
  Cpu,
  Home,
  Layout,
  MessageSquare,
  Video,
  FileText,
  Shield,
  Zap,
  Coffee,
  ChevronDown,
  Check,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ElementType;
}> = ({ id, label, checked, onChange, icon: Icon }) => {
  return (
    <div className="toggle-row group">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg transition-colors ${checked ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`}
        >
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <span
          className={`text-[13px] font-semibold transition-colors ${checked ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"}`}
        >
          {label}
        </span>
      </div>
      <label htmlFor={id} className="toggle-pill relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-full h-full rounded-full transition-colors duration-200 ${checked ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-300 dark:bg-slate-700/50"}`}
        ></div>
        <div
          className={`toggle-dot shadow-sm transform transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
        ></div>
      </label>
    </div>
  );
};

const ModeCard: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
  description: string;
  color: "blue" | "amber";
}> = ({ active, onClick, label, icon: Icon, description, color }) => {
  const activeClasses =
    color === "blue"
      ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
      : "border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]";

  const iconBg = color === "blue" ? "bg-blue-500" : "bg-amber-500";

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center p-4 rounded-2xl transition-all cursor-pointer border-2 h-full ${
        active
          ? activeClasses
          : "bg-black/5 dark:bg-white/5 border-transparent dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover:bg-black/[0.08] dark:hover:bg-white/[0.07]"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${active ? iconBg : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
      >
        <Icon
          size={24}
          strokeWidth={2.5}
          className={active ? "text-white" : ""}
        />
      </div>

      <h3
        className={`text-[14px] font-bold mb-1 ${active ? "text-blue-600 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
      >
        {label}
      </h3>
      <p className="text-[10px] text-slate-500 text-center leading-tight font-medium px-1">
        {description}
      </p>

      {active && (
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#090a0f] ${iconBg}`}
        >
          <Check size={10} strokeWidth={4} className="text-white" />
        </div>
      )}
    </div>
  );
};

const ActionItem: React.FC<{
  label: string;
  description: string;
  icon: React.ElementType;
  isOpen: boolean;
  onClick: () => void;
}> = ({ label, description, icon: Icon, isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3.5 rounded-2xl transition-all group border ${
        isOpen
          ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 shadow-lg"
          : "bg-transparent border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3.5 transition-colors ${
          isOpen
            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
            : "bg-slate-200 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
          <span
            className={`text-[14px] font-bold ${isOpen ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
          >
            {label}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`}
          />
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
          {description}
        </div>
      </div>
    </button>
  );
};

const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(null, (result) => {
        setSettings(result as Settings);
      });
    }
  }, []);

  // Restore live theme updating
  useEffect(() => {
    if (settings?.theme) {
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }
  }, [settings?.theme]);

  const handleModeChange = (mode: ExtensionMode) => {
    if (!settings) return;
    const newSettings = { ...settings, mode };

    if (mode === "focus") {
      Object.assign(newSettings, {
        removeShorts: true,
        removeShortsButton: true,
        removeHomepageVideos: true,
        removeWatchPageSuggestions: true,
        showTranscript: true,
        removeComments: true,
      });
    } else {
      Object.assign(newSettings, {
        removeShorts: false,
        removeShortsButton: false,
        removeHomepageVideos: false,
        removeWatchPageSuggestions: false,
        showTranscript: false,
        removeComments: false,
      });
    }

    setSettings(newSettings);
    chrome.storage.local.set(newSettings, () => {
      setTimeout(() => window.close(), 200);
    });
  };

  const handleToggle = (key: keyof Settings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.local.set({ [key]: value });
  };

  const toggleTheme = () => {
    if (!settings) return;
    const newTheme = settings.theme === "dark" ? "light" : "dark";
    handleToggle("theme", newTheme);
  };

  if (!settings)
    return (
      <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] flex items-center rounded-[20px] justify-center overflow-hidden p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="w-[340px] bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white font-sans antialiased px-6 pt-6 pb-5 select-none relative transition-colors duration-300 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 dark:bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-7 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l6 4-6 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[16px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
              Focus
            </h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase mt-1">
              Tube
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all ring-1 ring-black/5 dark:ring-white/5"
        >
          {settings.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Environment Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Sparkles size={14} className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Select Mode
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ModeCard
              active={settings.mode === "focus"}
              onClick={() => handleModeChange("focus")}
              label="Focus"
              icon={Zap}
              description="Deep Work Only"
              color="blue"
            />
            <ModeCard
              active={settings.mode === "relax"}
              onClick={() => handleModeChange("relax")}
              label="Relax"
              icon={Coffee}
              description="Default View"
              color="amber"
            />
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-2">
          <ActionItem
            label="Settings"
            description="Personalize your distractions"
            icon={Settings2}
            isOpen={showAdvanced}
            onClick={() => {
              setShowAdvanced(!showAdvanced);
              setShowAISettings(false);
            }}
          />
          {showAdvanced && (
            <div className="mx-1 mt-1 p-2.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-black/5 dark:border-white/5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <ToggleSwitch
                id="shorts"
                label="Hide Shorts"
                icon={Video}
                checked={settings.removeShorts}
                onChange={(v) => handleToggle("removeShorts", v)}
              />
              <ToggleSwitch
                id="feed"
                label="Hide Homepage"
                icon={Home}
                checked={settings.removeHomepageVideos}
                onChange={(v) => handleToggle("removeHomepageVideos", v)}
              />
              <ToggleSwitch
                id="sidebar"
                label="Hide Sidebar"
                icon={Layout}
                checked={settings.removeWatchPageSuggestions}
                onChange={(v) => handleToggle("removeWatchPageSuggestions", v)}
              />
              <ToggleSwitch
                id="comments"
                label="Hide Comments"
                icon={MessageSquare}
                checked={settings.removeComments}
                onChange={(v) => handleToggle("removeComments", v)}
              />
              <ToggleSwitch
                id="transcript"
                label="AI Transcript"
                icon={FileText}
                checked={settings.showTranscript}
                onChange={(v) => handleToggle("showTranscript", v)}
              />
            </div>
          )}

          <ActionItem
            label="AI Setting"
            description="Configure AI provider"
            icon={Cpu}
            isOpen={showAISettings}
            onClick={() => {
              setShowAISettings(!showAISettings);
              setShowAdvanced(false);
            }}
          />
          {showAISettings && (
            <div className="mx-1 mt-1 p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                Active Provider
              </label>
              <div className="relative">
                <select
                  value={settings.aiService}
                  onChange={(e) => {
                    const val = e.target.value as AIService;
                    handleToggle("aiService", val as any);
                    setTimeout(() => window.close(), 150);
                  }}
                  className="w-full pl-4 pr-10 py-3 text-[13px] bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 text-slate-700 dark:text-slate-200 font-bold appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <option value="chatgpt">OpenAI ChatGPT</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="grok">xAI Grok</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupApp;
