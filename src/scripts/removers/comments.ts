
import { settings } from "../settings";
import { COMMENTS_SELECTORS } from "../selectors";

// Hide or restore YouTube comments based on settings
export function removeComments(): void {
  COMMENTS_SELECTORS.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (settings.removeComments) {
        element.style.setProperty("display", "none", "important");
      } else {
        element.style.removeProperty("display");
      }
    });
  });
}

// Throttled function for dynamically loaded comments
let timeout: ReturnType<typeof setTimeout> | null = null;

export function throttledRemoveComments(): void {
  if (timeout) return;

  timeout = setTimeout(() => {
    removeComments();
    timeout = null;
  }, 200);
}
