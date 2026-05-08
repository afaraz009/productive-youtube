// Type definitions for the extension

export interface VideoInfo {
  title: string;
  channel: string;
}

export type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';
export type ExtensionMode = 'focus' | 'learn' | 'relax';

export interface AIPrompts {
  translate: string;
  summarize: string;
  vocabulary: string;
}

export interface Settings {
  // Extension Mode
  mode: ExtensionMode;

  // Algorithm Blockers
  removeShorts: boolean;
  removeShortsButton: boolean;
  removeHomepageVideos: boolean;
  removeWatchPageSuggestions: boolean;
  showTranscript: boolean;
  enableIntentWall: boolean;
  removeComments: boolean;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;
}
