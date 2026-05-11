import { getSettings } from "../../core/settings";
import { HOMEPAGE_VIDEO_SELECTORS } from "../../core/selectors";

// Generic restore function
function restoreElements(
  selectors: string[],
  dataAttribute: string,
  logName: string
): void {
  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (htmlElement && htmlElement.dataset[dataAttribute]) {
        htmlElement.style.display = "";
        delete htmlElement.dataset[dataAttribute];
      }
    });
  });
}

// Function to remove all suggested videos from the homepage
export function removeHomepageVideos(): void {
  const settings = getSettings();
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
      }
    });
  });
}

// Throttled function to remove homepage videos
let homepageTimeoutId: number;
export function throttledRemoveHomepageVideos(): void {
  clearTimeout(homepageTimeoutId);
  homepageTimeoutId = window.setTimeout(removeHomepageVideos, 100);
}
