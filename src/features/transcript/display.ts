import { getSettings } from "../../core/settings";
import {
  formatTimestamp,
  decodeHtmlEntities,
  cleanTranscriptText,
} from "./utils";

// --- STATE MANAGEMENT ---
interface TranscriptState {
  originalData: { text: string; start: number; duration: number }[];
}

const state: TranscriptState = {
  originalData: [],
};

/**
 * Main Entry Point: Displays the transcript and restores original icons
 */
export function displayTranscript(
  transcript: { text: string; start: number }[],
): void {
  if (!window.location.pathname.includes("/watch")) return;

  // 1. Initialize State
  state.originalData = transcript.map((line, index) => {
    const nextStart = index < transcript.length - 1 ? transcript[index + 1].start : line.start + 2;
    return {
      text: cleanTranscriptText(decodeHtmlEntities(line.text)),
      start: line.start,
      duration: nextStart - line.start
    };
  });

  // 2. Ensure Wrappers exist
  let wrapper = document.getElementById("transcript-fixed-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "transcript-fixed-wrapper";
    wrapper.style.cssText = `width: 100% !important; z-index: 2000 !important; pointer-events: auto !important; height: auto !important;`;
    const side = document.querySelector("#secondary-inner") || document.querySelector("#secondary");
    if (side) side.insertBefore(wrapper, side.firstChild);
  }

  // 3. Setup Main Container
  let container = document.getElementById("transcript-container");
  if (container) {
    container.innerHTML = "";
  } else {
    container = document.createElement("div");
    container.id = "transcript-container";
    container.style.cssText = `border-radius: 12px !important; margin: 1rem 0 !important; width: 100% !important; display: block !important; overflow: hidden !important; border: 1px solid rgba(155,155,155,0.2) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;`;
    wrapper.appendChild(container);
  }

  // 4. Build UI
  renderUI(container);
}

function renderUI(container: HTMLElement) {
  const isDark = isDarkMode();
  const textColor = isDark ? "#f3f4f6" : "#111827";

  // HEADER (CLEAN ONE-ROW DESIGN)
  const header = document.createElement("div");
  header.className = "transcript-header";
  header.style.cssText = `padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; background: ${isDark ? "#1f1f1f" : "#f9f9f9"}; border-bottom: 1px solid rgba(155,155,155,0.1);`;
  
  const title = document.createElement("div");
  title.style.cssText = `font-weight:800; color:${textColor}; font-size:15px; display:flex; align-items:center; cursor:pointer;`;
  title.innerHTML = `📖 Transcript <span class="transcript-arrow" style="margin-left: 0.5rem; color: #9ca3af; font-size: 10px;">▲</span>`;
  header.appendChild(title);

  const buttons = document.createElement("div");
  buttons.className = "transcript-header-buttons";
  buttons.style.cssText = `display: flex; align-items: center; gap: 2px;`;
  
  // 1. Sync Button (Green)
  const transcriptScrollState = { isUserScrolling: false };
  const syncBtn = createIconBtn("Sync to Video", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"></path><path d="M23 20v-6h-6"></path><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>`, "#10b981");
  
  // 2. Copy Button (Blue)
  const copyBtn = createIconBtn("Copy", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`, "#3b82f6");
  copyBtn.onclick = (e) => {
    e.stopPropagation();
    const text = state.originalData.map((t) => `[${formatTimestamp(t.start)}] ${t.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    copyBtn.style.color = "#10b981";
    setTimeout(() => copyBtn.style.color = "#3b82f6", 2000);
  };

  // 3. AI Analysis (Purple Globe)
  const analyzeBtn = createIconBtn("AI Analysis", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`, "#8b5cf6");
  analyzeBtn.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const text = state.originalData.map(d => `[${formatTimestamp(d.start)}] ${d.text}`).join("\n\n");
    chrome.runtime.sendMessage({ type:"OPEN_AI_SERVICE", aiService:settings.aiService, content:`${settings.aiPrompts.translate}\n\n${text}` });
  };

  // 4. AI Summary (Orange Lines)
  const summaryBtn = createIconBtn("AI Summary", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>`, "#f59e0b");
  summaryBtn.onclick = (e) => {
    e.stopPropagation();
    const settings = getSettings();
    const text = state.originalData.map(d => `[${formatTimestamp(d.start)}] ${d.text}`).join("\n\n");
    chrome.runtime.sendMessage({ type:"OPEN_AI_SERVICE", aiService:settings.aiService, content:`${settings.aiPrompts.summarize}\n\n${text}` });
  };

  buttons.appendChild(syncBtn);
  buttons.appendChild(copyBtn);
  buttons.appendChild(analyzeBtn);
  buttons.appendChild(summaryBtn);
  header.appendChild(buttons);
  container.appendChild(header);

  // CONTENT
  const settings = getSettings();
  const maxHeight = settings.removeWatchPageSuggestions ? "calc(100vh - 200px)" : "350px";
  const content = document.createElement("div");
  content.className = "transcript-content";
  content.style.cssText = `max-height: ${maxHeight}; overflow-y: auto; overflow-x: hidden; padding: 1.25rem; background: ${isDark ? "#0f0f0f" : "#ffffff"}; scrollbar-width: thin; scrollbar-color: #6366f1 transparent;`;
  container.appendChild(content);

  // Sync Button Logic
  syncBtn.onclick = (e) => {
    e.stopPropagation();
    transcriptScrollState.isUserScrolling = false;
    const active = content.querySelector(".transcript-segment.active") as HTMLElement;
    if (active) content.scrollTo({ top: active.offsetTop - content.clientHeight / 2, behavior: "smooth" });
  };

  setupHeaderToggle(header, content);
  renderLines(content);
  applyDarkModeStyles(isDarkMode(), container, header, content);
  setupDarkModeObserver(container, header, content);
  setupVideoTimeTracking(content, transcriptScrollState);
}

function renderLines(content: HTMLElement) {
  const isDark = isDarkMode();
  const textColor = isDark ? "#e5e7eb" : "#374151";
  
  content.innerHTML = "";
  let currentChunk = -1;
  let activeP: HTMLElement | null = null;

  state.originalData.forEach((line, i) => {
    const chunk = Math.floor(line.start / 25);
    if (chunk !== currentChunk) {
      currentChunk = chunk;
      const h = document.createElement("div");
      h.textContent = formatTimestamp(line.start);
      h.style.cssText = `color: #6366f1; font-weight: 800; font-size: 11px; margin-top: 16px; border-left: 3px solid #6366f1; padding-left: 8px; cursor: pointer; opacity: 0.8;`;
      h.onclick = () => { const v = document.querySelector("video"); if(v) v.currentTime = line.start; };
      content.appendChild(h);

      activeP = document.createElement("div");
      activeP.style.cssText = `margin-top: 6px; line-height: 1.7; font-size: 14.5px; color: ${textColor}; text-align: justify;`;
      content.appendChild(activeP);
    }

    const s = document.createElement("span");
    s.className = "transcript-segment";
    s.dataset.start = line.start.toString();
    s.dataset.duration = line.duration.toString();
    s.textContent = line.text;
    s.style.cssText = `cursor: pointer; transition: 0.2s; border-radius: 3px;`;
    s.onclick = () => { const v = document.querySelector("video"); if(v) v.currentTime = line.start; };
    
    activeP?.appendChild(s);
    activeP?.appendChild(document.createTextNode(" "));
  });
}

// --- UTILS ---

function createIconBtn(title: string, svg: string, color: string) {
  const b = document.createElement("button");
  b.title = title; b.innerHTML = svg;
  b.style.cssText = `background:transparent; border:none; color:${color}; cursor:pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center; transition:0.2s; border-radius:8px;`;
  b.onmouseover = () => b.style.background = "rgba(155,155,155,0.1)";
  b.onmouseout = () => b.style.background = "transparent";
  return b;
}

function setupHeaderToggle(header: HTMLElement, content: HTMLElement): void {
  const title = header.firstChild as HTMLElement;
  title.onclick = () => {
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    const arrow = header.querySelector(".transcript-arrow");
    if (arrow) arrow.textContent = isHidden ? "▲" : "▼";
  };
}

function isDarkMode(): boolean {
  return document.documentElement.getAttribute("dark") !== null || window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDarkModeStyles(isDark: boolean, container: HTMLElement, header: HTMLElement, content: HTMLElement) {
  const textColor = isDark ? "#f3f4f6" : "#111827";
  container.style.background = isDark ? "#0f0f0f" : "#ffffff";
  header.style.background = isDark ? "#1a1a1a" : "#f9f9f9";
  const title = header.querySelector(".transcript-title");
  if (title) (title as HTMLElement).style.color = textColor;
  content.style.background = isDark ? "#0f0f0f" : "#ffffff";
  content.querySelectorAll(".transcript-segment").forEach(s => (s as HTMLElement).style.color = isDark ? "#e5e7eb" : "#374151");
}

function setupDarkModeObserver(container: HTMLElement, header: HTMLElement, content: HTMLElement) {
  new MutationObserver(() => applyDarkModeStyles(isDarkMode(), container, header, content)).observe(document.documentElement, { attributes: true, attributeFilter: ["dark"] });
}

function setupVideoTimeTracking(content: HTMLElement, stateScroll: any) {
  ["wheel", "touchstart", "mousedown"].forEach(e => content.addEventListener(e, () => stateScroll.isUserScrolling = true, { passive: true }));
  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", () => {
      const time = video.currentTime;
      const segments = content.querySelectorAll(".transcript-segment");
      let active: HTMLElement | null = null;
      segments.forEach((s) => {
        const el = s as HTMLElement;
        const start = parseFloat(el.dataset.start || "0");
        const end = start + parseFloat(el.dataset.duration || "2");
        if (time >= start && time < end) {
          el.classList.add("active"); active = el;
          el.style.backgroundColor = "rgba(99, 102, 241, 0.25)";
          el.style.color = isDarkMode() ? "#818cf8" : "#4f46e5";
          el.style.fontWeight = "700";
        } else {
          el.classList.remove("active"); el.style.backgroundColor = "transparent"; el.style.color = ""; el.style.fontWeight = "400";
        }
      });
      if (active && !stateScroll.isUserScrolling) {
        content.scrollTo({ top: (active as any).offsetTop - content.clientHeight / 2, behavior: "smooth" });
      }
    });
  }
}
