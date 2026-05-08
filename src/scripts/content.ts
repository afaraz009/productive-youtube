// Main content script - orchestrates all features

// Import settings management
import { initializeSettings, getSettings } from "./settings";

// Import removers
import { removeShorts, throttledRemoveShorts } from "./removers/shorts";
import {
  removeHomepageVideos,
  throttledRemoveHomepageVideos,
} from "./removers/homepage";
import {
  removeVideoSuggestions,
  throttledRemoveVideoSuggestions,
} from "./removers/suggestions";
import {
  removeShortsButton,
  throttledRemoveShortsButton,
} from "./removers/shortsButton";
import { showIntentWall, removeIntentWall } from "./removers/intentWall";
import { removeComments, throttledRemoveComments } from "./removers/comments";

// Import transcript functionality
import {
  showVideoTranscript,
  cleanupTranscript,
  isWatchPage,
  isHomePage,
} from "./transcript";

// Track last video ID to detect video changes during SPA navigation
let lastVideoId: string | null = null;

// Extended initialization to handle all features
function initializeFullExtension(): void {
  // Initialize settings and then start the extension
  initializeSettings(
    () => {
      // Apply CSS overrides based on initial settings
      updateCSSOverrides();

      // Apply all removals based on settings
      applyAllRemovals();

      // Create observer for dynamic content
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;

        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                // Ignore small noise like progress bars, timestamps, or player controls
                // which change thousands of times per session
                if (
                  el.classList.contains("ytp-progress-bar") ||
                  el.classList.contains("ytp-time-display") ||
                  el.tagName === "SPAN" ||
                  el.tagName === "PATH"
                ) {
                  continue;
                }

                shouldCheck = true;
                break;
              }
            }
          }
          if (shouldCheck) break;
        }

        if (shouldCheck) {
          applyAllRemovalsThrottled();
        }
      });

      // Optimization: Watch the main app container instead of the whole body
      // This ignores many background scripts and technical tags
      const targetNode = document.querySelector("ytd-app") || document.body;

      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      });

      console.log(
        `Productive YouTube: Observer started on <${targetNode.tagName.toLowerCase()}>`,
      );
    },
    () => {
      // If settings changed, update CSS overrides and apply removals
      updateCSSOverrides();
      applyAllRemovals();
    },
  );
}

/**
 * Updates classes on the HTML element to override the default CSS blocking
 */
function updateCSSOverrides(): void {
  const settings = getSettings();
  const html = document.documentElement;

  // If a setting is FALSE, we add a class to SHOW that element (override the blocker.css)
  if (!settings.removeShorts) html.classList.add("show-shorts");
  else html.classList.remove("show-shorts");

  if (!settings.removeShortsButton) html.classList.add("show-shorts-button");
  else html.classList.remove("show-shorts-button");

  if (!settings.removeHomepageVideos) html.classList.add("show-homepage");
  else html.classList.remove("show-homepage");

  if (!settings.removeWatchPageSuggestions)
    html.classList.add("show-suggestions");
  else html.classList.remove("show-suggestions");

  if (!settings.removeComments) html.classList.add("show-comments");
  else html.classList.remove("show-comments");
}

// Apply all removal functions based on current page
function applyAllRemovals(): void {
  // Always check these regardless of page
  removeShorts();
  removeShortsButton();
  showIntentWall();
  removeComments();

  // Page-specific removals
  if (isWatchPage()) {
    removeIntentWall(); // Never show wall on watch page
    // Sync lastVideoId on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get("v");
    if (currentVideoId) {
      lastVideoId = currentVideoId;
    }

    // IMPORTANT: Show transcript BEFORE hiding suggestions
    // so the transcript container exists before we check for it
    showVideoTranscript();

    // Then hide suggestions (but skip transcript container)
    removeVideoSuggestions(); // Always call - function handles restore internally
  } else if (isHomePage()) {
    removeHomepageVideos();
  }
}

// Throttled version of applyAllRemovals
function applyAllRemovalsThrottled(): void {
  throttledRemoveShorts();
  throttledRemoveShortsButton();
  throttledRemoveComments();
  showIntentWall();

  if (isWatchPage()) {
    throttledRemoveVideoSuggestions();
    // Note: showVideoTranscript is handled by navigation listener, not here
    // to avoid excessive calls during DOM mutations
  } else if (isHomePage()) {
    throttledRemoveHomepageVideos();
  }
}

// Handle YouTube SPA navigation
function handleYouTubeNavigation(): void {
  if (isWatchPage()) {
    removeIntentWall();
    // Get current video ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get("v");

    // Only show transcript if video changed or first load
    if (currentVideoId && currentVideoId !== lastVideoId) {
      lastVideoId = currentVideoId;

      // Give YouTube more time to render the page on SPA navigation
      setTimeout(() => {
        showVideoTranscript();
      }, 1000); // Increased from 500ms to 1000ms
    }

    removeVideoSuggestions();
  } else if (isHomePage()) {
    lastVideoId = null;
    cleanupTranscript(); // Remove transcript when navigating away from watch page
    showIntentWall();
  } else {
    lastVideoId = null;
    cleanupTranscript();
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFullExtension);
} else {
  initializeFullExtension();
}

// Listen for YouTube's SPA navigation events
// This fires when YouTube navigates between pages without a full reload
document.addEventListener("yt-navigate-finish", () => {
  // Add a small delay to let YouTube finish its navigation
  setTimeout(() => {
    handleYouTubeNavigation();

    // Also apply other removals
    removeShorts();
    removeShortsButton();
    removeComments();
    if (isHomePage()) {
      removeHomepageVideos();
    }
  }, 100);
});

// Also listen for popstate (browser back/forward)
window.addEventListener("popstate", () => {
  setTimeout(() => {
    handleYouTubeNavigation();
    removeShorts();
    removeShortsButton();
    removeComments();
    if (isHomePage()) {
      removeHomepageVideos();
    }
  }, 300);
});
