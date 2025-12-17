// DOM selectors for YouTube elements

// Multiple selectors to handle YouTube's changing DOM structure
export const SHORTS_SELECTORS: string[] = [
  "ytd-reel-shelf-renderer",
  "ytd-rich-shelf-renderer[is-shorts]",
  '[aria-label*="Shorts"]',
  "ytd-shells-renderer",
  '#dismissible[class*="shorts"]',
];

// Shorts button in sidebar - more comprehensive selectors
export const SHORTS_BUTTON_SELECTORS: string[] = [
  'ytd-guide-entry-renderer:has(a[href="/shorts"])',
  'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
  'ytd-guide-entry-renderer:has([title="Shorts"])',
  'ytd-mini-guide-entry-renderer:has([title="Shorts"])',
  'a[href="/shorts"]',
  'a[title="Shorts"]',
  '#guide-icon[href*="/shorts"]',
];

// Selectors for video suggestions in the right sidebar when watching a video
export const VIDEO_SUGGESTIONS_SELECTORS: string[] = [
  "#secondary-inner ytd-compact-video-renderer",
  "#secondary-inner ytd-compact-playlist-renderer",
  "#secondary-inner ytd-reel-shelf-renderer",
  "ytd-watch-next-secondary-results-renderer",
  "#related ytd-video-renderer",
  "#related ytd-compact-video-renderer",
  "#related ytd-reel-shelf-renderer",
  ".ytd-watch-next-secondary-results-renderer #items ytd-video-renderer",
  ".ytd-watch-next-secondary-results-renderer #items ytd-compact-video-renderer",
  "ytd-continuation-item-renderer:has(#related)",
  '[data-session-link]:not([href*="/shorts/"]) > ytd-thumbnail',
  "ytd-item-section-renderer:has(ytd-compact-video-renderer)",
];

// Selectors for suggested videos on the homepage
export const HOMEPAGE_VIDEO_SELECTORS: string[] = [
  "ytd-rich-item-renderer",
  "ytd-rich-grid-row",
  "ytd-rich-grid-renderer",
  "ytd-two-column-browse-results-renderer #primary #contents",
  'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
  'ytd-browse[page-subtype="home"] ytd-rich-item-renderer',
  'ytd-browse[page-subtype="home"] ytd-rich-grid-row',
  "ytd-grid-video-renderer",
  "ytd-video-renderer",
  "ytd-item-section-renderer",
];

// Video suggestions that appear after video ends (the large grid overlay)
export const VIDEO_END_SUGGESTIONS_SELECTORS: string[] = [
  ".ytp-suggestion-set",
  ".ytp-videowall-still",
  ".ytp-show-tiles",
  "div.ytp-pause-overlay",
  ".ytp-scroll-min",
  ".ytp-scroll-max",
];
