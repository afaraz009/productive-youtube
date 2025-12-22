// Main content script - orchestrates all features

// Import types
import { Settings } from "./types";

// Import settings management
import { settings, loadSettings, updateSettings } from "./settings";

// Import removers
import { removeShorts, throttledRemoveShorts } from "./removers/shorts";
import { removeHomepageVideos, throttledRemoveHomepageVideos } from "./removers/homepage";
import { removeVideoSuggestions, throttledRemoveVideoSuggestions } from "./removers/suggestions";
import { removeShortsButton, throttledRemoveShortsButton } from "./removers/shortsButton";

// Import transcript functionality
import { showVideoTranscript, isWatchPage, isHomePage } from "./transcript";

// Track last video ID to detect video changes during SPA navigation
let lastVideoId: string | null = null;

// Extended initialization to handle all features
function initializeFullExtension(): void {
  console.log("Productive YouTube: Initializing...");

  // Load settings and then initialize
  loadSettings(function () {
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

    console.log("Productive YouTube: Observer started");
  });
}

// Apply all removal functions based on current page
function applyAllRemovals(): void {
  // Always check these regardless of page
  removeShorts();
  removeShortsButton();

  // Page-specific removals
  if (isWatchPage()) {
    removeVideoSuggestions(); // Always call - function handles restore internally

    // Sync lastVideoId on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get("v");
    if (currentVideoId) {
      lastVideoId = currentVideoId;
    }

    showVideoTranscript();
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

// Listen for settings changes and apply them immediately
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "local") {
    let needsUpdate = false;

    for (let key in changes) {
      if (settings.hasOwnProperty(key)) {
        updateSettings({ [key]: changes[key].newValue });
        console.log(`Setting ${key} changed to ${changes[key].newValue}`);
        needsUpdate = true;
      }
    }

    // If settings changed, apply them immediately
    if (needsUpdate) {
      console.log("Applying settings changes immediately...");
      applyAllRemovals();
    }
  }
});

// Handle YouTube SPA navigation
function handleYouTubeNavigation(): void {
  if (isWatchPage()) {
    // Get current video ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get("v");

    // Only show transcript if video changed or first load
    if (currentVideoId && currentVideoId !== lastVideoId) {
      console.log("Productive YouTube: Navigation detected, video changed from", lastVideoId, "to", currentVideoId);
      lastVideoId = currentVideoId;

      // Small delay to let YouTube update its player response
      setTimeout(() => {
        showVideoTranscript();
      }, 500);
    }

    removeVideoSuggestions();
  } else {
    lastVideoId = null;
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
  console.log("Productive YouTube: yt-navigate-finish event detected");
  handleYouTubeNavigation();

  // Also apply other removals
  removeShorts();
  removeShortsButton();
  if (isHomePage()) {
    removeHomepageVideos();
  }
});

// Also listen for popstate (browser back/forward)
window.addEventListener("popstate", () => {
  console.log("Productive YouTube: popstate event detected");
  setTimeout(() => {
    handleYouTubeNavigation();
    removeShorts();
    removeShortsButton();
    if (isHomePage()) {
      removeHomepageVideos();
    }
  }, 300);
});
