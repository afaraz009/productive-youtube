import { getSettings } from "../../core/settings";
import { SHORTS_SELECTORS } from "../../core/selectors";

// Function to find and remove the Shorts section
export function removeShorts(): void {
  const settings = getSettings();
  // Check if feature is enabled
  if (!settings.removeShorts) {
    // If disabled, restore previously hidden elements
    restoreShorts();
    return;
  }

  let removedCount = 0;

  SHORTS_SELECTORS.forEach((selector) => {
    const shortsShelves = document.querySelectorAll(selector);
    shortsShelves.forEach((shelf) => {
      const shelfElement = shelf as HTMLElement;
      if (shelfElement && !shelfElement.dataset.shortsRemoved) {
        shelfElement.dataset.shortsRemoved = "true";
        shelfElement.style.display = "none";
        removedCount++;
      }
    });
  });
}

// Function to restore Shorts when feature is disabled
export function restoreShorts(): void {
  SHORTS_SELECTORS.forEach((selector) => {
    const shortsShelves = document.querySelectorAll(selector);
    shortsShelves.forEach((shelf) => {
      const shelfElement = shelf as HTMLElement;
      if (shelfElement && shelfElement.dataset.shortsRemoved) {
        shelfElement.style.display = "";
        delete shelfElement.dataset.shortsRemoved;
      }
    });
  });
}

// Throttled function to avoid excessive calls
let timeoutId: number;
export function throttledRemoveShorts(): void {
  clearTimeout(timeoutId);
  timeoutId = window.setTimeout(removeShorts, 100);
}
