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
import { showVideoTranscript, isWatchPage, isHomePage, setTranscriptSelectionInitializer } from "./transcript";

// Import translation functionality
import { initializeTranscriptSelection } from "./translation";

// Initialize the translation feature for transcript
setTranscriptSelectionInitializer(initializeTranscriptSelection);

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

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFullExtension);
} else {
  initializeFullExtension();
}
