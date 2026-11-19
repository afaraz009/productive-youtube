// Main content script - orchestrates all features

// Import types
import { Settings } from "./types";

import { initAuthState } from "./authState";

// Import settings management
import { settings, loadSettings, updateSettings } from "./settings";

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
import { removeComments, throttledRemoveComments } from "./removers/comments";
// Import transcript functionality
import {
  showVideoTranscript,
  cleanupTranscript,
  isWatchPage,
  isHomePage,
} from "./transcript";
import { clearActiveSavedNoteRange } from "./transcript/display";
// Track last video ID to detect video changes during SPA navigation
let lastVideoId: string | null = null;

// Extended initialization to handle all features
function initializeFullExtension(): void {
  initAuthState((user) => {
    console.log(
      "[Productive YouTube] auth state:",
      user ? user.email : "signed out",
    );
  });
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
  });
}

// Apply all removal functions based on current page
function applyAllRemovals(): void {
  // Always check these regardless of page
  removeShorts();
  removeShortsButton();
  removeComments();

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
  throttledRemoveComments();
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
        needsUpdate = true;
      }
    }


// Enforce Focus Lock in the content script
const lockIsActive =
  settings.focusLockEnabled &&
  settings.focusLockUntil > Date.now();

if (lockIsActive) {
  const restoreSettings: Partial<Settings> = {};

  settings.focusLockFeatures.forEach((key) => {
    const expectedValue = settings.focusLockValues[key];

    if (
      expectedValue !== undefined &&
      changes[key]?.newValue !== undefined &&
      changes[key].newValue !== expectedValue
    ) {
      restoreSettings[key] = expectedValue;
    }
  });

  if (Object.keys(restoreSettings).length > 0) {
    updateSettings(restoreSettings);
    chrome.storage.local.set(restoreSettings);
  }
}


    // If settings changed, apply them immediately
    if (needsUpdate) {
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
      lastVideoId = currentVideoId;
      clearActiveSavedNoteRange();

      // Give YouTube more time to render the page on SPA navigation
      setTimeout(() => {
        showVideoTranscript();
      }, 1000); // Increased from 500ms to 1000ms
    }

    removeVideoSuggestions();
  } else {
    lastVideoId = null;
    clearActiveSavedNoteRange();
    cleanupTranscript(); // Remove transcript when navigating away from watch page
  }

  removeComments();
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
