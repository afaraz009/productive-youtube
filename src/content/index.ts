// Main content script - orchestrates all features
import { initializeSettings, getSettings } from "../core/settings";

// Import features
import { removeShorts, throttledRemoveShorts } from "../features/blockers/shorts";
import { removeHomepageVideos, throttledRemoveHomepageVideos } from "../features/blockers/homepage";
import { removeVideoSuggestions, throttledRemoveVideoSuggestions } from "../features/blockers/suggestions";
import { removeShortsButton, throttledRemoveShortsButton } from "../features/blockers/shortsButton";
import { removeComments, throttledRemoveComments } from "../features/blockers/comments";
import { showVideoTranscript, cleanupTranscript, isWatchPage, isHomePage } from "../features/transcript";

let lastVideoId: string | null = null;
let isInitialLoadComplete = false;

/**
 * Main Entry Point
 */
function initializeFullExtension(): void {
  initializeSettings(
    () => {
      // 1. Initial State
      updateCSSOverrides();
      applyAllRemovals();

      // 2. Observer for dynamic content
      const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            shouldCheck = true;
            break;
          }
        }
        if (shouldCheck) applyAllRemovalsThrottled();
      });

      const targetNode = document.querySelector("ytd-app") || document.body;
      observer.observe(targetNode, { childList: true, subtree: true });

      // 3. Robust Initial Load handler (runs only once)
      handleInitialLoad();
    },
    () => {
      // Throttled refresh when settings change
      updateCSSOverrides();
      applyAllRemovals();
    },
  );
}

/**
 * Ensures transcript shows on the very first page load (no refresh needed)
 */
function handleInitialLoad() {
  if (isInitialLoadComplete) return;

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const sidebar = document.querySelector("#secondary-inner") || document.querySelector("#secondary");
    const transcriptExists = document.getElementById('transcript-container');

    if (transcriptExists || attempts > 20) {
      clearInterval(interval);
      isInitialLoadComplete = true;
      return;
    }

    if (isWatchPage() && sidebar) {
      showVideoTranscript();
      // Don't clear yet, wait for transcriptExists check in next tick
    }
  }, 1000);
}

function updateCSSOverrides(): void {
  const settings = getSettings();
  const html = document.documentElement;
  const setHideClass = (cls: string, shouldHide: boolean) => shouldHide ? html.classList.add(cls) : html.classList.remove(cls);

  setHideClass("hide-shorts", settings.removeShorts);
  setHideClass("hide-shorts-button", settings.removeShortsButton);
  setHideClass("hide-homepage", settings.removeHomepageVideos);
  setHideClass("hide-suggestions", settings.removeWatchPageSuggestions);
  setHideClass("hide-comments", settings.removeComments);
}

function applyAllRemovals(): void {
  removeShorts();
  removeShortsButton();
  removeComments();

  if (isWatchPage()) {
    const videoId = new URLSearchParams(window.location.search).get("v");
    if (videoId) lastVideoId = videoId;
    
    // Only call directly if it's not the first load (initial load handled by interval)
    if (isInitialLoadComplete) showVideoTranscript();
    removeVideoSuggestions();
  } else if (isHomePage()) {
    removeHomepageVideos();
  }
}

function applyAllRemovalsThrottled(): void {
  throttledRemoveShorts();
  throttledRemoveShortsButton();
  throttledRemoveComments();

  if (isWatchPage()) {
    throttledRemoveVideoSuggestions();
  } else if (isHomePage()) {
    throttledRemoveHomepageVideos();
  }
}

function handleYouTubeNavigation(): void {
  if (isWatchPage()) {
    const videoId = new URLSearchParams(window.location.search).get("v");

    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      setTimeout(() => showVideoTranscript(), 800);
    }
    removeVideoSuggestions();
  } else {
    lastVideoId = null;
    cleanupTranscript();
  }
}

// Event Listeners
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFullExtension);
} else {
  initializeFullExtension();
}

document.addEventListener("yt-navigate-finish", () => {
  setTimeout(() => {
    handleYouTubeNavigation();
    removeShorts();
    removeShortsButton();
    removeComments();
    if (isHomePage()) removeHomepageVideos();
  }, 100);
});

window.addEventListener("popstate", () => {
  setTimeout(() => {
    handleYouTubeNavigation();
    removeShorts();
    removeShortsButton();
    removeComments();
  }, 300);
});
