import { getSettings } from "../../core/settings";
import {
  formatTimestamp,
  decodeHtmlEntities,
  cleanTranscriptText,
} from "./utils";

function getVideoTitle(): string {
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

  const docTitle = document.title;
  if (docTitle && docTitle !== "YouTube") {
    return docTitle.replace(/ - YouTube$/, "").trim();
  }

  return "Video Title Not Found";
}

export function displayTranscript(
  transcript: { text: string; start: number }[],
): void {
  if (!window.location.pathname.includes("/watch")) return;

  let transcriptWrapper = document.getElementById("transcript-fixed-wrapper");

  if (!transcriptWrapper) {
    transcriptWrapper = document.createElement("div");
    transcriptWrapper.id = "transcript-fixed-wrapper";
    // STABILITY: Remove all overflow/max-height from outer wrapper
    transcriptWrapper.style.cssText = `
      width: 100% !important;
      z-index: 2000 !important;
      pointer-events: auto !important;
      overflow: visible !important;
      height: auto !important;
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
  if (!secondary) return;

  const CHUNK_SIZE = 25;
  const chunkedTranscript: {
    start: number;
    lines: { text: string; start: number; duration: number }[];
  }[] = [];
  let currentChunk: any = null;

  transcript.forEach((line, index) => {
    let decodedText = decodeHtmlEntities(line.text);
    decodedText = cleanTranscriptText(decodedText);
    if (!decodedText) return;

    const chunkStart = Math.floor(line.start / CHUNK_SIZE) * CHUNK_SIZE;
    const nextStart = index < transcript.length - 1 ? transcript[index + 1].start : line.start + 2;
    const lineDuration = nextStart - line.start;

    const lineData = { text: decodedText, start: line.start, duration: lineDuration };

    if (!currentChunk || currentChunk.start !== chunkStart) {
      if (currentChunk) chunkedTranscript.push(currentChunk);
      currentChunk = { start: chunkStart, lines: [lineData] };
    } else {
      currentChunk.lines.push(lineData);
    }
  });

  if (currentChunk) chunkedTranscript.push(currentChunk);

  let container = document.getElementById("transcript-container");
  if (container) {
    container.innerHTML = "";
  } else {
    container = document.createElement("div");
    container.id = "transcript-container";
    container.className = "transcript-container";
    // STABILITY: No overflow on container
    container.style.cssText = `
      border-radius: 12px !important;
      margin-bottom: 1.5rem !important;
      margin-top: 1.5rem !important;
      width: 100% !important;
      max-width: 400px !important;
      z-index: 1000 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
      height: auto !important;
    `;
    secondary.prepend(container);
  }

  const header = createTranscriptHeader();
  container.appendChild(header);

  const content = createTranscriptContent();
  container.appendChild(content);

  const transcriptScrollState = { isUserScrolling: false, ignoreProgrammaticScroll: false };
  const { syncButton } = setupHeaderButtons(header, chunkedTranscript, content, transcriptScrollState);

  setupHeaderToggle(header, content);
  renderTranscriptChunks(chunkedTranscript, content);
  applyDarkModeStyles(isDarkMode(), container, header, content);
  setupDarkModeObserver(container, header, content);
  setupVideoTimeTracking(content, transcriptScrollState, syncButton);
}

function createTranscriptHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "transcript-header";
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    cursor: pointer;
    gap: 0.5rem;
    flex-shrink: 0;
  `;

  const title = document.createElement("div");
  title.className = "transcript-title";
  title.innerHTML = `📖 Video Transcript <span class="transcript-arrow" style="margin-left: 0.5rem; color: #9ca3af;">▲</span>`;
  title.style.cssText = `
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
  `;
  header.appendChild(title);

  const headerButtons = document.createElement("div");
  headerButtons.className = "transcript-header-buttons";
  headerButtons.style.cssText = `display: flex; align-items: center; gap: 0.5rem;`;
  header.appendChild(headerButtons);

  return header;
}

function createTranscriptContent(): HTMLElement {
  const settings = getSettings();
  const isFullHeight = settings.removeWatchPageSuggestions;
  // This is the ONLY element that should have overflow-y: auto
  const maxHeight = isFullHeight ? "calc(100vh - 200px)" : "24rem";

  const content = document.createElement("div");
  content.className = "transcript-content";
  content.style.cssText = `
    max-height: ${maxHeight} !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 1rem;
    background-color: transparent !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(155, 155, 155, 0.4) transparent;
  `;

  return content;
}

function setupHeaderButtons(header: HTMLElement, chunkedTranscript: any[], content: HTMLElement, state: any) {
  const hb = header.querySelector(".transcript-header-buttons") as HTMLElement;
  const copy = createCopyButton(chunkedTranscript);
  const sync = createSyncButton(content, state);
  const trans = createTranslateButton(chunkedTranscript);
  const sum = createSummaryButton(chunkedTranscript);
  const vocab = createVocabularyButton(chunkedTranscript);

  [copy, sync, trans, sum, vocab].forEach(b => hb.appendChild(b));
  return { copyButton: copy, syncButton: sync };
}

function createCopyButton(chunked: any[]): HTMLElement {
  const b = document.createElement("button");
  b.title = "Copy Transcript";
  b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
  b.style.cssText = `background:transparent; color:#3b82f6; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center; transition:0.2s;`;
  
  b.onclick = (e) => {
    e.stopPropagation();
    const title = document.title.replace(/ - YouTube$/, "");
    const url = window.location.href.split("&")[0];
    const text = chunked.map(c => `[${formatTimestamp(c.start)}] ${c.lines.map((l:any)=>l.text).join(" ")}`).join("\n\n");
    navigator.clipboard.writeText(`${title}\n${url}\n\n${text}`);
    b.style.color = "#10b981";
    setTimeout(() => b.style.color = "#3b82f6", 2000);
  };
  return b;
}

function createSyncButton(content: HTMLElement, state: any): HTMLElement {
  const b = document.createElement("button");
  b.title = "Auto-scroll ON";
  b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"></path><path d="M23 20v-6h-6"></path><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>`;
  b.style.cssText = `background:transparent; color:#10b981; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center; transition:0.2s;`;
  
  b.onclick = (e) => {
    e.stopPropagation();
    state.isUserScrolling = false;
    b.style.color = "#10b981";
    b.style.background = "transparent";
    const active = content.querySelector(".transcript-segment.active") as HTMLElement;
    if (active) {
      content.scrollTo({ top: active.offsetTop - content.clientHeight / 2, behavior: "smooth" });
    }
  };
  return b;
}

function createTranslateButton(chunked: any[]) {
  const b = document.createElement("button");
  b.title = "Translate";
  b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
  b.style.cssText = `background:transparent; color:#8b5cf6; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center;`;
  b.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const title = document.title;
    const text = chunked.map(c => `[${formatTimestamp(c.start)}] ${c.lines.map((l:any)=>l.text).join(" ")}`).join("\n\n");
    chrome.runtime.sendMessage({ type:"OPEN_AI_SERVICE", aiService:settings.aiService, content:`${settings.aiPrompts.translate}\n\n${title}\n\n${text}` });
  };
  return b;
}

function createSummaryButton(chunked: any[]) {
  const b = document.createElement("button");
  b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
  b.style.cssText = `background:transparent; color:#f59e0b; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center;`;
  b.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const text = chunked.map(c => `[${formatTimestamp(c.start)}] ${c.lines.map((l:any)=>l.text).join(" ")}`).join("\n\n");
    chrome.runtime.sendMessage({ type:"OPEN_AI_SERVICE", aiService:settings.aiService, content:`${settings.aiPrompts.summarize}\n\n${document.title}\n\n${text}` });
  };
  return b;
}

function createVocabularyButton(chunked: any[]) {
  const b = document.createElement("button");
  b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
  b.style.cssText = `background:transparent; color:#ec4899; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center;`;
  b.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const text = chunked.map(c => `[${formatTimestamp(c.start)}] ${c.lines.map((l:any)=>l.text).join(" ")}`).join("\n\n");
    chrome.runtime.sendMessage({ type:"OPEN_AI_SERVICE", aiService:settings.aiService, content:`${settings.aiPrompts.vocabulary}\n\n${document.title}\n\n${text}` });
  };
  return b;
}

function setupHeaderToggle(header: HTMLElement, content: HTMLElement): void {
  header.onclick = () => {
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    const arrow = header.querySelector(".transcript-arrow");
    if (arrow) arrow.textContent = isHidden ? "▲" : "▼";
  };
}

function renderTranscriptChunks(chunked: any[], content: HTMLElement): void {
  chunked.forEach((chunk) => {
    const h = document.createElement("div");
    h.textContent = formatTimestamp(chunk.start);
    h.style.cssText = `color:#2563eb; font-weight:700; cursor:pointer; font-size:13px; font-family:monospace; margin:0.5rem 0 0.2rem 0; border-left:3px solid #2563eb; padding-left:0.5rem;`;
    h.onclick = () => { const v = document.querySelector("video"); if(v) v.currentTime = chunk.start; };
    content.appendChild(h);

    const p = document.createElement("div");
    p.style.cssText = `margin-bottom:0.8rem; line-height:1.6; font-size:14px; text-align:justify;`;
    chunk.lines.forEach((l: any, i: number) => {
      const s = document.createElement("span");
      s.className = "transcript-segment";
      s.dataset.start = l.start.toString();
      s.dataset.duration = l.duration.toString();
      s.textContent = l.text;
      s.style.cssText = `cursor:pointer; transition:0.2s;`;
      s.onclick = () => { const v = document.querySelector("video"); if(v) v.currentTime = l.start; };
      p.appendChild(s);
      if (i < chunk.lines.length - 1) p.appendChild(document.createTextNode(" "));
    });
    content.appendChild(p);
  });
}

function isDarkMode(): boolean {
  const html = document.querySelector("html");
  if (html?.hasAttribute("dark")) return true;
  if (document.documentElement.classList.contains("dark")) return true;
  const bodyBg = document.body.style.backgroundColor;
  return bodyBg === "rgb(19, 19, 19)" || bodyBg === "#131313" || !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyDarkModeStyles(isDark: boolean, container: HTMLElement, header: HTMLElement, content: HTMLElement): void {
  const settings = getSettings();
  const isFullHeight = settings.removeWatchPageSuggestions;
  const maxHeight = isFullHeight ? "calc(100vh - 200px)" : "24rem";

  if (isDark) {
    container.style.background = "rgba(15, 15, 15, 0.98)";
    container.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    container.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
    header.style.background = "rgba(30, 30, 30, 0.5)";
    header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
    (header.querySelector(".transcript-title") as HTMLElement).style.color = "#f3f4f6";
  } else {
    container.style.background = "rgba(255, 255, 255, 0.98)";
    container.style.border = "1px solid rgba(0, 0, 0, 0.1)";
    container.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
    header.style.background = "rgba(249, 250, 251, 0.8)";
    header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.05)";
    (header.querySelector(".transcript-title") as HTMLElement).style.color = "#111827";
  }
  content.style.maxHeight = maxHeight;
  
  const textColor = isDark ? "#e5e7eb" : "#374151";
  content.querySelectorAll(".transcript-segment:not(.active)").forEach(s => (s as HTMLElement).style.color = textColor);
}

function setupDarkModeObserver(container: HTMLElement, header: HTMLElement, content: HTMLElement): void {
  const obs = new MutationObserver(() => applyDarkModeStyles(isDarkMode(), container, header, content));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "dark"] });
}

function setupVideoTimeTracking(content: HTMLElement, state: any, sync: HTMLElement): void {
  const mark = () => {
    if (state.isUserScrolling) return;
    state.isUserScrolling = true;
    sync.style.color = "#f59e0b";
    sync.style.background = "rgba(245, 158, 11, 0.05)";
    sync.title = "Auto-scroll PAUSED. Click to resume.";
  };

  ["wheel", "touchstart", "mousedown"].forEach(e => content.addEventListener(e, mark, { passive: true }));
  content.addEventListener("scroll", () => { if (!state.ignoreProgrammaticScroll) mark(); }, { passive: true });

  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", () => {
      const time = video.currentTime;
      const segments = content.querySelectorAll(".transcript-segment");
      const isDark = isDarkMode();
      let active: HTMLElement | null = null;

      segments.forEach((s) => {
        const el = s as HTMLElement;
        const start = parseFloat(el.dataset.start || "0");
        const end = start + parseFloat(el.dataset.duration || "2");

        if (time >= start && time < end) {
          el.classList.add("active");
          active = el;
          el.style.backgroundColor = isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.15)";
          el.style.color = isDark ? "#60a5fa" : "#2563eb";
          el.style.fontWeight = "600";
          el.style.borderRadius = "4px";
          el.style.padding = "0 2px";
        } else {
          el.classList.remove("active");
          el.style.backgroundColor = "transparent";
          el.style.color = isDark ? "#e5e7eb" : "#374151";
          el.style.fontWeight = "normal";
          el.style.padding = "0";
        }
      });

      if (active && !state.isUserScrolling) {
        state.ignoreProgrammaticScroll = true;
        content.scrollTo({ top: active.offsetTop - content.clientHeight / 2, behavior: "smooth" });
        setTimeout(() => state.ignoreProgrammaticScroll = false, 100);
      }
    });
  }
}
