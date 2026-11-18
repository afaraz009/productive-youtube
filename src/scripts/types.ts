// Type definitions for the extension

export interface VideoInfo {
  title: string;
  channel: string;
}

export type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';

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
  thumbnailSummary: boolean;
  showArticlePosts: boolean;
  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;
}

// TL;DR summary generated for a video thumbnail (Gemini structured output)
export interface ThumbnailSummary {
  tldr: string;
  sections: { heading: string; points: string[] }[];
}

// Response shape shared by the thumbnail summary messages to the background script
export interface ThumbnailSummaryResponse {
  success: boolean;
  data?: ThumbnailSummary | null;
  cached?: boolean;
  error?: string;
  errorCode?: "NO_API_KEY" | "API_ERROR" | "BAD_RESPONSE";
}

export interface Article {
  title: string;
  url: string;
  content: string;
}

export interface ArticleResponse {
  success: boolean;
  data?: Article | null;
  error?: string;
}
