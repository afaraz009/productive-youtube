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
  removeComments: boolean;

  // AI Settings
  aiService: AIService;
  aiPrompts: AIPrompts;
}

// A saved transcript highlight (see highlightStorage.ts for what each field means).
// Shared by the frontend (highlight.ts, HighlightsView.tsx) and the backend (src/notes/).
export type Point = { key: string; offset: number };
export type SavedHighlight = { id: string; start: Point; end: Point; text: string };

// a saved highlight + the video it belongs to
export type HighlightWithVideo = SavedHighlight & { videoId: string };

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
