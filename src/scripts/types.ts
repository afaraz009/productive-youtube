// Type definitions for the extension

export interface VideoInfo {
  title: string;
  channel: string;
}

export interface Settings {
  // Algorithm Blockers
  removeShorts: boolean;
  removeShortsButton: boolean;
  removeHomepageVideos: boolean;
  removeWatchPageSuggestions: boolean;
  showTranscript: boolean;
}

export interface TranslationResponse {
  urduTranslation: string;
  context: string;
  vocabulary: string[];
  bestWord: string;
}
