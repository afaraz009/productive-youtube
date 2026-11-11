import React, { useState, useEffect } from "react";
import {
  Languages,
  FileText,
  BookOpen,
  RotateCcw,
  Sparkles,
  Lock,
  
} from "lucide-react";
import { FocusFeature } from "../scripts/types";
type AIService = "chatgpt" | "gemini" | "claude" | "grok";
import NotesSection from "./NotesSection";


interface AIPrompts {
  translate: string;
  summarize: string;
  vocabulary: string;
}

interface Settings {
  // Algorithm Blockers
  removeShorts: boolean;
  removeShortsButton: boolean;
  removeHomepageVideos: boolean;
  removeWatchPageSuggestions: boolean;
  showTranscript: boolean;
  huggingfaceApiKey?: string;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;

  // Focus Lock
  focusLockEnabled: boolean;
  focusLockUntil: number;
  focusLockDurationMinutes: number;
  focusLockFeatures: (
    | "removeShorts"
    | "removeShortsButton"
    | "removeHomepageVideos"
    | "removeWatchPageSuggestions"
  )[];
  focusLockValues: Record<string, boolean>;
}

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  checked: boolean;

  disabled?: boolean;

  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ id, label, checked, onChange, description, disabled }) => {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 border-b border-[#e8eeeb] dark:border-slate-700/70 last:border-0 group">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-[#263e40] dark:text-slate-100 block">
          {label}
        </span>

        {description && (
          <span className="text-[11px] text-[#879493] dark:text-slate-400 mt-1 block leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <label
        htmlFor={id}
        className={`relative inline-flex items-center flex-shrink-0 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />

        <div className="w-10 h-[22px] rounded-full bg-[#dce5e2] dark:bg-slate-700 peer-checked:bg-[#086972] transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#086972]/40 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-[18px]" />
      </label>
    </div>
  );
};

const PopupApp: React.FC = () => {
  const defaultSettings: Settings = {
    removeShorts: true,
    removeShortsButton: true,
    removeHomepageVideos: true,
    removeWatchPageSuggestions: true,
    showTranscript: false,
    huggingfaceApiKey: "",

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
    focusLockEnabled: false,
    focusLockUntil: 0,
    focusLockDurationMinutes: 25,
    focusLockFeatures: [],
    focusLockValues: {},
  };

  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const focusFeatures = [
    { key: "removeShorts", label: "Remove Shorts Shelves" },
    { key: "removeShortsButton", label: "Remove Shorts Button" },
    { key: "removeHomepageVideos", label: "Remove Homepage Videos" },
    {
      key: "removeWatchPageSuggestions",
      label: "Remove Watch Page Suggestions",
    },
  ] as const;

  const focusLockActive =
    settings.focusLockEnabled && settings.focusLockUntil > Date.now();

  const lockedFeatures = settings.focusLockFeatures.filter(
    (key) => focusLockActive && settings.focusLockValues[key] !== undefined,
  );

  const startFocusLock = () => {
    const selected = settings.focusLockFeatures.filter(
      (key) => settings[key] === true,
    );

    if (selected.length === 0) {
      alert("Enable at least one blocker before starting Focus Lock.");
      return;
    }

    const duration = settings.focusLockDurationMinutes;

    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      alert("Please enter a duration between 1 and 1440 minutes.");
      return;
    }

    const lockedValues = Object.fromEntries(selected.map((key) => [key, true]));

    const newSettings = {
      ...settings,
      focusLockEnabled: true,
      focusLockUntil: Date.now() + duration * 60 * 1000,
      focusLockFeatures: selected,
      focusLockValues: lockedValues,
    };

    setSettings(newSettings);
    chrome.storage.local.set(newSettings);
  };
  const endFocusLock = () => {
    if (!window.confirm("Are you sure you want to end your focus session?")) {
      return;
    }

    const updates = {
      focusLockEnabled: false,
      focusLockUntil: 0,
      focusLockValues: {},
    };

    setSettings((previous) => ({ ...previous, ...updates }));
    chrome.storage.local.set(updates);
  };

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSettings((previous) => ({ ...previous }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleFocusFeatureChange = (key: FocusFeature, checked: boolean) => {
    const features = checked
      ? [...settings.focusLockFeatures, key]
      : settings.focusLockFeatures.filter((item) => item !== key);

    const updated = { ...settings, focusLockFeatures: features };

    setSettings(updated);
    chrome.storage.local.set({ focusLockFeatures: features });
  };

  const handleToggle = (key: keyof Settings, value: boolean) => {
    if (
      focusLockActive &&
      settings.focusLockFeatures.includes(key as FocusFeature)
    ) {
      return;
    }

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
      chrome.storage.local.set({ aiService: value });
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

  const [showAISettings, setShowAISettings] = useState(false);

  return (
    <div className="w-96 max-h-[600px] pb-5 overflow-y-auto font-sans text-sm bg-[#faf9f5] dark:bg-slate-950">
      <div className="sticky top-0 z-10 bg-[#086972] dark:bg-[#07545b] px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/10">
            <span className="text-white text-sm font-bold">YT</span>
          </div>

          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-white tracking-tight">
              Productive YouTube
            </h1>
            <p className="text-[11px] text-teal-100 mt-0.5">
              Your mindful YouTube experience
            </p>
          </div>

          <span className="text-[9px] font-semibold tracking-wider uppercase text-teal-50 bg-white/15 px-2.5 py-1 rounded-full">
            FOCUS
          </span>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <div className="mb-2">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#a18a4c] uppercase">
            YOUR EXPERIENCE
          </p>

          <h2 className="text-[15px] font-bold text-[#263e40] dark:text-slate-100 mt-1">
            Focus controls
          </h2>

          <p className="text-[11px] text-[#879493] dark:text-slate-400 mt-1">
            Customize your YouTube environment.
          </p>
        </div>

        <div>
          {/* Keep all five existing ToggleSwitch components here,
        without changing their props or handlers. */}

          <ToggleSwitch
            id="shorts-toggle"
            label="Remove Shorts Shelves"
            description="Hide all Shorts sections from YouTube"
            checked={settings.removeShorts}
            onChange={(val) => handleToggle("removeShortsButton", val)}
            disabled={
              focusLockActive && lockedFeatures.includes("removeShortsButton")
            }
          />

          <ToggleSwitch
            id="shorts-button-toggle"
            label="Remove Shorts Button"
            description="Hide Shorts button from sidebar"
            checked={settings.removeShortsButton}
            onChange={(val) => handleToggle("removeShortsButton", val)}
            disabled={
              focusLockActive && lockedFeatures.includes("removeShortsButton")
            }
          />

          <ToggleSwitch
            id="homepage-toggle"
            label="Remove Homepage Videos"
            description="Clean homepage - no suggested videos"
            checked={settings.removeHomepageVideos}
            onChange={(val) => handleToggle("removeHomepageVideos", val)}
            disabled={
              focusLockActive && lockedFeatures.includes("removeHomepageVideos")
            }
          />

          <ToggleSwitch
            id="suggestions-toggle"
            label="Remove Watch Page Suggestions"
            description="Hide sidebar recommendations"
            checked={settings.removeWatchPageSuggestions}
            onChange={(val) => handleToggle("removeWatchPageSuggestions", val)}
            disabled={
              focusLockActive &&
              lockedFeatures.includes("removeWatchPageSuggestions")
            }
          />

          <ToggleSwitch
            id="transcript-toggle"
            label="Show Video Transcript"
            description="Display video transcript on the watch page"
            checked={settings.showTranscript}
            onChange={(val) => handleToggle("showTranscript", val)}
          />
        </div>
      </div>

      <div className="px-4 py-4 border-t border-[#e8eeeb] dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-[13px] font-bold text-[#263e40] dark:text-slate-100">
              Focus Lock
            </h3>
            <p className="text-[10px] text-[#879493] dark:text-slate-400 mt-1">
              Protect your distraction settings during a focus session.
            </p>
          </div>

          <span className="text-lg">
            <Lock />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#e5ebe7] dark:border-slate-700 rounded-xl p-3 mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#879493] mb-3">
            Choose settings to protect
          </p>

          {focusFeatures.map((feature) => (
            <label
              key={feature.key}
              className="flex items-center gap-2 py-2 text-[11px] text-[#35494a] dark:text-slate-200"
            >
              <input
                type="checkbox"
                checked={settings.focusLockFeatures.includes(feature.key)}
                disabled={focusLockActive}
                onChange={(e) =>
                  handleFocusFeatureChange(feature.key, e.target.checked)
                }
                className="accent-[#086972]"
              />
              {feature.label}
            </label>
          ))}

          <div className="border-t border-[#e8eeeb] dark:border-slate-700 mt-3 pt-3">
            {focusLockActive ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#086972] dark:text-teal-300">
                    Focus session active
                  </span>
                  <span className="text-[10px] text-[#879493]">
                    25-minute session
                  </span>
                </div>

                <p className="text-[11px] text-[#879493] mt-2">
                  Your selected settings are protected.
                </p>

                <button
                  onClick={endFocusLock}
                  className="w-full mt-3 py-2 rounded-lg border border-[#cbded8] text-[#086972] text-[11px] font-semibold hover:bg-[#edf5f1] dark:border-slate-600 dark:text-teal-300"
                >
                  End Focus Session
                </button>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <label
                    htmlFor="focus-duration"
                    className="block text-[11px] font-semibold text-[#526466] dark:text-slate-300 mb-2"
                  >
                    Session duration (minutes)
                  </label>

                  <input
                    id="focus-duration"
                    type="number"
                    min="1"
                    max="1440"
                    step="1"
                    value={settings.focusLockDurationMinutes}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      const updated = {
                        ...settings,
                        focusLockDurationMinutes: value,
                      };

                      setSettings(updated);

                      chrome.storage.local.set({
                        focusLockDurationMinutes: value,
                      });
                    }}
                    className="w-full px-3 py-2.5 text-[12px] font-semibold border border-[#e5ebe7] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#086972]/30 bg-[#faf9f5] dark:bg-slate-800 text-[#263e40] dark:text-slate-100"
                  />

                  <p className="text-[10px] text-[#879493] dark:text-slate-400 mt-1.5">
                    Choose between 1 and 1440 minutes.
                  </p>
                </div>
                <button
                  onClick={startFocusLock}
                  className="w-full py-2.5 rounded-lg bg-[#086972] text-white text-[11px] font-semibold hover:bg-[#07545b] transition-colors"
                >
                  Start Focus Lock
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 border-t border-[#e8eeeb] dark:border-slate-700">
        <button
          onClick={() => setShowAISettings(!showAISettings)}
          className="w-full flex items-center justify-between py-2.5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f2ef] dark:bg-teal-900/40 flex items-center justify-center">
              <span className="text-[#086972] dark:text-teal-300 text-base">
                ✦
              </span>
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#263e40] dark:text-slate-100">
                AI Preferences
              </span>
              <span className="block text-[10px] text-[#879493] dark:text-slate-400 mt-0.5">
                Customize your AI assistant
              </span>
            </div>
          </div>

          <div
            className={`text-[#086972] dark:text-teal-300 transition-transform duration-200 ${
              showAISettings ? "rotate-180" : ""
            }`}
          >
            ▼
          </div>
        </button>

        {showAISettings && (
          <div className="space-y-4 pt-3 pb-3">
            {/* AI Provider */}
            <div className="rounded-xl border border-[#e5ebe7] dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3">
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[#879493] dark:text-slate-400 mb-2">
                AI Provider
              </label>

              <select
                value={settings.aiService}
                onChange={(e) =>
                  handleAIServiceChange(e.target.value as AIService)
                }
                className="w-full px-3 py-2.5 text-[12px] font-medium border border-[#e5ebe7] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#086972]/30 bg-[#faf9f5] dark:bg-slate-800 text-[#263e40] dark:text-slate-100 cursor-pointer"
              >
                <option value="chatgpt">ChatGPT</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Claude AI</option>
                <option value="grok">Grok</option>
              </select>

              <p className="text-[10px] text-[#879493] dark:text-slate-400 mt-2">
                Choose which AI service handles your requests.
              </p>
            </div>

            {/* Prompt Editors */}
            <div className="space-y-3">
              {/* Translation */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#526466] dark:text-slate-300 mb-2">
                  <Languages size={14} className="text-[#086972]" />
                  Translation Prompt
                </label>

                <textarea
                  value={settings.aiPrompts.translate}
                  onChange={(e) =>
                    handlePromptChange("translate", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 text-[11px] leading-relaxed border border-[#e5ebe7] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#086972]/30 focus:border-[#086972] resize-y bg-white dark:bg-slate-900 text-[#35494a] dark:text-slate-200 transition-all"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#526466] dark:text-slate-300 mb-2">
                  <FileText size={14} className="text-[#086972]" />
                  Summary Prompt
                </label>

                <textarea
                  value={settings.aiPrompts.summarize}
                  onChange={(e) =>
                    handlePromptChange("summarize", e.target.value)
                  }
                  rows={7}
                  className="w-full px-3 py-2.5 text-[11px] leading-relaxed border border-[#e5ebe7] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#086972]/30 focus:border-[#086972] resize-y font-mono bg-white dark:bg-slate-900 text-[#35494a] dark:text-slate-200 transition-all"
                />
              </div>

              {/* Vocabulary */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#526466] dark:text-slate-300 mb-2">
                  <BookOpen size={14} className="text-[#086972]" />
                  Vocabulary Prompt
                </label>

                <textarea
                  value={settings.aiPrompts.vocabulary}
                  onChange={(e) =>
                    handlePromptChange("vocabulary", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 text-[11px] leading-relaxed border border-[#e5ebe7] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#086972]/30 focus:border-[#086972] resize-y bg-white dark:bg-slate-900 text-[#35494a] dark:text-slate-200 transition-all"
                />
              </div>
            </div>

            {/* Reset */}
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
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-[#086972] dark:text-teal-300 border border-[#cbded8] dark:border-teal-900 rounded-xl hover:bg-[#edf5f1] dark:hover:bg-teal-900/20 transition-colors"
            >
              <RotateCcw size={13} />
              Reset AI Preferences
            </button>
          </div>
        )}
      </div>

      {/* <NotesSection /> */}

      <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        Version 2.0.3 • Built for focus 😒
      </div>
    </div>
  );
};

export default PopupApp;
