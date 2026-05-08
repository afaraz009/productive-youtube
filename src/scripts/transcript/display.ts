import { getSettings } from "../settings";
import {
  formatTimestamp,
  decodeHtmlEntities,
  cleanTranscriptText,
} from "./utils";

function getVideoTitle(): string {
  // Try multiple selectors to get the video title
  const titleSelectors = [
    "h1.ytd-watch-metadata yt-formatted-string",
    "h1.ytd-video-primary-info-renderer",
    "h1.title.ytd-video-primary-info-renderer",
    "ytd-watch-metadata h1",
    "h1 yt-formatted-string",
  ];

  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent) {
      return titleElement.textContent.trim();
    }
  }

  // Fallback: try to get from document title
  const docTitle = document.title;
  if (docTitle && docTitle !== "YouTube") {
    // Remove " - YouTube" suffix if present
    return docTitle.replace(/ - YouTube$/, "").trim();
  }

  return "Video Title Not Found";
}

export function displayTranscript(
  transcript: { text: string; start: number }[],
): void {
  console.log(
    "Productive YouTube: displayTranscript function called with",
    transcript.length,
    "entries",
  );

  // Check if we're on a watch page
  if (!window.location.pathname.includes("/watch")) {
    console.log(
      "Productive YouTube: Not on watch page, skipping transcript display",
    );
    return;
  }

  // Place the transcript inside YouTube's #secondary sidebar, above the suggestions.
  let transcriptWrapper = document.getElementById(
    "transcript-fixed-wrapper",
  ) as HTMLElement | null;

  if (!transcriptWrapper) {
    transcriptWrapper = document.createElement("div");
    transcriptWrapper.id = "transcript-fixed-wrapper";
    // REMOVED: overflow-y: auto from here to prevent double scrollbars
    transcriptWrapper.style.cssText = `
      width: 100% !important;
      z-index: 2000 !important;
      pointer-events: auto !important;
      overflow: visible !important; 
    `;

    const secondaryInner =
      document.querySelector("#secondary-inner") ||
      document.querySelector("#secondary");
    if (secondaryInner) {
      secondaryInner.insertBefore(transcriptWrapper, secondaryInner.firstChild);
    } else {
      transcriptWrapper.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 24px !important;
        width: 402px !important;
        z-index: 2000 !important;
        pointer-events: auto !important;
        overflow: visible !important;
      `;
      document.body.appendChild(transcriptWrapper);
    }
  }

  const secondary = transcriptWrapper;

  if (!secondary) {
    console.error(
      "Productive YouTube: Could not find any suitable container for transcript - giving up",
    );
    return;
  }

  // Group transcript entries
  const CHUNK_SIZE = 25; // seconds
  const chunkedTranscript: {
    start: number;
    lines: { text: string; start: number; duration: number }[];
  }[] = [];
  let currentChunk: {
    start: number;
    lines: { text: string; start: number; duration: number }[];
  } | null = null;

  transcript.forEach((line, index) => {
    let decodedText = decodeHtmlEntities(line.text);
    decodedText = cleanTranscriptText(decodedText);
    if (!decodedText) return;

    const chunkStart = Math.floor(line.start / CHUNK_SIZE) * CHUNK_SIZE;
    const nextStart =
      index < transcript.length - 1
        ? transcript[index + 1].start
        : line.start + 2;
    const lineDuration = nextStart - line.start;

    const lineData = {
      text: decodedText,
      start: line.start,
      duration: lineDuration,
    };

    if (!currentChunk || currentChunk.start !== chunkStart) {
      if (currentChunk) {
        chunkedTranscript.push(currentChunk);
      }
      currentChunk = {
        start: chunkStart,
        lines: [lineData],
      };
    } else {
      currentChunk.lines.push(lineData);
    }
  });

  if (currentChunk) {
    chunkedTranscript.push(currentChunk);
  }

  let container = document.getElementById("transcript-container");
  if (container) {
    container.innerHTML = "";
  } else {
    container = document.createElement("div");
    container.id = "transcript-container";
    container.className = "transcript-container";
    const initialDark = isDarkMode();
    const initialBorder = initialDark
      ? "rgba(60, 60, 60, 0.6)"
      : "rgba(229, 231, 235, 0.8)";
    const initialShadow = initialDark
      ? "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)"
      : "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08)";
    const initialBg = initialDark
      ? "rgba(0, 0, 0, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
    container.style.cssText = `
      background: ${initialBg} !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 1px solid ${initialBorder} !important;
      border-radius: 12px !important;
      margin-bottom: 1.5rem !important;
      margin-top: 1.5rem !important;
      box-shadow: ${initialShadow} !important;
      width: 100% !important;
      max-width: 400px !important;
      z-index: 1000 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
    `;
    secondary.prepend(container);
  }

  const header = createTranscriptHeader();
  container.appendChild(header);

  const content = createTranscriptContent();
  container.appendChild(content);

  const transcriptScrollState = {
    isUserScrolling: false,
    ignoreProgrammaticScroll: false,
  };

  const { syncButton } = setupHeaderButtons(
    header,
    chunkedTranscript,
    content,
    transcriptScrollState,
  );

  setupHeaderToggle(header, content);
  renderTranscriptChunks(chunkedTranscript, content);
  applyDarkModeStyles(isDarkMode(), container, header, content);
  setupDarkModeObserver(container, header, content);
  setupVideoTimeTracking(content, transcriptScrollState, syncButton);
}

function createTranscriptHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "transcript-header";
  const isDark = isDarkMode();
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid ${isDark ? "rgba(60, 60, 60, 0.6)" : "rgba(229, 231, 235, 0.6)"};
    cursor: pointer;
    background: ${isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(249, 250, 251, 0.8)"};
    gap: 0.5rem;
  `;

  const title = document.createElement("div");
  title.className = "transcript-title";
  title.textContent = "📖 Video Transcript";
  title.style.cssText = `
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    letter-spacing: -0.01em;
  `;
  header.appendChild(title);

  const arrowSpan = document.createElement("span");
  arrowSpan.className = "transcript-arrow";
  arrowSpan.style.cssText = `
    margin-left: 0.5rem;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `;
  arrowSpan.textContent = "▲";
  title.appendChild(arrowSpan);

  const headerButtons = document.createElement("div");
  headerButtons.className = "transcript-header-buttons";
  headerButtons.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  `;
  header.appendChild(headerButtons);

  return header;
}

function createTranscriptContent(): HTMLElement {
  const settings = getSettings();
  const isFullHeight = settings.removeWatchPageSuggestions;
  const maxHeight = isFullHeight ? "calc(100vh - 180px)" : "24rem";

  const content = document.createElement("div");
  content.className = "transcript-content";
  content.style.cssText = `
    max-height: ${maxHeight};
    overflow-y: auto;
    padding: 1.5rem;
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    scrollbar-width: thin;
    scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
  `;

  return content;
}

function setupHeaderButtons(
  header: HTMLElement,
  chunkedTranscript: any[],
  content: HTMLElement,
  transcriptScrollState: {
    isUserScrolling: boolean;
    ignoreProgrammaticScroll: boolean;
  },
): { copyButton: HTMLElement; syncButton: HTMLElement } {
  const headerButtons = header.querySelector(
    ".transcript-header-buttons",
  ) as HTMLElement;

  const copyButton = createCopyButton(chunkedTranscript);
  const syncButton = createSyncButton(content, transcriptScrollState);
  const translateButton = createTranslateButton(chunkedTranscript);
  const summaryButton = createSummaryButton(chunkedTranscript);
  const vocabularyButton = createVocabularyButton(chunkedTranscript);

  headerButtons.appendChild(copyButton);
  headerButtons.appendChild(syncButton);
  headerButtons.appendChild(translateButton);
  headerButtons.appendChild(summaryButton);
  headerButtons.appendChild(vocabularyButton);

  return { copyButton, syncButton };
}

function createCopyButton(chunkedTranscript: any[]): HTMLElement {
  const copyButton = document.createElement("button");
  copyButton.className = "transcript-copy-button";
  copyButton.title = "Copy transcript to clipboard";

  const copyIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  copyIconSvg.setAttribute("width", "20");
  copyIconSvg.setAttribute("height", "20");
  copyIconSvg.setAttribute("viewBox", "0 0 24 24");
  copyIconSvg.setAttribute("fill", "none");
  copyIconSvg.setAttribute("stroke", "currentColor");
  copyIconSvg.setAttribute("stroke-width", "2");
  copyIconSvg.setAttribute("stroke-linecap", "round");
  copyIconSvg.setAttribute("stroke-linejoin", "round");
  copyIconSvg.innerHTML = `
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  `;
  copyButton.appendChild(copyIconSvg);

  copyButton.style.cssText = `
    background: transparent;
    color: #3b82f6;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  copyButton.onclick = (e) => {
    e.stopPropagation();
    const videoTitle = getVideoTitle();
    const videoUrl = window.location.href.split("&")[0];
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    const completeText = `${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;
    navigator.clipboard.writeText(completeText);

    copyButton.style.color = "#10b981";
    setTimeout(() => {
      copyButton.style.color = "#3b82f6";
    }, 2000);
  };

  return copyButton;
}

function createSyncButton(
  content: HTMLElement,
  transcriptScrollState: {
    isUserScrolling: boolean;
    ignoreProgrammaticScroll: boolean;
  },
): HTMLElement {
  const syncButton = document.createElement("button");
  syncButton.className = "transcript-sync-button";
  syncButton.title = "Auto-scroll is ON. Click to sync.";

  const syncIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  syncIconSvg.setAttribute("width", "20");
  syncIconSvg.setAttribute("height", "20");
  syncIconSvg.setAttribute("viewBox", "0 0 24 24");
  syncIconSvg.setAttribute("fill", "none");
  syncIconSvg.setAttribute("stroke", "currentColor");
  syncIconSvg.setAttribute("stroke-width", "2");
  syncIconSvg.setAttribute("stroke-linecap", "round");
  syncIconSvg.setAttribute("stroke-linejoin", "round");
  syncIconSvg.innerHTML = `
    <path d="M1 4v6h6"></path>
    <path d="M23 20v-6h-6"></path>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  `;
  syncButton.appendChild(syncIconSvg);

  syncButton.style.cssText = `
    background: transparent;
    color: #10b981;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  syncButton.onclick = (e) => {
    e.stopPropagation();
    transcriptScrollState.isUserScrolling = false;
    syncButton.style.color = "#10b981";
    syncButton.title = "Auto-scroll is ON. Click to sync.";
    syncButton.style.background = "transparent";

    const video = document.querySelector("video");
    if (video) {
      const activeSegment = content.querySelector(".transcript-segment.active") as HTMLElement;
      if (activeSegment) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const scrollPosition = relativeTop - content.clientHeight / 2;

        transcriptScrollState.ignoreProgrammaticScroll = true;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
        window.requestAnimationFrame(() => {
          transcriptScrollState.ignoreProgrammaticScroll = false;
        });
      }
    }
  };

  return syncButton;
}

function createTranslateButton(chunkedTranscript: any[]): HTMLElement {
  const translateButton = document.createElement("button");
  translateButton.className = "transcript-translate-button";
  translateButton.title = "Translate in AI";

  const translateIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  translateIconSvg.setAttribute("width", "20");
  translateIconSvg.setAttribute("height", "20");
  translateIconSvg.setAttribute("viewBox", "0 0 24 24");
  translateIconSvg.setAttribute("fill", "none");
  translateIconSvg.setAttribute("stroke", "currentColor");
  translateIconSvg.setAttribute("stroke-width", "2");
  translateIconSvg.innerHTML = `
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  `;
  translateButton.appendChild(translateIconSvg);

  translateButton.style.cssText = `
    background: transparent; color: #8b5cf6; padding: 0.5rem; border-radius: 6px;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; transition: all 0.3s ease;
  `;

  translateButton.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const videoTitle = getVideoTitle();
    const videoUrl = window.location.href.split("&")[0];
    const transcriptText = chunkedTranscript
      .map((chunk) => `[${formatTimestamp(chunk.start)}] ${chunk.lines.map((l: any) => l.text).join(" ")}`)
      .join("\n\n");

    const completeText = `${settings.aiPrompts.translate}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    chrome.runtime.sendMessage({
      type: "OPEN_AI_SERVICE",
      aiService: settings.aiService,
      content: completeText,
    });
  };

  return translateButton;
}

function createSummaryButton(chunkedTranscript: any[]): HTMLElement {
  const summaryButton = document.createElement("button");
  summaryButton.className = "transcript-summary-button";
  summaryButton.title = "Summarize in AI";

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "20"); icon.setAttribute("height", "20");
  icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "2");
  icon.innerHTML = `<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>`;
  summaryButton.appendChild(icon);

  summaryButton.style.cssText = `
    background: transparent; color: #f59e0b; padding: 0.5rem; border-radius: 6px;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; transition: all 0.3s ease;
  `;

  summaryButton.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const videoTitle = getVideoTitle();
    const videoUrl = window.location.href.split("&")[0];
    const transcriptText = chunkedTranscript
      .map((chunk) => `[${formatTimestamp(chunk.start)}] ${chunk.lines.map((l: any) => l.text).join(" ")}`)
      .join("\n\n");

    const completeText = `${settings.aiPrompts.summarize}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    chrome.runtime.sendMessage({
      type: "OPEN_AI_SERVICE",
      aiService: settings.aiService,
      content: completeText,
    });
  };

  return summaryButton;
}

function createVocabularyButton(chunkedTranscript: any[]): HTMLElement {
  const vocabularyButton = document.createElement("button");
  vocabularyButton.className = "transcript-vocabulary-button";
  vocabularyButton.title = "Vocabulary Table in AI";

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "20"); icon.setAttribute("height", "20");
  icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "2");
  icon.innerHTML = `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="10" y1="8" x2="16" y2="8"></line><line x1="10" y1="12" x2="16" y2="12"></line><line x1="10" y1="16" x2="14" y2="16"></line>`;
  vocabularyButton.appendChild(icon);

  vocabularyButton.style.cssText = `
    background: transparent; color: #ec4899; padding: 0.5rem; border-radius: 6px;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; transition: all 0.3s ease;
  `;

  vocabularyButton.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const videoTitle = getVideoTitle();
    const videoUrl = window.location.href.split("&")[0];
    const transcriptText = chunkedTranscript
      .map((chunk) => `[${formatTimestamp(chunk.start)}] ${chunk.lines.map((l: any) => l.text).join(" ")}`)
      .join("\n\n");

    const completeText = `${settings.aiPrompts.vocabulary}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    chrome.runtime.sendMessage({
      type: "OPEN_AI_SERVICE",
      aiService: settings.aiService,
      content: completeText,
    });
  };

  return vocabularyButton;
}

function setupHeaderToggle(header: HTMLElement, content: HTMLElement): void {
  header.onclick = () => {
    content.style.display = content.style.display === "none" ? "block" : "none";
    const arrow = header.querySelector(".transcript-arrow");
    if (arrow) {
      arrow.textContent = content.style.display === "none" ? "▼" : "▲";
    }
  };
}

function renderTranscriptChunks(
  chunkedTranscript: any[],
  content: HTMLElement,
): void {
  chunkedTranscript.forEach((chunk) => {
    const chunkHeader = createChunkHeader(chunk);
    content.appendChild(chunkHeader);

    const chunkParagraph = createChunkParagraph(chunk);
    content.appendChild(chunkParagraph);
  });
}

function createChunkHeader(chunk: any): HTMLElement {
  const chunkHeader = document.createElement("div");
  chunkHeader.className = "transcript-chunk-header";
  chunkHeader.style.cssText = `
    color: #2563eb; font-weight: 700; cursor: pointer; font-size: 14px;
    font-family: monospace; margin-bottom: 0.125rem; margin-top: 0.125rem;
    padding: 0.25rem 0.75rem; border-radius: 6px; border-left: 3px solid #2563eb;
    display: inline-block; transition: all 0.2s ease;
  `;
  chunkHeader.textContent = formatTimestamp(chunk.start);
  chunkHeader.onclick = () => {
    const video = document.querySelector("video");
    if (video) video.currentTime = chunk.start;
  };
  return chunkHeader;
}

function createChunkParagraph(chunk: any): HTMLElement {
  const paragraphEl = document.createElement("div");
  paragraphEl.className = "transcript-chunk-paragraph";
  const isCurrentlyDarkMode = isDarkMode();
  const textColor = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";

  paragraphEl.style.cssText = `
    margin-bottom: 0.1rem; padding: 0.75rem 1rem; border-radius: 0.5rem;
    line-height: 1.8em; font-size: 15px; color: ${textColor}; text-align: justify;
  `;

  chunk.lines.forEach((lineData: any, index: number) => {
    const span = document.createElement("span");
    span.className = "transcript-segment";
    span.dataset.start = lineData.start.toString();
    span.dataset.duration = lineData.duration.toString();
    span.textContent = lineData.text;
    span.style.cssText = `color: ${textColor}; transition: all 0.2s ease; cursor: pointer;`;
    span.onclick = () => {
      const video = document.querySelector("video");
      if (video) video.currentTime = lineData.start;
    };
    paragraphEl.appendChild(span);
    if (index < chunk.lines.length - 1) paragraphEl.appendChild(document.createTextNode(" "));
  });

  return paragraphEl;
}

function isDarkMode(): boolean {
  const html = document.querySelector("html");
  if (html?.hasAttribute("dark")) return true;
  if (document.documentElement.classList.contains("dark")) return true;
  const bodyBg = document.body.style.backgroundColor;
  if (bodyBg === "rgb(19, 19, 19)" || bodyBg === "#131313") return true;
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyDarkModeStyles(
  isDark: boolean,
  container: HTMLElement,
  header: HTMLElement,
  content: HTMLElement,
): void {
  const settings = getSettings();
  const maxHeight = settings.removeWatchPageSuggestions ? "calc(100vh - 180px)" : "24rem";

  if (isDark) {
    container.style.background = "rgba(0, 0, 0, 0.95)";
    container.style.border = "1px solid rgba(60, 60, 60, 0.6)";
    header.style.background = "rgba(30, 30, 30, 0.8)";
    header.style.borderBottom = "1px solid rgba(60, 60, 60, 0.6)";
    (header.querySelector(".transcript-title") as HTMLElement).style.color = "#e5e7eb";
  } else {
    container.style.background = "rgba(255, 255, 255, 0.95)";
    container.style.border = "1px solid rgba(229, 231, 235, 0.8)";
    header.style.background = "rgba(249, 250, 251, 0.8)";
    header.style.borderBottom = "1px solid rgba(229, 231, 235, 0.6)";
    (header.querySelector(".transcript-title") as HTMLElement).style.color = "#1f2937";
  }
  content.style.maxHeight = maxHeight;
}

function setupDarkModeObserver(container: HTMLElement, header: HTMLElement, content: HTMLElement): void {
  const observer = new MutationObserver(() => {
    const isDark = isDarkMode();
    applyDarkModeStyles(isDark, container, header, content);
    const textColor = isDark ? "#e5e7eb" : "#1f2937";
    content.querySelectorAll(".transcript-chunk-paragraph, .transcript-segment:not(.active)").forEach((el) => {
      (el as HTMLElement).style.color = textColor;
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  observer.observe(document.body, { attributes: true });
}

function setupVideoTimeTracking(
  content: HTMLElement,
  transcriptScrollState: {
    isUserScrolling: boolean;
    ignoreProgrammaticScroll: boolean;
  },
  syncButton: HTMLElement,
): void {
  const markUserScroll = () => {
    if (transcriptScrollState.isUserScrolling) return; // Already true
    
    transcriptScrollState.isUserScrolling = true;
    
    // VISUAL FEEDBACK: Highlight the sync button so user knows how to resume
    syncButton.style.color = "#f59e0b"; // Orange/Amber
    syncButton.style.background = "rgba(245, 158, 11, 0.1)";
    syncButton.title = "Auto-scroll PAUSED. Click to resume.";
    console.log("Productive YouTube: Auto-scroll paused due to manual interaction.");
  };

  content.addEventListener("wheel", markUserScroll, { passive: true });
  content.addEventListener("touchstart", markUserScroll, { passive: true });
  content.addEventListener("mousedown", markUserScroll, { passive: true });
  
  content.addEventListener("scroll", () => {
    if (!transcriptScrollState.ignoreProgrammaticScroll) {
      markUserScroll();
    }
  }, { passive: true });

  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", () => {
      const currentTime = video.currentTime;
      const segments = content.querySelectorAll(".transcript-segment");
      const isCurrentlyDarkMode = isDarkMode();

      let activeSegment: HTMLElement | null = null;

      segments.forEach((segment) => {
        const segmentEl = segment as HTMLElement;
        const start = parseFloat(segmentEl.dataset.start || "0");
        const duration = parseFloat(segmentEl.dataset.duration || "2");
        const end = start + duration;

        if (currentTime >= start && currentTime < end) {
          segmentEl.classList.add("active");
          activeSegment = segmentEl;
          segmentEl.style.backgroundColor = isCurrentlyDarkMode ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.25)";
          segmentEl.style.color = isCurrentlyDarkMode ? "#93c5fd" : "#1e40af";
          segmentEl.style.fontWeight = "600";
          segmentEl.style.padding = "0.125rem 0.25rem";
          segmentEl.style.borderRadius = "0.25rem";
        } else {
          segmentEl.classList.remove("active");
          segmentEl.style.backgroundColor = "transparent";
          segmentEl.style.color = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";
          segmentEl.style.fontWeight = "normal";
          segmentEl.style.padding = "0";
        }
      });

      // ONLY SCROLL IF USER HASN'T MANUALLY SCROLLED
      if (activeSegment && !transcriptScrollState.isUserScrolling) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const containerHeight = content.clientHeight;
        const scrollPosition = relativeTop - containerHeight / 2;

        transcriptScrollState.ignoreProgrammaticScroll = true;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
        window.requestAnimationFrame(() => {
          transcriptScrollState.ignoreProgrammaticScroll = false;
        });
      }
    });
  }
}
