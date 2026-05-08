import React, { useState, useEffect } from "react";
import {
  Settings,
  AIService,
  AIPrompts,
  ExtensionMode,
} from "../scripts/types";

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ id, label, checked, onChange, description }) => {
  return (
    <div className="flex items-start justify-between py-2.5 group">
      <div className="flex-1 pr-3">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <label
        htmlFor={id}
        className="relative inline-flex items-center cursor-pointer mt-0.5 flex-shrink-0"
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-400 dark:after:border-slate-500 after:border-2 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-indigo-600 dark:peer-checked:from-indigo-600 dark:peer-checked:to-indigo-700 shadow-sm"></div>
      </label>
    </div>
  );
};

const ModeButton: React.FC<{
  mode: ExtensionMode;
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  description: string;
}> = ({ active, onClick, label, icon, description }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-3.5 rounded-2xl transition-all border-2 ${
        active
          ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-500 dark:from-indigo-950/40 dark:to-blue-950/40 dark:border-indigo-400 shadow-md dark:shadow-lg"
          : "bg-white/60 border-transparent hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 border-slate-100 dark:border-slate-700"
      }`}
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span
        className={`text-xs font-bold transition-colors ${
          active
            ? "text-indigo-700 dark:text-indigo-300"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {label}
      </span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center leading-tight">
        {description}
      </span>
    </button>
  );
};

const PopupApp: React.FC = () => {
  const defaultSettings: Settings = {
    mode: "focus",
    removeShorts: true,
    removeShortsButton: true,
    removeHomepageVideos: true,
    removeWatchPageSuggestions: true,
    showTranscript: false,

    // AI Settings
    aiService: "chatgpt",
    aiPrompts: {
      translate:
        "Translate the following transcript in urdu. Keep the timestamps and the same format in translated content",
      summarize: `# YouTube Video Summary Generator

## Instructions
You will be provided with the Title, URL, and Transcript of a YouTube video.
Create a comprehensive yet accessible summary with the following structure:

### Video:
Create a clickable hyperlink using the video Title as the link text and the URL as the destination.

### TL;DR:
Provide a concise summary (1-3 sentences) capturing the essential message or purpose of the video.

### Key Points:
List 3-7 core ideas, arguments, or insights presented in the video. Each point should be:
- One to three sentences in length
- Specific enough to convey meaningful information
- Written in clear, straightforward language

### Detailed Summary with Timestamps:
Write a comprehensive summary of the video content in 5-20 bullet points, depending on the video length and complexity.
- Each point should begin with a timestamp (formatted as [mm:ss](URL&t=XXXs)) where XXX is the number of seconds into the video
- Each summary point should:
  - Cover a distinct topic, segment, or idea from the video
  - Be 2-4 sentences long, providing context and specific details
  - Include relevant examples, data points, or quotes when appropriate
  - Avoid vague generalizations; instead, capture the actual substance of what was discussed
  - Use plain language while preserving any essential technical terms

### Additional Context (Optional):
If relevant, include brief sections on:
- Background information needed to understand the topic
- Related resources mentioned in the video
- Key questions addressed or left unanswered

Format all hyperlinks properly to ensure they are clickable and lead to the correct timestamp in the video.`,
      vocabulary:
        "Find all difficult words and create a table of English to Urdu and English to English meaning",
    },
  };

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  // Load settings from Chrome storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const keys = Object.keys(defaultSettings);
      chrome.storage.local.get(keys, (result) => {
        const loadedSettings = { ...defaultSettings };
        keys.forEach((key) => {
          if (result[key] !== undefined) {
            (loadedSettings as any)[key] = result[key];
          }
        });
        setSettings(loadedSettings);
      });
    }
  }, []);

  // Mode change handler
  const handleModeChange = (mode: ExtensionMode) => {
    let newSettings = { ...settings, mode };

    // Auto-close menus on mode change
    setShowAdvanced(false);
    setShowAISettings(false);

    // Auto-configure based on mode
    if (mode === "focus") {
      newSettings.removeShorts = true;
      newSettings.removeShortsButton = true;
      newSettings.removeHomepageVideos = true;
      newSettings.removeWatchPageSuggestions = true;
      newSettings.showTranscript = true;
      newSettings.removeComments = true;
    } else if (mode === "learn") {
      newSettings.removeShorts = true;
      newSettings.removeShortsButton = true;
      newSettings.removeHomepageVideos = true;
      newSettings.removeWatchPageSuggestions = true;
      newSettings.showTranscript = true;
      newSettings.removeComments = true;
    } else if (mode === "relax") {
      newSettings.removeShorts = false;
      newSettings.removeShortsButton = false;
      newSettings.removeHomepageVideos = false;
      newSettings.removeWatchPageSuggestions = false;
      newSettings.showTranscript = false;
      newSettings.removeComments = false;
    }

    setSettings(newSettings);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set(newSettings, () => {
        // Auto-close popup after mode selection to return user to YouTube
        setTimeout(() => window.close(), 150);
      });
    }
  };

  // Generic toggle handler
  const handleToggle = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ [key]: value });
    }
  };

  // AI Service handler
  const handleAIServiceChange = (value: AIService) => {
    const newSettings = { ...settings, aiService: value };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aiService: value }, () => {
        // Auto-close after preference selection
        setTimeout(() => window.close(), 150);
      });
    }
  };

  // AI Prompt handler
  const handlePromptChange = (promptType: keyof AIPrompts, value: string) => {
    const newPrompts = { ...settings.aiPrompts, [promptType]: value };
    const newSettings = { ...settings, aiPrompts: newPrompts };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aiPrompts: newPrompts });
    }
  };

  return (
    <div className="w-80 max-h-[600px] pb-4 overflow-y-auto font-sans text-sm bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
            Productive YouTube
          </h1>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950/50 dark:to-blue-950/50 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3.5 block text-center">
          Select Your Environment
        </label>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ModeButton
            mode="focus"
            active={settings.mode === "focus"}
            onClick={() => handleModeChange("focus")}
            label="Focus"
            icon="🚀"
            description="Block & Learn"
          />
          <ModeButton
            mode="relax"
            active={settings.mode === "relax"}
            onClick={() => handleModeChange("relax")}
            label="Relax"
            icon="☕"
            description="Default View"
          />
        </div>

        {/* Custom Blockers Section */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all shadow-sm hover:shadow-md"
        >
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center">
            <span className="mr-2.5 text-lg">⚙️</span> Custom Blockers
          </span>
          <span
            className={`transition-transform duration-300 text-slate-500 ${showAdvanced ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-2 space-y-2 px-1 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 backdrop-blur-sm">
            <ToggleSwitch
              id="shorts-toggle"
              label="Shorts Shelves"
              checked={settings.removeShorts}
              onChange={(val) => handleToggle("removeShorts", val)}
            />
            <ToggleSwitch
              id="shorts-button-toggle"
              label="Shorts Sidebar Button"
              checked={settings.removeShortsButton}
              onChange={(val) => handleToggle("removeShortsButton", val)}
            />
            <ToggleSwitch
              id="homepage-toggle"
              label="Homepage Videos"
              checked={settings.removeHomepageVideos}
              onChange={(val) => handleToggle("removeHomepageVideos", val)}
            />
            <ToggleSwitch
              id="suggestions-toggle"
              label="Sidebar Suggestions"
              checked={settings.removeWatchPageSuggestions}
              onChange={(val) =>
                handleToggle("removeWatchPageSuggestions", val)
              }
            />
            <ToggleSwitch
              id="transcript-toggle"
              label="Auto-Transcript"
              checked={settings.showTranscript}
              onChange={(val) => handleToggle("showTranscript", val)}
            />
            <ToggleSwitch
              id="intent-wall-toggle"
              label="Mental Intent Wall"
              checked={settings.enableIntentWall}
              onChange={(val) => handleToggle("enableIntentWall", val)}
            />
            <ToggleSwitch
              id="comments-toggle"
              label="Hide Comments"
              checked={settings.removeComments}
              onChange={(val) => handleToggle("removeComments", val)}
            />
          </div>
        )}

        {/* AI Settings Section */}
        <div className="mt-4">
          <button
            onClick={() => setShowAISettings(!showAISettings)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center">
              <span className="mr-2.5 text-lg">🤖</span> AI Preferences
            </span>
            <span
              className={`transition-transform duration-300 text-slate-500 ${showAISettings ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>

          {showAISettings && (
            <div className="mt-2 space-y-4 px-4 py-4 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              {/* AI Service Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Preferred AI
                </label>
                <select
                  value={settings.aiService}
                  onChange={(e) =>
                    handleAIServiceChange(e.target.value as AIService)
                  }
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium shadow-sm"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Claude AI</option>
                  <option value="grok">Grok</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  handleAIServiceChange(defaultSettings.aiService);
                  handlePromptChange(
                    "translate",
                    defaultSettings.aiPrompts.translate,
                  );
                  handlePromptChange(
                    "summarize",
                    defaultSettings.aiPrompts.summarize,
                  );
                  handlePromptChange(
                    "vocabulary",
                    defaultSettings.aiPrompts.vocabulary,
                  );
                  // Auto-close after reset
                  setTimeout(() => window.close(), 200);
                }}
                className="w-full px-3 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/40 hover:bg-indigo-200/80 dark:hover:bg-indigo-900/40 rounded-lg transition-colors uppercase tracking-widest border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm"
              >
                Reset AI Defaults
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-4 px-4 italic leading-relaxed font-medium">
        "Your focus determines your reality." • v2.0.3
      </div>
    </div>
  );
};

export default PopupApp;
