import React, { useState, useEffect } from "react";

type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';

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
  //remove comments
  removeComments: boolean;

  huggingfaceApiKey?: string;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;
}

const ToggleSwitch: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}> = ({ id, label, checked, onChange, description }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block leading-tight">
          {label}
        </span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block leading-snug">
            {description}
          </span>
        )}
      </div>
      <label
        htmlFor={id}
        className="relative inline-flex items-center cursor-pointer flex-shrink-0"
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 rounded-full bg-[#802C62]/25 transition-colors peer-checked:bg-[#802C62] peer-focus-visible:ring-2 peer-focus-visible:ring-[#802C62] peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"></div>
      </label>
    </div>
  );
};

const defaultSettings: Settings = {
  removeShorts: false,
  removeShortsButton: true,
  removeHomepageVideos: true,
  removeWatchPageSuggestions: true,
  showTranscript: false,
  //remove comments
  removeComments: false,

  huggingfaceApiKey: "",

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

//browser loads the settings from storage and updates the default settings
const hasChromeStorage = () =>
  typeof chrome !== "undefined" && !!chrome.storage;

const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showAISettings, setShowAISettings] = useState(false);

  // Load settings from Chrome storage
  useEffect(() => {
    if (hasChromeStorage()) {
      //the keys are the settings keys, we get them from defaultSettings
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

  // Generic toggle handler
  const handleToggle = (key: keyof Settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (hasChromeStorage()) {
      chrome.storage.local.set({ [key]: value });
    }
  };

  // AI Service handler
  const handleAIServiceChange = (value: AIService) => {
    setSettings((prev) => ({ ...prev, aiService: value }));

    if (hasChromeStorage()) {
      chrome.storage.local.set({ aiService: value });
    }
  };

  // AI Prompt handler
  const handlePromptChange = (promptType: keyof AIPrompts, value: string) => {
    const newPrompts = { ...settings.aiPrompts, [promptType]: value };
    setSettings((prev) => ({ ...prev, aiPrompts: newPrompts }));

    if (hasChromeStorage()) {
      chrome.storage.local.set({ aiPrompts: newPrompts });
    }
  };

  // Reset AI settings: one state update and one storage write
  const handleResetAI = () => {
    setSettings((prev) => ({
      ...prev,
      aiService: defaultSettings.aiService,
      aiPrompts: { ...defaultSettings.aiPrompts },
    }));

    if (hasChromeStorage()) {
      chrome.storage.local.set({
        aiService: defaultSettings.aiService,
        aiPrompts: defaultSettings.aiPrompts,
      });
    }
  };

  return (
    <div className="w-[22rem] max-h-[600px] overflow-y-auto font-sans text-sm bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#421454] border-t-2 border-t-[#802C62] border-b border-b-[#421454] px-6 py-5 flex items-center gap-3">
        <svg
          className="w-9 h-9 flex-shrink-0 text-white"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="15" fill="#802C62" stroke="currentColor" strokeWidth="2" />
          <path d="M15 12.5v11l9-5.5-9-5.5z" fill="currentColor" />
        </svg>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">
            Productive YouTube
          </h1>
          <p className="text-xs text-white mt-0.5">
            Enhance your focus and productivity
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="px-6 divide-y divide-slate-100 dark:divide-slate-800">
        <ToggleSwitch
          id="shorts-toggle"
          label="Remove Shorts Shelves"
          description="Hide all Shorts sections from YouTube"
          checked={settings.removeShorts}
          onChange={(val) => handleToggle("removeShorts", val)}
        />
        <ToggleSwitch
          id="shorts-button-toggle"
          label="Remove Shorts Button"
          description="Hide Shorts button from sidebar"
          checked={settings.removeShortsButton}
          onChange={(val) => handleToggle("removeShortsButton", val)}
        />
        <ToggleSwitch
          id="homepage-toggle"
          label="Remove Homepage Videos"
          description="Clean homepage - no suggested videos"
          checked={settings.removeHomepageVideos}
          onChange={(val) => handleToggle("removeHomepageVideos", val)}
        />
        <ToggleSwitch
          id="suggestions-toggle"
          label="Remove Watch Page Suggestions"
          description="Hide sidebar recommendations"
          checked={settings.removeWatchPageSuggestions}
          onChange={(val) => handleToggle("removeWatchPageSuggestions", val)}
        />
        <ToggleSwitch
          id="transcript-toggle"
          label="Show Video Transcript"
          description="Display video transcript on the watch page"
          checked={settings.showTranscript}
          onChange={(val) => handleToggle("showTranscript", val)}
        />

        <ToggleSwitch
          id="comments-toggle"
          label="Hide Video Comments"
          description="Hide the comments section while watching videos"
          checked={settings.removeComments}
          onChange={(val) => handleToggle("removeComments", val)}
        />


      </div>

      {/* AI Settings */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setShowAISettings(!showAISettings)}
          aria-expanded={showAISettings}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            AI Settings
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              showAISettings ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8l5 5 5-5" />
          </svg>
        </button>

        {showAISettings && (
          <div className="px-6 pt-1 pb-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">AI Service</label>
              <select
                value={settings.aiService}
                onChange={(e) => handleAIServiceChange(e.target.value as AIService)}
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#802C62] focus:ring-1 focus:ring-[#802C62]"
              >
                <option value="chatgpt">ChatGPT</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Claude AI</option>
                <option value="grok">Grok</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Translation Prompt</label>
              <textarea
                value={settings.aiPrompts.translate}
                onChange={(e) => handlePromptChange("translate", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#802C62] focus:ring-1 focus:ring-[#802C62] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Summary Prompt</label>
              <textarea
                value={settings.aiPrompts.summarize}
                onChange={(e) => handlePromptChange("summarize", e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#802C62] focus:ring-1 focus:ring-[#802C62] resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Vocabulary Prompt</label>
              <textarea
                value={settings.aiPrompts.vocabulary}
                onChange={(e) => handlePromptChange("vocabulary", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#802C62] focus:ring-1 focus:ring-[#802C62] resize-none"
              />
            </div>

            <button
              onClick={handleResetAI}
              className="w-full px-3 py-2.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <span>Version 2.0.3</span>
        <span aria-hidden="true">•</span>
        <span>Built for Focus</span>
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="#FFD749"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
};

export default PopupApp;