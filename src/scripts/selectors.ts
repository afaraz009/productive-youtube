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

// Thumbnail TL;DR summary: containers that represent one video "tile"
export const VIDEO_TILE_SELECTORS: string[] = [
  "yt-lockup-view-model",
  "ytm-shorts-lockup-view-model",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-playlist-video-renderer",
  "ytd-playlist-panel-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-movie-renderer",
];

// Thumbnail TL;DR summary: the clickable thumbnail link inside a tile
export const THUMBNAIL_ANCHOR_SELECTORS: string[] = [
  "a#thumbnail[href]",
  "a.ytLockupViewModelContentImage[href]",
  "a.yt-lockup-view-model__content-image[href]",
  "a.yt-lockup-view-model-wiz__content-image[href]",
  "a.shortsLockupViewModelHostEndpoint[href]",
  "a.reel-item-endpoint[href]",
];

// Thumbnail TL;DR summary: title element inside a tile (first match wins)
export const VIDEO_TILE_TITLE_SELECTORS: string[] = [
  "#video-title",
  "a#video-title-link",
  ".ytLockupMetadataViewModelTitle",
  ".yt-lockup-metadata-view-model__title",
  ".yt-lockup-metadata-view-model-wiz__title",
  "h3 a[title]",
  "h3",
];

// Thumbnail TL;DR summary: never attach inside these
export const THUMBNAIL_SUMMARY_EXCLUDE_SELECTOR =
  "#movie_player, ytd-miniplayer, #transcript-container, .ytp-videowall-still";

// Video suggestions that appear after video ends (the large grid overlay)
export const VIDEO_END_SUGGESTIONS_SELECTORS: string[] = [
  ".ytp-suggestion-set",
  ".ytp-videowall-still",
  ".ytp-show-tiles",
  "div.ytp-pause-overlay",
  ".ytp-scroll-min",
  ".ytp-scroll-max",
];







//Video comment Selectors
export const COMMENTS_SELECTORS: string[] = [
  "#comments",
  "ytd-comments", 
  "ytd-comments#comments",
  "ytd-comments#comments ytd-item-section-renderer",
  "ytd-comments#comments ytd-item-section-renderer #contents",
  "ytd-comment-thread-renderer",
  "ytd-comment-renderer",
  "ytd-comments-header-renderer",
  "ytd-comments-header-renderer #header",
  "ytd-comments-header-renderer #title",
  "ytd-comments-header-renderer #count",
  "ytd-comments-header-renderer #sort-menu",
  "ytd-comments-header-renderer #sort-menu ytd-toggle-button-renderer",
  "ytd-comments-header-renderer #sort-menu ytd-toggle-button-renderer yt-icon",
  "ytd-comments-header-renderer #sort-menu ytd-toggle-button-renderer yt-icon-button",
  "ytd-comments-header-renderer #sort-menu ytd-toggle-button-renderer yt-icon-button yt-icon",
];
