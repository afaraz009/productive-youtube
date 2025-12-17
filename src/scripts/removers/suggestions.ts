import { settings } from "../settings";
import { VIDEO_SUGGESTIONS_SELECTORS } from "../selectors";

// Generic restore function
function restoreElements(
  selectors: string[],
  dataAttribute: string,
  logName: string
): void {
  let restoredCount = 0;
  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (htmlElement && htmlElement.dataset[dataAttribute]) {
        htmlElement.style.display = "";
        delete htmlElement.dataset[dataAttribute];
        restoredCount++;
      }
    });
  });
  if (restoredCount > 0) {
    console.log(`Productive YouTube: Restored ${restoredCount} ${logName}`);
  }
}

// Function to remove video suggestions in the right sidebar (excluding playlist content)
export function removeVideoSuggestions(): void {
  if (!settings.removeWatchPageSuggestions) {
    restoreElements(
      VIDEO_SUGGESTIONS_SELECTORS,
      "suggestionsRemoved",
      "video suggestions"
    );
    return;
  }

  let removedCount = 0;

  VIDEO_SUGGESTIONS_SELECTORS.forEach((selector) => {
    try {
      const suggestionElements = document.querySelectorAll(selector);
      suggestionElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        // Check if this element is part of a playlist
        const isPlaylistItem =
          htmlElement.closest("#items.ytd-playlist-panel-renderer") ||
          htmlElement.closest("ytd-playlist-panel-video-renderer") ||
          htmlElement.closest("ytd-playlist-panel-renderer") ||
          (htmlElement.id && htmlElement.id.includes("playlist"));

        if (
          !isPlaylistItem &&
          htmlElement &&
          !htmlElement.dataset.suggestionsRemoved
        ) {
          htmlElement.dataset.suggestionsRemoved = "true";
          htmlElement.style.display = "none";
          removedCount++;
          console.log(
            `Video Suggestions Remover: Hidden element with selector: ${selector}`
          );
        } else if (isPlaylistItem) {
          console.log(`Video Suggestions Remover: Skipped playlist item`);
        } else if (htmlElement && htmlElement.dataset.suggestionsRemoved) {
          // Element already processed, skip
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.log(
        `Video Suggestions Remover: Error with selector ${selector}:`,
        errorMessage
      );
    }
  });

  if (removedCount > 0) {
    console.log(
      `Video Suggestions Remover: Hidden ${removedCount} video suggestion elements`
    );
  }
}

// Throttled function for removing video suggestions to avoid excessive calls
let suggestionTimeoutId: number;
export function throttledRemoveVideoSuggestions(): void {
  clearTimeout(suggestionTimeoutId);
  suggestionTimeoutId = window.setTimeout(removeVideoSuggestions, 100);
}
