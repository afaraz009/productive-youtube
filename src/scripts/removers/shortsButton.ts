import { getSettings } from "../settings";

// Function to remove Shorts button from sidebar
export function removeShortsButton(): void {
  const settings = getSettings();
  if (!settings.removeShortsButton) {
    // Restore by checking all possible containers
    const allContainers = document.querySelectorAll(
      "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
    );
    allContainers.forEach((container) => {
      const htmlElement = container as HTMLElement;
      if (htmlElement && htmlElement.dataset.shortsButtonRemoved) {
        htmlElement.style.display = "";
        delete htmlElement.dataset.shortsButtonRemoved;
      }
    });
    return;
  }

  let removedCount = 0; // Method 1: Find by direct container selectors
  const containerSelectors = [
    'ytd-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-guide-entry-renderer:has([title="Shorts"])',
    'ytd-mini-guide-entry-renderer:has([title="Shorts"])',
  ];

  containerSelectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement && !htmlElement.dataset.shortsButtonRemoved) {
          htmlElement.dataset.shortsButtonRemoved = "true";
          htmlElement.style.display = "none";
          removedCount++;
        }
      });
    } catch (e) {
      // :has() might not be supported in some browsers, continue
    }
  });

  // Method 2: Find links and hide parent containers
  const linkSelectors = ['a[href="/shorts"]', 'a[title="Shorts"]'];
  linkSelectors.forEach((selector) => {
    const links = document.querySelectorAll(selector);
    links.forEach((link) => {
      const parent = link.closest(
        "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
      ) as HTMLElement;
      if (parent && !parent.dataset.shortsButtonRemoved) {
        parent.dataset.shortsButtonRemoved = "true";
        parent.style.display = "none";
        removedCount++;
      }
    });
  });
}

// Throttled functions for all new features
let shortsButtonTimeoutId: number;
export function throttledRemoveShortsButton(): void {
  clearTimeout(shortsButtonTimeoutId);
  shortsButtonTimeoutId = window.setTimeout(removeShortsButton, 100);
}
