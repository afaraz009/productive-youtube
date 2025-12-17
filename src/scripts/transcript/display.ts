import { settings } from "../settings";
import { formatTimestamp, decodeHtmlEntities, cleanTranscriptText } from "./utils";

function getVideoTitle(): string {
  // Try multiple selectors to get the video title
  const titleSelectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.ytd-video-primary-info-renderer',
    'h1.title.ytd-video-primary-info-renderer',
    'ytd-watch-metadata h1',
    'h1 yt-formatted-string'
  ];

  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent) {
      return titleElement.textContent.trim();
    }
  }

  // Fallback: try to get from document title
  const docTitle = document.title;
  if (docTitle && docTitle !== 'YouTube') {
    // Remove " - YouTube" suffix if present
    return docTitle.replace(/ - YouTube$/, '').trim();
  }

  return 'Video Title Not Found';
}

export function displayTranscript(transcript: { text: string; start: number }[]): void {
  console.log(
    "Productive YouTube: displayTranscript function called with",
    transcript.length,
    "entries"
  );

  // Try to find the secondary container
  let secondary = document.querySelector("#secondary");

  if (!secondary) {
    console.log(
      "Productive YouTube: #secondary not found, trying alternatives..."
    );
    secondary = document.querySelector(
      "ytd-watch-next-secondary-results-renderer"
    );
  }
  if (!secondary) {
    console.log(
      "Productive YouTube: ytd-watch-next-secondary-results-renderer not found, trying #secondary-inner..."
    );
    secondary = document.querySelector("#secondary-inner");
  }
  if (!secondary) {
    console.log(
      "Productive YouTube: #secondary-inner not found, trying #related..."
    );
    secondary = document.querySelector("#related");
  }
  if (!secondary) {
    console.log(
      "Productive YouTube: No sidebar found, creating fixed position container..."
    );
    // Create a fixed position wrapper
    const fixedWrapper = document.createElement("div");
    fixedWrapper.id = "transcript-fixed-wrapper";
    fixedWrapper.style.cssText = `
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      width: 400px !important;
      max-height: calc(100vh - 150px) !important;
      overflow-y: auto !important;
      z-index: 9999 !important;
    `;
    document.body.appendChild(fixedWrapper);
    secondary = fixedWrapper;
    console.log("Productive YouTube: Created fixed position wrapper");
  }

  if (!secondary) {
    console.error(
      "Productive YouTube: Could not find any suitable container for transcript - giving up"
    );
    return;
  }

  console.log(
    "Productive YouTube: Using container:",
    secondary.tagName || secondary.id || "unknown"
  );

  // Group transcript entries into 25-second chunks with individual lines
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
    // Decode HTML entities and clean the text
    let decodedText = decodeHtmlEntities(line.text);
    decodedText = cleanTranscriptText(decodedText);

    // Skip if text is empty after cleaning
    if (!decodedText) return;

    const chunkStart = Math.floor(line.start / CHUNK_SIZE) * CHUNK_SIZE; // Round down to nearest chunk

    // Calculate duration for this line
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
      // Start a new chunk
      if (currentChunk) {
        chunkedTranscript.push(currentChunk);
      }
      currentChunk = {
        start: chunkStart,
        lines: [lineData],
      };
    } else {
      // Add to current chunk
      currentChunk.lines.push(lineData);
    }
  });

  // Don't forget the last chunk
  if (currentChunk) {
    chunkedTranscript.push(currentChunk);
  }

  let container = document.getElementById("transcript-container");
  if (container) {
    console.log("Productive YouTube: Reusing existing transcript container");
    container.innerHTML = "";
  } else {
    console.log("Productive YouTube: Creating new transcript container");
    container = document.createElement("div");
    container.id = "transcript-container";
    container.className = "transcript-container";
    // Add inline styles with !important flags to ensure visibility
    container.style.cssText = `
      background: transparent !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 3px solid #fff !important;

      border-radius: 12px !important;
      margin-bottom: 1.5rem !important;
      margin-top: 1.5rem !important;
      box-shadow: rgba(255, 255, 255, 0.9) 0px 6px 12px -2px,
            rgba(255, 255, 255, 0.6) 0px 3px 7px -3px !important;


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
    console.log(
      "Productive YouTube: Transcript container created and inserted into DOM"
    );
  }

  const header = createTranscriptHeader();
  container.appendChild(header);

  const content = createTranscriptContent();
  container.appendChild(content);

  const { copyButton, syncButton } = setupHeaderButtons(header, chunkedTranscript, content);

  setupHeaderToggle(header, content);

  renderTranscriptChunks(chunkedTranscript, content);

  applyDarkModeStyles(isDarkMode(), container, header, content);
  setupDarkModeObserver(container, header, content);
  setupVideoTimeTracking(content);
}

function createTranscriptHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "transcript-header";
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 3px solid rgba(229, 231, 235, 0.6);
    cursor: pointer;
    background: linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%);
    gap: 1rem;
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
  `;

  return content;
}

function setupHeaderButtons(
  header: HTMLElement,
  chunkedTranscript: any[],
  content: HTMLElement
): { copyButton: HTMLElement; syncButton: HTMLElement } {
  const headerButtons = header.querySelector(".transcript-header-buttons") as HTMLElement;

  const copyButton = createCopyButton(chunkedTranscript);
  const syncButton = createSyncButton(content);

  headerButtons.appendChild(copyButton);
  headerButtons.appendChild(syncButton);

  return { copyButton, syncButton };
}

function createCopyButton(chunkedTranscript: any[]): HTMLElement {
  const copyButton = document.createElement("button");
  copyButton.className = "transcript-copy-button";
  copyButton.title = "Copy transcript to clipboard";

  const copyIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    color: #3b82f6;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  copyButton.onmouseover = () => {
    copyButton.style.color = "#2563eb";
    copyButton.style.transform = "scale(1.1)";
  };
  copyButton.onmouseout = () => {
    copyButton.style.color = "#3b82f6";
    copyButton.style.transform = "scale(1)";
  };

  copyButton.onclick = (e) => {
    e.stopPropagation();

    // Get video title
    const videoTitle = getVideoTitle();

    // Get video URL
    const videoUrl = window.location.href.split('&')[0]; // Remove extra params

    // Build transcript text
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    // Format the complete text with title, URL, and transcript
    const completeText = `${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    navigator.clipboard.writeText(completeText);

    copyButton.style.color = "#10b981";
    const svg = copyButton.querySelector("svg");
    if (svg) {
      svg.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;
    }
    setTimeout(() => {
      if (svg) {
        svg.innerHTML = `
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        `;
      }
      copyButton.style.color = "#3b82f6";
    }, 2000);
  };

  return copyButton;
}

function createSyncButton(content: HTMLElement): HTMLElement {
  const syncButton = document.createElement("button");
  syncButton.className = "transcript-sync-button";
  syncButton.title = "Scroll to current timestamp";

  const syncIconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  syncButton.onmouseover = () => {
    syncButton.style.background = "rgba(16, 185, 129, 0.1)";
    syncButton.style.color = "#059669";
    syncButton.style.transform = "scale(1.1)";
  };
  syncButton.onmouseout = () => {
    syncButton.style.background = "transparent";
    syncButton.style.color = "#10b981";
    syncButton.style.transform = "scale(1)";
  };

  syncButton.onclick = (e) => {
    e.stopPropagation();
    const video = document.querySelector("video");
    if (video) {
      const currentTime = video.currentTime;
      const activeSegment = content.querySelector(".transcript-segment.active") as HTMLElement;
      if (activeSegment) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const containerHeight = content.clientHeight;
        const scrollPosition = relativeTop - containerHeight / 2;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
      } else {
        const segments = content.querySelectorAll(".transcript-segment");
        let closestSegment: HTMLElement | null = null;
        let minDiff = Infinity;

        segments.forEach((segment) => {
          const segmentEl = segment as HTMLElement;
          const start = parseFloat(segmentEl.dataset.start || "0");
          const diff = Math.abs(currentTime - start);
          if (diff < minDiff) {
            minDiff = diff;
            closestSegment = segmentEl;
          }
        });

        if (closestSegment) {
          const segmentTop = closestSegment.getBoundingClientRect().top;
          const contentTop = content.getBoundingClientRect().top;
          const relativeTop = segmentTop - contentTop + content.scrollTop;
          const containerHeight = content.clientHeight;
          const scrollPosition = relativeTop - containerHeight / 2;
          content.scrollTo({ top: scrollPosition, behavior: "smooth" });
        }
      }
    }
  };

  return syncButton;
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

function renderTranscriptChunks(chunkedTranscript: any[], content: HTMLElement): void {
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
    color: #2563eb;
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.4em;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    margin-bottom: 0.75rem;
    margin-top: 1.25rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border-left: 3px solid #2563eb;
    display: inline-block;
    transition: all 0.2s ease;
  `;

  chunkHeader.onmouseover = function () {
    (this as HTMLElement).style.transform = "translateX(4px)";
  };
  chunkHeader.onmouseout = function () {
    (this as HTMLElement).style.transform = "translateX(0)";
  };

  chunkHeader.textContent = formatTimestamp(chunk.start);
  chunkHeader.onclick = () => {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = chunk.start;
    }
  };

  return chunkHeader;
}

function createChunkParagraph(chunk: any): HTMLElement {
  const paragraphEl = document.createElement("div");
  paragraphEl.className = "transcript-chunk-paragraph";

  const isCurrentlyDarkMode = isDarkMode();
  const textColor = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";

  paragraphEl.style.cssText = `
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    line-height: 1.8em;
    font-size: 15px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: ${textColor};
    text-align: justify;
    transition: all 0.3s ease;
  `;

  // Create spans for each line in the chunk
  chunk.lines.forEach((lineData: any, index: number) => {
    const span = document.createElement("span");
    span.className = "transcript-segment";
    span.dataset.start = lineData.start.toString();
    span.dataset.duration = lineData.duration.toString();
    span.textContent = lineData.text;
    span.style.cssText = `
      color: ${textColor};
      transition: all 0.2s ease;
      cursor: pointer;
    `;

    span.onclick = () => {
      const video = document.querySelector("video");
      if (video) {
        video.currentTime = lineData.start;
      }
    };

    paragraphEl.appendChild(span);

    // Add space between segments (but not after the last one)
    if (index < chunk.lines.length - 1) {
      paragraphEl.appendChild(document.createTextNode(" "));
    }
  });

  return paragraphEl;
}

function createTranscriptLine(lineData: any): HTMLElement {
  const lineEl = document.createElement("div");
  lineEl.className = "transcript-line";
  lineEl.dataset.start = lineData.start.toString();
  lineEl.dataset.duration = lineData.duration.toString();
  lineEl.style.cssText = `
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    line-height: 1.6em;
  `;

  lineEl.onmouseover = function () {
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      document.querySelector("html")?.getAttribute("dark") !== null ||
      document.body.style.backgroundColor === "rgb(19, 19, 19)" ||
      document.body.style.backgroundColor === "#131313";

    if (!lineEl.classList.contains("active")) {
      lineEl.style.backgroundColor = isDarkMode
        ? "rgba(55, 65, 81, 0.5)"
        : "rgba(243, 244, 246, 0.8)";
    }
  };
  lineEl.onmouseout = function () {
    if (!lineEl.classList.contains("active")) {
      lineEl.style.backgroundColor = "transparent";
    }
  };

  const textEl = document.createElement("span");
  textEl.className = "transcript-text";
  textEl.textContent = lineData.text;
  textEl.style.cssText = `
    color: #1f2937;
    font-size: 15px;
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: color 0.3s ease;
    cursor: pointer;
    letter-spacing: 0.01em;
    user-select: text;
    display: block;
    word-wrap: break-word;
  `;

  lineEl.appendChild(textEl);
  return lineEl;
}

function isDarkMode(): boolean {
  return (
    document.documentElement.classList.contains("dark") ||
    document.querySelector("html")?.getAttribute("dark") !== null ||
    document.body.style.backgroundColor === "rgb(19, 19, 19)" ||
    document.body.style.backgroundColor === "#131313"
  );
}

function applyDarkModeStyles(
  isDark: boolean,
  container: HTMLElement,
  header: HTMLElement,
  content: HTMLElement
): void {
  const isFullHeight = settings.removeWatchPageSuggestions;
  const maxHeight = isFullHeight ? "calc(100vh - 180px)" : "24rem";

  if (isDark) {
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(60, 60, 60, 0.6);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    `;
    content.style.maxHeight = maxHeight;
  } else {
    container.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    `;
    content.style.maxHeight = maxHeight;
  }
}

function setupDarkModeObserver(
  container: HTMLElement,
  header: HTMLElement,
  content: HTMLElement
): void {
  const observer = new MutationObserver(() => {
    const currentDarkMode = isDarkMode();
    applyDarkModeStyles(currentDarkMode, container, header, content);

    // Update paragraph and segment colors
    const textColor = currentDarkMode ? "#e5e7eb" : "#1f2937";
    const paragraphs = content.querySelectorAll(".transcript-chunk-paragraph");
    paragraphs.forEach((p) => {
      const paragraphEl = p as HTMLElement;
      paragraphEl.style.color = textColor;
    });

    const segments = content.querySelectorAll(".transcript-segment");
    segments.forEach((s) => {
      const segmentEl = s as HTMLElement;
      if (!segmentEl.classList.contains("active")) {
        segmentEl.style.color = textColor;
      }
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  observer.observe(document.body, { attributes: true });
}

function setupVideoTimeTracking(content: HTMLElement): void {
  let isUserScrolling = false;
  let scrollTimeout: number;

  content.addEventListener("scroll", () => {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      isUserScrolling = false;
    }, 3000);
  });

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

          // Highlight the active segment
          segmentEl.style.cssText = `
            background-color: ${
              isCurrentlyDarkMode
                ? "rgba(59, 130, 246, 0.4)"
                : "rgba(59, 130, 246, 0.25)"
            };
            color: ${isCurrentlyDarkMode ? "#93c5fd" : "#1e40af"};
            font-weight: 600;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            transition: all 0.2s ease;
            cursor: pointer;
          `;
        } else {
          segmentEl.classList.remove("active");
          const inactiveTextColor = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";
          segmentEl.style.cssText = `
            color: ${inactiveTextColor};
            transition: all 0.2s ease;
            cursor: pointer;
          `;
        }
      });

      // Auto-scroll to active segment
      if (activeSegment && !isUserScrolling) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const containerHeight = content.clientHeight;
        const scrollPosition = relativeTop - containerHeight / 2;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
      }
    });
  }
}
