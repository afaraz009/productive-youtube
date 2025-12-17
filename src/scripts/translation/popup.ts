import { TranslationResponse } from "../types";
import { isYouTubeDarkMode, updatePopupTheme } from "./theme";
import { translateWithAI } from "./api";

let translationPopup: HTMLDivElement | null = null;
let isLoadingTranslation = false;

// Create translation popup UI
export function createTranslationPopup(): HTMLDivElement {
  const popup = document.createElement("div");
  popup.id = "yt-translation-popup";

  popup.style.cssText = `
    position: fixed;
    z-index: 999999;
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 20px;
    max-width: 420px;
    min-width: 320px;
    max-height: 80vh;
    display: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-y: auto;
    overflow-x: hidden;
  `;

  popup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: sticky; top: -20px; padding: 20px 0 16px 0; margin: -20px 0 16px 0; z-index: 10; backdrop-filter: blur(20px);">
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">AI Translation</h3>
      <button id="close-translation-popup" style="
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      ">×</button>
    </div>

    <div id="translation-content" style="line-height: 1.5;">
      <div id="translation-loading" style="text-align: center; padding: 20px;">
        <div style="
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
        <p style="margin-top: 12px; font-size: 14px;">Generating translation...</p>
      </div>

      <div id="translation-result" style="display: none;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">SELECTED TEXT</div>
          <div id="selected-text" style="
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 14px;
            word-wrap: break-word;
          "></div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">اردو ترجمہ</div>
          <div id="urdu-translation" style="
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 15px;
            direction: rtl;
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
            word-wrap: break-word;
          "></div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">BEST ALTERNATIVE</div>
          <div id="best-word" style="
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 14px;
            word-wrap: break-word;
          "></div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">SIMILAR VOCABULARY</div>
          <div id="vocabulary-list" style="
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          "></div>
        </div>

        <div>
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">CONTEXT</div>
          <div id="context-text" style="
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.5;
            word-wrap: break-word;
          "></div>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      #yt-translation-popup::-webkit-scrollbar {
        width: 8px;
      }

      #yt-translation-popup::-webkit-scrollbar-track {
        border-radius: 4px;
      }

      #yt-translation-popup::-webkit-scrollbar-thumb {
        border-radius: 4px;
      }

      #yt-translation-popup::-webkit-scrollbar-thumb:hover {
      }

      #close-translation-popup:hover {
      }
    </style>
  `;

  document.body.appendChild(popup);

  // Apply initial theme
  updatePopupTheme(popup);

  // Track previous theme state to avoid unnecessary updates
  let previousThemeState = isYouTubeDarkMode();

  // Watch for theme changes with improved detection
  const themeObserver = new MutationObserver(() => {
    const currentThemeState = isYouTubeDarkMode();

    // Only update if theme has actually changed
    if (currentThemeState !== previousThemeState) {
      previousThemeState = currentThemeState;
      console.log(
        "AI Popup: Theme changed to",
        currentThemeState ? "dark" : "light"
      );

      // Always update popup theme, regardless of visibility
      updatePopupTheme(popup);
    }
  });

  // Observe changes to html element (YouTube changes 'dark' attribute and class)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dark", "class"],
    attributeOldValue: true,
    subtree: false,
  });

  // Also watch for body style changes
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
    subtree: false,
  });

  // Also observe prefers-color-scheme media query changes
  const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  prefersColorScheme.addEventListener("change", () => {
    const currentThemeState = isYouTubeDarkMode();
    if (currentThemeState !== previousThemeState) {
      previousThemeState = currentThemeState;
      console.log(
        "AI Popup: System theme changed to",
        currentThemeState ? "dark" : "light"
      );
      updatePopupTheme(popup);
    }
  });

  // Close button handler
  const closeBtn = popup.querySelector("#close-translation-popup");
  closeBtn?.addEventListener("click", () => {
    popup.style.display = "none";
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (popup.style.display === "block" && !popup.contains(e.target as Node)) {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        popup.style.display = "none";
      }
    }
  });

  return popup;
}

// Show translation popup with results
export function showTranslationPopup(text: string, x: number, y: number): void {
  if (!translationPopup) {
    translationPopup = createTranslationPopup();
  }

  // Dynamic positioning to keep popup within viewport
  const popupWidth = 420;
  const popupMaxHeight = window.innerHeight * 0.8; // 80vh
  const padding = 20;

  // Calculate horizontal position
  let left = x;
  if (left + popupWidth > window.innerWidth - padding) {
    left = window.innerWidth - popupWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }

  // Calculate vertical position
  let top = y + 10;
  if (top + popupMaxHeight > window.innerHeight - padding) {
    // Show above selection if not enough space below
    top = Math.max(padding, y - popupMaxHeight - 10);
  }

  translationPopup.style.left = `${left}px`;
  translationPopup.style.top = `${top}px`;
  translationPopup.style.display = "block";

  // Apply current theme IMMEDIATELY when showing
  setTimeout(() => {
    updatePopupTheme(translationPopup!);
  }, 0);

  // Show loading state
  const loadingDiv = translationPopup.querySelector(
    "#translation-loading"
  ) as HTMLElement;
  const resultDiv = translationPopup.querySelector(
    "#translation-result"
  ) as HTMLElement;
  const selectedTextDiv = translationPopup.querySelector(
    "#selected-text"
  ) as HTMLElement;

  loadingDiv.style.display = "block";
  resultDiv.style.display = "none";
  selectedTextDiv.textContent = text;

  // Fetch translation
  if (!isLoadingTranslation) {
    isLoadingTranslation = true;

    translateWithAI(text)
      .then((result: TranslationResponse) => {
        // Update UI with results
        const urduDiv = translationPopup!.querySelector(
          "#urdu-translation"
        ) as HTMLElement;
        const bestWordDiv = translationPopup!.querySelector(
          "#best-word"
        ) as HTMLElement;
        const vocabDiv = translationPopup!.querySelector(
          "#vocabulary-list"
        ) as HTMLElement;
        const contextDiv = translationPopup!.querySelector(
          "#context-text"
        ) as HTMLElement;

        urduDiv.textContent = result.urduTranslation;
        bestWordDiv.textContent = result.bestWord;
        contextDiv.textContent = result.context;

        // Render vocabulary tags
        const isDark = isYouTubeDarkMode();
        vocabDiv.innerHTML = result.vocabulary
          .map(
            (word: string) => `
          <span style="
            padding: 6px 12px;
            background: ${isDark ? "#1e3a8a" : "#dbeafe"};
            color: ${isDark ? "#93c5fd" : "#1e40af"};
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
          ">${word}</span>
        `
          )
          .join("");

        // Show results
        loadingDiv.style.display = "none";
        resultDiv.style.display = "block";

        // Apply theme to ALL elements after results are shown
        updatePopupTheme(translationPopup!);

        // Also re-apply the vocabulary tag styles as backup
        setTimeout(() => {
          updatePopupTheme(translationPopup!);
          // Re-render vocabulary tags with current theme
          const isDarkNow = isYouTubeDarkMode();
          const vocabSpans = vocabDiv.querySelectorAll("span");
          vocabSpans.forEach((span) => {
            span.style.background = isDarkNow ? "#1e3a8a" : "#dbeafe";
            span.style.color = isDarkNow ? "#93c5fd" : "#1e40af";
          });
        }, 100);
      })
      .catch((error: Error) => {
        console.error("Translation error:", error);
        const isDark = isYouTubeDarkMode();
        loadingDiv.innerHTML = `
          <div style="color: ${
            isDark ? "#f87171" : "#dc2626"
          }; text-align: center;">
            <p style="font-weight: 600; margin-bottom: 8px;">⚠️ Error</p>
            <p style="font-size: 14px;">${error.message}</p>
            <p style="font-size: 12px; color: ${
              isDark ? "#9ca3af" : "#6b7280"
            }; margin-top: 8px;">
              ${
                !error.message.includes("API key")
                  ? ""
                  : "Go to extension settings to add your Gemini API key"
              }
            </p>
          </div>
        `;
      })
      .finally(() => {
        isLoadingTranslation = false;
      });
  }
}

// Initialize text selection handler for translation
export function initializeTranscriptSelection(): void {
  // This function will be called from the main content.ts
  // It sets up event listeners for text selection within the transcript
  console.log("Initializing transcript selection for translation");

  document.addEventListener("mouseup", (e) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2 || selectedText.length > 200) {
      return; // Ignore very short or very long selections
    }

    // Check if the selection is within the transcript container
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const transcriptContainer = document.getElementById("transcript-container");

    if (!transcriptContainer) {
      return;
    }

    // Check if the selection is within the transcript
    if (
      !transcriptContainer.contains(container) &&
      container !== transcriptContainer
    ) {
      return;
    }

    // Get mouse position
    const x = e.clientX;
    const y = e.clientY;

    // Show translation popup
    showTranslationPopup(selectedText, x, y);
  });
}
