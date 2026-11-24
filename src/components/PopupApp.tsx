import React, { useState, useEffect } from "react";
import HighlightsView from "./HighlightsView";

import { useAuth } from "../hooks/useAuth";
import AccountBar from "./AccountBar";
import { openAuthPage } from "../auth/openAuthPage";

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
  thumbnailSummary: boolean;
  //remove comments
  removeComments: boolean;

  huggingfaceApiKey?: string;

  // Thumbnail TL;DR (read by background.ts, never by the content script)
  geminiApiKey: string;
  geminiModel: string;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;
}

const GEMINI_MODELS: { id: string; label: string }[] = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (fastest)" },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (best quality)" },
];

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
//-------------------------------------------------------------------------------------------------------
const defaultSettings: Settings = {
  removeShorts: false,
  removeShortsButton: true,
  removeHomepageVideos: true,
  removeWatchPageSuggestions: true,
  showTranscript: false,
    thumbnailSummary: true,
  //remove comments
  removeComments: false,

  huggingfaceApiKey: "",
    geminiApiKey: "",
    geminiModel: "gemini-3.5-flash-lite",

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
  const [activeView, setActiveView] = useState("settings");

  // result = settings retrieved from Chrome storage.
  // defaultSettings = fallback settings defined by your application.
  // loadedSettings = combination of both, where saved settings override defaults.
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  //auth ....
  const auth = useAuth();

  // Load settings from Chrome storage
  useEffect(() => {
    // is this an 'extension' that's running?
    if (typeof chrome !== "undefined" && chrome.storage) {
      const keys = Object.keys(defaultSettings);
      //keys -> keys of the defaultSettings object
      //Chrome searches its local storage for these keys and returns their stored values.
      chrome.storage.local.get(keys, (result) => {
        //initialize loaded settings with default settings
        const loadedSettings = { ...defaultSettings };
        keys.forEach((key) => {   
          // replace all the loadedSettings (currently default) with the result values except the undefined ones 
          // keep them as they are (default)
          if (result[key] !== undefined) {
            (loadedSettings as any)[key] = result[key];
          }
        });
        setSettings(loadedSettings);
      });
    }
  }, []);
//-------------------------------------------------------------------------------------------------------
  // Generic toggle handler
  const handleToggle = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    //saves the current toggle state in Chrome's extension storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ [key]: value });
    }
  };
  //-------------------------------------------------------------------------------------------------------

  // Generic string setting handler (Gemini key / model)
  const handleTextSetting = (key: "geminiApiKey" | "geminiModel", value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ [key]: value.trim() });
    }
  };

  const [showApiKey, setShowApiKey] = useState(false);
  

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
    
    activeView === "settings" ? (
    <div className="w-96 max-h-[600px] pb-5 overflow-y-auto font-sans text-sm bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-950">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 border-b border-blue-800 dark:border-blue-950 px-4 py-3.5 shadow-md">
        <h1 className="text-sm font-bold text-white">Productive YouTube</h1>
        <p className="text-xs text-blue-100 mt-1">
          Enhance your focus and productivity
        </p>
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
        {/* TL;DR is switched off for now (see content.ts, "TL;DR off")
        <ToggleSwitch
          id="thumbnail-summary-toggle"
          label="Thumbnail TL;DR"
          description="Hover a video and click TL;DR to flip its thumbnail into a summary"
          checked={settings.thumbnailSummary}
          onChange={(val) => handleToggle("thumbnailSummary", val)}
        /> */}
        {/* {settings.thumbnailSummary && (
          <div className="mt-1 mb-2 p-3 space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="gemini-api-key"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Gemini API key
                </label>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Get a free key
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  id="gemini-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={settings.geminiApiKey}
                  onChange={(e) => handleTextSetting("geminiApiKey", e.target.value)}
                  placeholder="Paste your key"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
              {!settings.geminiApiKey && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  Summaries need a key. It stays in this browser and is only sent to Google.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="gemini-model"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Model
              </label>
              <select
                id="gemini-model"
                value={settings.geminiModel}
                onChange={(e) => handleTextSetting("geminiModel", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )} */}
      </div>

      {/* My Saved Highlights: opens the saved transcript highlights view */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setActiveView("saved-highlights")}
          className="w-full px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          My Saved Highlights
        </button>
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

      {/* Account */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setShowAccount(!showAccount)}
          aria-expanded={showAccount}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Account
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              showAccount ? "rotate-180" : ""
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

        {showAccount && (
          <div className="px-6 pt-1 pb-5">
            {auth.loading ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loading…
              </p>
            ) : auth.user ? (
              <AccountBar
                user={auth.user}
                busy={auth.busy}
                onSignOut={() => void auth.signOut()}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Log in or create an account to save your notes.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void openAuthPage("login")}
                    className="flex-1 px-3 py-2.5 text-sm font-medium rounded-md bg-[#086972] text-white hover:bg-[#07545b] transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => void openAuthPage("signup")}
                    className="flex-1 px-3 py-2.5 text-sm font-medium rounded-md border border-[#cbded8] dark:border-slate-600 text-[#086972] dark:text-teal-300 hover:bg-[#edf5f1] dark:hover:bg-teal-900/20 transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}
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
    ) : (
      <HighlightsView setActiveView={setActiveView} />
    )
  );
};

export default PopupApp;