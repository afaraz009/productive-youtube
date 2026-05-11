import { getSettings } from "../../core/settings";
import { COMMENT_SELECTORS } from "../../core/selectors";

// Function to find and remove the Comments section
export function removeComments(): void {
  const settings = getSettings();
  const shouldHideComments =
    settings.mode === "focus" ||
    settings.mode === "learn" ||
    settings.removeComments;

  if (!shouldHideComments) {
    COMMENT_SELECTORS.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display === "none") {
          htmlEl.style.display = "";
        }
      });
    });
    return;
  }

  // Actively hide comments
  COMMENT_SELECTORS.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.display !== "none") {
        htmlEl.style.display = "none";
        // Also remove content to be safe
        htmlEl.innerHTML = "";
      }
    });
  });
}

// Throttled version
let commentTimeout: number;
export function throttledRemoveComments(): void {
  clearTimeout(commentTimeout);
  commentTimeout = window.setTimeout(removeComments, 100);
}
