// Type definitions for the extension

export interface VideoInfo {
  title: string;
  channel: string;
}

export type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';
export type ExtensionMode = 'focus' | 'relax';
export type TranscriptLanguage = 'english' | 'urdu' | 'roman-urdu';

export interface AIPrompts {
  translate: string;
  summarize: string;
  vocabulary: string;
  urduScript: string;
  romanUrdu: string;
}

export interface Settings {
  // Extension Mode
  mode: ExtensionMode;

  // Transcript Settings
  transcriptLanguage: TranscriptLanguage;

  // Algorithm Blockers
  removeShorts: boolean;
  removeShortsButton: boolean;
  removeHomepageVideos: boolean;
  removeWatchPageSuggestions: boolean;
  showTranscript: boolean;
  removeComments: boolean;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;

  // UI Settings
  theme: 'light' | 'dark';
}
