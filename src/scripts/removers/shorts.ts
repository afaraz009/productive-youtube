import { settings } from "../settings";
import { SHORTS_SELECTORS } from "../selectors";

// Function to find and remove the Shorts section
export function removeShorts(): void {
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
        console.log(
          `YouTube Shorts Remover: Hidden element with selector: ${selector}`
        );
      }
    });
  });

  if (removedCount > 0) {
    console.log(
      `YouTube Shorts Remover: Hidden ${removedCount} Shorts shelf(s)`
    );
  }
}

// Function to restore Shorts when feature is disabled
export function restoreShorts(): void {
  let restoredCount = 0;
  SHORTS_SELECTORS.forEach((selector) => {
    const shortsShelves = document.querySelectorAll(selector);
    shortsShelves.forEach((shelf) => {
      const shelfElement = shelf as HTMLElement;
      if (shelfElement && shelfElement.dataset.shortsRemoved) {
        shelfElement.style.display = "";
        delete shelfElement.dataset.shortsRemoved;
        restoredCount++;
      }
    });
  });
  if (restoredCount > 0) {
    console.log(
      `Productive YouTube: Restored ${restoredCount} Shorts shelf(s)`
    );
  }
}

// Throttled function to avoid excessive calls
let timeoutId: number;
export function throttledRemoveShorts(): void {
  clearTimeout(timeoutId);
  timeoutId = window.setTimeout(removeShorts, 100);
}
