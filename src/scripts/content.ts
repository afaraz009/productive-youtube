// Main content script - orchestrates all features

// Import settings management
import { initializeSettings, getSettings } from "./settings";

// Import removers
import { removeShorts, throttledRemoveShorts } from "./removers/shorts";
import { removeHomepageVideos, throttledRemoveHomepageVideos } from "./removers/homepage";
import { removeVideoSuggestions, throttledRemoveVideoSuggestions } from "./removers/suggestions";
import { removeShortsButton, throttledRemoveShortsButton } from "./removers/shortsButton";

// Import transcript functionality
import { showVideoTranscript, cleanupTranscript, isWatchPage, isHomePage } from "./transcript";

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
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                shouldCheck = true;
                break;
              }
            }
          }
        });

        if (shouldCheck) {
          applyAllRemovalsThrottled();
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    },
    () => {
      // If settings changed, update CSS overrides and apply removals
      updateCSSOverrides();
      applyAllRemovals();
    }
  );
}

/**
 * Updates classes on the HTML element to override the default CSS blocking
 */
function updateCSSOverrides(): void {
  const settings = getSettings();
  const html = document.documentElement;

  // If a setting is FALSE, we add a class to SHOW that element (override the blocker.css)
  if (!settings.removeShorts) html.classList.add('show-shorts');
  else html.classList.remove('show-shorts');

  if (!settings.removeShortsButton) html.classList.add('show-shorts-button');
  else html.classList.remove('show-shorts-button');

  if (!settings.removeHomepageVideos) html.classList.add('show-homepage');
  else html.classList.remove('show-homepage');

  if (!settings.removeWatchPageSuggestions) html.classList.add('show-suggestions');
  else html.classList.remove('show-suggestions');
}

// Apply all removal functions based on current page
function applyAllRemovals(): void {
  // Always check these regardless of page
  removeShorts();
  removeShortsButton();

  // Page-specific removals
  if (isWatchPage()) {
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
  } else {
    lastVideoId = null;
    cleanupTranscript(); // Remove transcript when navigating away from watch page
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
    if (isHomePage()) {
      removeHomepageVideos();
    }
  }, 300);
});
