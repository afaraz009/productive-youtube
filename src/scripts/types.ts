// Type definitions for the extension

export interface VideoInfo {
  title: string;
  channel: string;
}

export type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';


export type FocusFeature =
  | "removeShorts"
  | "removeShortsButton"
  | "removeHomepageVideos"
  | "removeWatchPageSuggestions";

export interface AIPrompts {
  translate: string;
  summarize: string;
  vocabulary: string;
}

export interface Settings {
  // Algorithm Blockers
  removeShorts: boolean;
  removeShortsButton: boolean;
  removeHomepageVideos: boolean;
  removeWatchPageSuggestions: boolean;
  showTranscript: boolean;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;


  // Focus Lock
  focusLockEnabled: boolean;
  focusLockDurationMinutes: number; 
  focusLockUntil: number;
  focusLockFeatures: FocusFeature[];
  focusLockValues: Partial<Record<FocusFeature, boolean>>;

}

export interface SavedNote {
  id: string;
  videoId: string;
  videoTitle: string;
  startTime: number;
  endTime: number;
  preview: string;
  createdAt: number;
}