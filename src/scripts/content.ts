// Main content script - orchestrates/executes all features
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

// Import thumbnail TL;DR feature
import {
  initThumbnailSummary,
  applyThumbnailSummarySetting,
  closeAllSummaryCards,
} from "./thumbnailSummary";

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

    // Hover listeners for the thumbnail TL;DR (they check the setting on every hover)
    initThumbnailSummary();

    // Create observer for dynamic content
    //MutationObserver -> watch for changes being made to the DOM tree
    const observer = new MutationObserver((mutations) => {
      // Recheck newly added DOM elements (video tiles, thumbnails, etc.) against the user's removal settings (Shorts, suggestions, etc.).
      let shouldCheck = false;
      // console.log("mutations: ",  mutations)
      mutations.forEach((mutation) => {
        //mutation represents the newly added video card/tile and addedNodes are the elements of that card. 
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

//-------------------------------------------------------------------------------------------------------
// Apply all removal functions based on current page
// Reapply all last saved settings
function applyAllRemovals(): void {
  // Always check these regardless of page
  removeShorts();
  removeShortsButton();
  applyThumbnailSummarySetting();
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
//-------------------------------------------------------------------------------------------------------
// Throttled version of applyAllRemovals
// Why Throttle ? -> Reapplies the settings "only for the changed elements", reducing cost
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
//-------------------------------------------------------------------------------------------------------
// Listen for settings changes and apply them immediately
chrome.storage.onChanged.addListener(function (changes, namespace) {
  //namespace -> the storage area that was changed, either "sync" or "local"
  if (namespace === "local") {
    let needsUpdate = false;
    //here changes is an object where the keys are the changed setting names and the values are objects with oldValue and newValue properties
    for (let key in changes) {
      if (settings.hasOwnProperty(key)) {
        //changes = { showTranscript: { oldValue: false, newValue: true } }
        updateSettings({ [key]: changes[key].newValue });
        needsUpdate = true;
      }
    }

    // If settings changed, apply them immediately
    if (needsUpdate) {
      applyAllRemovals();
    }
  }
});
//-------------------------------------------------------------------------------------------------------

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

  removeComments();
}


console.log("Step 1 - check state");

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFullExtension);
} else {
  initializeFullExtension();
}

//-------------------------------------------------------------------------------------------------------
if (document.readyState === "loading") { //the page hasn't loaded yet so start the extension when the page loads
  document.addEventListener("DOMContentLoaded",initializeFullExtension);

  console.log("Step 2 - waiting for DOMContentLoaded");

  document.addEventListener("DOMContentLoaded", () => {
    console.log("Step 3 - DOMContentLoaded, initializing extension");
  });


} else { 
  console.log("Step 4 - DOM already loaded, initializing extension");
  
  //already loaded, start the extension immediately
  initializeFullExtension();
}
//-------------------------------------------------------------------------------------------------------

// Listen for YouTube's SPA navigation events
// This fires when YouTube navigates between pages without a full reload
document.addEventListener("yt-navigate-finish", () => {
  // Add a small delay to let YouTube finish its navigation
  // Open TL;DR cards belong to the previous page's tiles
  closeAllSummaryCards();
  // Waiting for the YouTube navigation to finish
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
