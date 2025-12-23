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
    <div className="flex items-start justify-between py-3 group">
      <div className="flex-1 pr-3">
        <span className="text-sm font-medium text-slate-900 block">
          {label}
        </span>
        {description && (
          <span className="text-xs text-slate-500 mt-1 block leading-relaxed">
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
        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-400 after:border-2 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-sm"></div>
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

  // Generic toggle handler
  const handleToggle = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ [key]: value }, () => {
        console.log(`Setting ${key} saved:`, value);
      });
    }
  };

  // AI Service handler
  const handleAIServiceChange = (value: AIService) => {
    const newSettings = { ...settings, aiService: value };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aiService: value }, () => {
        console.log(`AI Service saved:`, value);
      });
    }
  };

  // AI Prompt handler
  const handlePromptChange = (promptType: keyof AIPrompts, value: string) => {
    const newPrompts = { ...settings.aiPrompts, [promptType]: value };
    const newSettings = { ...settings, aiPrompts: newPrompts };
    setSettings(newSettings);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ aiPrompts: newPrompts }, () => {
        console.log(`AI Prompt ${promptType} saved`);
      });
    }
  };

  const [showAISettings, setShowAISettings] = useState(false);

  return (
    <div className="w-96 max-h-[600px] pb-5 overflow-y-auto font-sans text-sm bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 px-4 py-3.5 shadow-md">
        <h1 className="text-sm font-bold text-white">Productive YouTube</h1>
        <p className="text-xs text-blue-100 mt-1">
          Enhance your focus and productivity
        </p>
      </div>

      <div className="p-4">
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
      </div>

      {/* AI Settings Section */}
      <div className="px-4 pt-3 border-t border-slate-200">
        <button
          onClick={() => setShowAISettings(!showAISettings)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <span className="text-sm font-semibold text-slate-900">
            AI Settings
          </span>
          <span className="text-slate-500 transition-transform" style={{
            transform: showAISettings ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>

        {showAISettings && (
          <div className="space-y-4 pb-3">
            {/* AI Service Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                AI Service
              </label>
              <select
                value={settings.aiService}
                onChange={(e) => handleAIServiceChange(e.target.value as AIService)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="chatgpt">ChatGPT</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Claude AI</option>
                <option value="grok">Grok</option>
              </select>
            </div>

            {/* Translate Prompt */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Translation Prompt
              </label>
              <textarea
                value={settings.aiPrompts.translate}
                onChange={(e) => handlePromptChange('translate', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Summarize Prompt */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Summary Prompt
              </label>
              <textarea
                value={settings.aiPrompts.summarize}
                onChange={(e) => handlePromptChange('summarize', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
            </div>

            {/* Vocabulary Prompt */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Vocabulary Prompt
              </label>
              <textarea
                value={settings.aiPrompts.vocabulary}
                onChange={(e) => handlePromptChange('vocabulary', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                handleAIServiceChange(defaultSettings.aiService);
                handlePromptChange('translate', defaultSettings.aiPrompts.translate);
                handlePromptChange('summarize', defaultSettings.aiPrompts.summarize);
                handlePromptChange('vocabulary', defaultSettings.aiPrompts.vocabulary);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center mt-4 pt-3 border-t border-slate-200">
        Version 2.0.1 • Built for focus 💙
      </div>
    </div>
  );
};

export default PopupApp;
