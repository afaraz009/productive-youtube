import React, { useState, useEffect } from "react";
import { Settings, AIService, AIPrompts, ExtensionMode } from "../scripts/types";

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ id, label, checked, onChange, description }) => {
  return (
    <div className="flex items-start justify-between py-3 group">
      <div className="flex-1 pr-3">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
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
        <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-400 dark:after:border-slate-500 after:border-2 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-sm"></div>
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
      className={`flex flex-col items-center p-3 rounded-xl transition-all border-2 ${
        active
          ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400 shadow-sm"
          : "bg-white border-transparent hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-100 dark:border-slate-700"
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className={`text-xs font-bold ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
        {label}
      </span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center leading-tight">
        {description}
      </span>
    </button>
  );
};

const PopupApp: React.FC = () => {
  const defaultSettings: Settings = {
    mode: 'focus',
    removeShorts: true,
    removeShortsButton: true,
    removeHomepageVideos: true,
    removeWatchPageSuggestions: true,
    showTranscript: false,

    // AI Settings
    aiService: 'chatgpt',
    aiPrompts: {
      translate: "Translate the following transcript in urdu. Keep the timestamps and the same format in translated content",
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
      vocabulary: "Find all difficult words and create a table of English to Urdu and English to English meaning"
    }
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
    
    // Auto-configure based on mode
    if (mode === 'focus') {
      newSettings.removeShorts = true;
      newSettings.removeShortsButton = true;
      newSettings.removeHomepageVideos = true;
      newSettings.removeWatchPageSuggestions = true;
      newSettings.showTranscript = false;
    } else if (mode === 'learn') {
      newSettings.removeShorts = true;
      newSettings.removeShortsButton = false;
      newSettings.removeHomepageVideos = true;
      newSettings.removeWatchPageSuggestions = false;
      newSettings.showTranscript = true;
    } else if (mode === 'relax') {
      newSettings.removeShorts = false;
      newSettings.removeShortsButton = false;
      newSettings.removeHomepageVideos = false;
      newSettings.removeWatchPageSuggestions = false;
      newSettings.showTranscript = false;
    }

    setSettings(newSettings);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set(newSettings);
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

  return (
    <div className="w-80 max-h-[600px] pb-4 overflow-y-auto font-sans text-sm bg-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Productive YouTube</h1>
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
          Choose Your Mode
        </label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <ModeButton
            mode="focus"
            active={settings.mode === 'focus'}
            onClick={() => handleModeChange('focus')}
            label="Focus"
            icon="🚀"
            description="Total silence"
          />
          <ModeButton
            mode="learn"
            active={settings.mode === 'learn'}
            onClick={() => handleModeChange('learn')}
            label="Learn"
            icon="📚"
            description="Deep study"
          />
          <ModeButton
            mode="relax"
            active={settings.mode === 'relax'}
            onClick={() => handleModeChange('relax')}
            label="Relax"
            icon="☕"
            description="Default view"
          />
        </div>

        {/* Quick Actions / Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Productivity Score</p>
              <h2 className="text-xl font-bold mt-0.5">High Focus</h2>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              🎯
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span className="text-xs font-bold uppercase tracking-wider flex items-center">
            <span className="mr-2">⚙️</span> Custom Blockers
          </span>
          <span className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-2 space-y-1 px-1 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
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
              onChange={(val) => handleToggle("removeWatchPageSuggestions", val)}
            />
            <ToggleSwitch
              id="transcript-toggle"
              label="Auto-Transcript"
              checked={settings.showTranscript}
              onChange={(val) => handleToggle("showTranscript", val)}
            />
          </div>
        )}

        {/* AI Settings Section */}
        <div className="mt-4">
          <button
            onClick={() => setShowAISettings(!showAISettings)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <span className="text-xs font-bold uppercase tracking-wider flex items-center">
              <span className="mr-2">🤖</span> AI Preferences
            </span>
            <span className={`transition-transform duration-300 ${showAISettings ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showAISettings && (
            <div className="mt-2 space-y-4 px-3 py-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              {/* AI Service Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Preferred AI
                </label>
                <select
                  value={settings.aiService}
                  onChange={(e) => handleAIServiceChange(e.target.value as AIService)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                  handlePromptChange('translate', defaultSettings.aiPrompts.translate);
                  handlePromptChange('summarize', defaultSettings.aiPrompts.summarize);
                  handlePromptChange('vocabulary', defaultSettings.aiPrompts.vocabulary);
                }}
                className="w-full px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors uppercase tracking-widest"
              >
                Reset AI Defaults
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 px-4 italic leading-relaxed">
        "Your focus determines your reality." • v2.0.3
      </div>
    </div>
  );
};

export default PopupApp;
