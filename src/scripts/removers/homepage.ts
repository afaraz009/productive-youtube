import { settings } from "../settings";
import { HOMEPAGE_VIDEO_SELECTORS } from "../selectors";

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

// Function to remove all suggested videos from the homepage
export function removeHomepageVideos(): void {
  // Check if feature is enabled
  if (!settings.removeHomepageVideos) {
    restoreElements(
      HOMEPAGE_VIDEO_SELECTORS,
      "homepageVideosRemoved",
      "homepage videos"
    );
    return;
  }

  let removedCount = 0;

  HOMEPAGE_VIDEO_SELECTORS.forEach((selector) => {
    const videoElements = document.querySelectorAll(selector);
    videoElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (htmlElement && !htmlElement.dataset.homepageVideosRemoved) {
        // Skip elements that might be part of the header or navigation
        const role = htmlElement.getAttribute("role");
        const ariaLabel = htmlElement.getAttribute("aria-label");

        // Don't hide navigation or header elements
        if (
          role === "navigation" ||
          role === "banner" ||
          (ariaLabel &&
            (ariaLabel.includes("header") || ariaLabel.includes("navigation")))
        ) {
          return;
        }

        htmlElement.dataset.homepageVideosRemoved = "true";
        htmlElement.style.display = "none";
        removedCount++;
        console.log(
          `Homepage Videos Remover: Hidden element with selector: ${selector}`
        );
      }
    });
  });

  if (removedCount > 0) {
    console.log(
      `Homepage Videos Remover: Hidden ${removedCount} homepage video elements`
    );
  }
}

// Throttled function to remove homepage videos
let homepageTimeoutId: number;
export function throttledRemoveHomepageVideos(): void {
  clearTimeout(homepageTimeoutId);
  homepageTimeoutId = window.setTimeout(removeHomepageVideos, 100);
}
