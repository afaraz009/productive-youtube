import { Settings } from "./types";

// Default settings
const defaultSettings: Settings = {
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
