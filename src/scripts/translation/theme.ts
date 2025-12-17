// Theme detection and management for translation popup

// Helper function to detect YouTube dark mode
export function isYouTubeDarkMode(): boolean {
  // Check YouTube's dark mode attribute on html element
  const htmlElement = document.documentElement;
  if (htmlElement.hasAttribute("dark")) {
    return true;
  }

  // Check for dark class
  if (htmlElement.classList.contains("dark")) {
    return true;
  }

  // Check body background color (YouTube uses these in dark mode)
  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  if (
    bodyBg === "rgb(15, 15, 15)" ||
    bodyBg === "rgb(24, 24, 24)" ||
    bodyBg === "rgb(33, 33, 33)"
  ) {
    return true;
  }

  // Fallback to system preference
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

// Helper function to update popup theme
export function updatePopupTheme(popup: HTMLDivElement): void {
  const isDark = isYouTubeDarkMode();
  console.log("updatePopupTheme called - isDark:", isDark);

  // Update main popup background
  popup.style.background = isDark
    ? "rgba(0, 0, 0, 0.95)"
    : "rgba(255, 255, 255, 0.98)";
  popup.style.boxShadow = `0 8px 32px rgba(0, 0, 0, ${
    isDark ? "0.3" : "0.15"
  })`;

  // Update header
  const header = popup.querySelector(
    "#yt-translation-popup > div:first-child"
  ) as HTMLElement;
  if (header) {
    header.style.background = isDark
      ? "rgba(0, 0, 0, 0.95)"
      : "rgba(255, 255, 255, 0.98)";
    const title = header.querySelector("h3") as HTMLElement;
    if (title) title.style.color = isDark ? "#f9fafb" : "#1f2937";

    const closeBtn = header.querySelector(
      "#close-translation-popup"
    ) as HTMLElement;
    if (closeBtn) closeBtn.style.color = isDark ? "#9ca3af" : "#6b7280";
  }

  // Update content
  const content = popup.querySelector("#translation-content") as HTMLElement;
  if (content) content.style.color = isDark ? "#e5e7eb" : "#374151";

  // Update loading spinner
  const loadingSpinner = popup.querySelector(
    "#translation-loading > div"
  ) as HTMLElement;
  if (loadingSpinner) {
    loadingSpinner.style.borderColor = isDark ? "#374151" : "#f3f4f6";
    loadingSpinner.style.borderTopColor = isDark ? "#60a5fa" : "#3b82f6";
  }
  const loadingText = popup.querySelector(
    "#translation-loading > p"
  ) as HTMLElement;
  if (loadingText) loadingText.style.color = isDark ? "#9ca3af" : "#6b7280";

  // Update all section labels
  const labels = popup.querySelectorAll(
    "#translation-result > div > div:first-child"
  );
  labels.forEach((label) => {
    (label as HTMLElement).style.color = isDark ? "#9ca3af" : "#6b7280";
  });

  // Update selected text box
  const selectedText = popup.querySelector("#selected-text") as HTMLElement;
  if (selectedText) {
    selectedText.style.background = isDark ? "#374151" : "#f9fafb";
    selectedText.style.color = isDark ? "#f9fafb" : "#1f2937";
    selectedText.style.borderLeftColor = isDark ? "#60a5fa" : "#3b82f6";
  }

  // Update Urdu translation box
  const urduTranslation = popup.querySelector(
    "#urdu-translation"
  ) as HTMLElement;
  if (urduTranslation) {
    urduTranslation.style.background = isDark ? "#064e3b" : "#ecfdf5";
    urduTranslation.style.color = isDark ? "#6ee7b7" : "#065f46";
  }

  // Update best word box
  const bestWord = popup.querySelector("#best-word") as HTMLElement;
  if (bestWord) {
    bestWord.style.background = isDark ? "#78350f" : "#fef3c7";
    bestWord.style.color = isDark ? "#fde68a" : "#92400e";
  }

  // Update context box
  const contextText = popup.querySelector("#context-text") as HTMLElement;
  if (contextText) {
    contextText.style.background = isDark ? "#1e3a8a" : "#eff6ff";
    contextText.style.color = isDark ? "#93c5fd" : "#1e40af";
  }

  // Update vocabulary tags
  const vocabTags = popup.querySelectorAll("#vocabulary-list > span");
  vocabTags.forEach((tag) => {
    const tagEl = tag as HTMLElement;
    tagEl.style.background = isDark ? "#1e3a8a" : "#dbeafe";
    tagEl.style.color = isDark ? "#93c5fd" : "#1e40af";
  });

  // Update scrollbar
  const style = popup.querySelector("style");
  if (style) {
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      #yt-translation-popup::-webkit-scrollbar {
        width: 8px;
      }

      #yt-translation-popup::-webkit-scrollbar-track {
        background: ${isDark ? "#1f2937" : "#f3f4f6"};
        border-radius: 4px;
      }

      #yt-translation-popup::-webkit-scrollbar-thumb {
        background: ${isDark ? "#4b5563" : "#d1d5db"};
        border-radius: 4px;
      }

      #yt-translation-popup::-webkit-scrollbar-thumb:hover {
        background: ${isDark ? "#6b7280" : "#9ca3af"};
      }

      #close-translation-popup:hover {
        color: ${isDark ? "#f9fafb" : "#1f2937"};
      }
    `;
  }
}
