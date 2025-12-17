import { Settings } from "./types";

// Default settings
const defaultSettings: Settings = {
  removeShorts: true,
  removeShortsButton: true,
  removeHomepageVideos: true,
  removeWatchPageSuggestions: true,
  showTranscript: false,
};

// Current settings instance - exported as mutable object
export const settings: Settings = { ...defaultSettings };

// Load settings from storage
export function loadSettings(callback?: () => void): void {
  const keys = Object.keys(settings);
  chrome.storage.local.get(keys, function (result) {
    // Load all settings with defaults
    keys.forEach((key) => {
      if (result[key] !== undefined) {
        settings[key as keyof Settings] = result[key];
      }
    });

    if (callback) callback();
  });
}

// Update settings (for internal use)
export function updateSettings(newSettings: Partial<Settings>): void {
  // Mutate the existing object instead of reassigning
  Object.assign(settings, newSettings);
}
