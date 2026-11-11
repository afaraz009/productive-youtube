// Save-note UI for the transcript panel.
// Place at: src/scripts/transcript/notes-ui.ts (next to your transcript display file)

import { addNote, formatTime } from "../notes";

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const BOOKMARK_PATH = `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>`;
const CHECK_PATH = `<polyline points="20 6 9 17 4 12"></polyline>`;

export interface NoteDraft {
  timestamp: number;
  text: string;
}

function isDark(): boolean {
  const html = document.querySelector("html");
  if (html?.hasAttribute("dark")) return true;
  if (document.documentElement.classList.contains("dark")) return true;
  if (html?.hasAttribute("light")) return false;
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function getVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v");
}

function makeSvg(size: number, inner: string): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = inner;
  return svg;
}

/** Briefly swap a button's icon to a checkmark after a successful save. */
function flashSaved(button: HTMLElement, color: string): void {
  const svg = button.querySelector("svg");
  if (!svg) return;
  svg.innerHTML = CHECK_PATH;
  button.style.color = "#10b981";
  window.setTimeout(() => {
    svg.innerHTML = BOOKMARK_PATH;
    button.style.color = color;
  }, 1500);
}

/**
 * Pick what a note should attach to:
 *  1. text the user selected inside the transcript,
 *  2. otherwise the line currently being spoken,
 *  3. otherwise just the current video time.
 */
function pickDraft(content: HTMLElement): NoteDraft {
  const video = document.querySelector("video");
  const sel = window.getSelection();

  if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (content.contains(range.startContainer)) {
      const text = sel.toString().replace(/\s+/g, " ").trim();
      const startEl =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement;
      const segment = startEl?.closest<HTMLElement>(".transcript-segment");
      if (text) {
        return {
          text,
          timestamp: segment
            ? parseFloat(segment.dataset.start || "0")
            : (video?.currentTime ?? 0),
        };
      }
    }
  }

  const active = content.querySelector<HTMLElement>(".transcript-segment.active");
  if (active) {
    return {
      text: active.textContent?.trim() ?? "",
      timestamp: parseFloat(active.dataset.start || "0"),
    };
  }

  return { text: "", timestamp: video?.currentTime ?? 0 };
}

/**
 * Opens the small "add your own thought" form under the transcript header.
 * `content` is the .transcript-content element; its parent is the container.
 */
export function openNoteComposer(
  content: HTMLElement,
  draft: NoteDraft,
  getTitle: () => string,
  onSaved?: () => void,
): void {
  const container = content.parentElement;
  const videoId = getVideoId();
  if (!container || !videoId) return;

  container.querySelector(".transcript-note-composer")?.remove();

  const dark = isDark();
  const fg = dark ? "#e5e7eb" : "#1f2937";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const bg = dark ? "rgba(20, 20, 20, 0.95)" : "rgba(240, 249, 250, 0.95)";
  const border = dark ? "rgba(60, 60, 60, 0.6)" : "rgba(229, 231, 235, 0.8)";
  const inputBg = dark ? "#121212" : "#ffffff";

  const composer = document.createElement("div");
  composer.className = "transcript-note-composer";
  composer.style.cssText = `
    padding: 0.75rem 1rem;
    border-bottom: 1px solid ${border};
    background: ${bg};
    font-family: ${FONT};
    color: ${fg};
  `;

  // YouTube listens for single-key shortcuts (space, k, f, m, ...) on the document.
  // Stop key events here so typing a note doesn't pause or seek the video.
  ["keydown", "keypress", "keyup"].forEach((type) =>
    composer.addEventListener(type, (e) => e.stopPropagation()),
  );

  const heading = document.createElement("div");
  heading.textContent = `Save note at ${formatTime(draft.timestamp)}`;
  heading.style.cssText = `font-size: 12px; font-weight: 700; color: #086972; margin-bottom: 0.5rem;`;
  composer.appendChild(heading);

  if (draft.text) {
    const quote = document.createElement("div");
    quote.textContent = draft.text;
    quote.style.cssText = `
      font-size: 13px;
      line-height: 1.5;
      color: ${muted};
      border-left: 3px solid #086972;
      padding-left: 0.6rem;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `;
    composer.appendChild(quote);
  }

  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.placeholder = "Your own thought, in your own words (optional, but this is what you'll remember)";
  textarea.style.cssText = `
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    font-size: 13px;
    line-height: 1.5;
    padding: 0.5rem 0.6rem;
    border: 1px solid ${border};
    border-radius: 8px;
    background: ${inputBg};
    color: ${fg};
    font-family: ${FONT};
    outline: none;
  `;
  composer.appendChild(textarea);

  const status = document.createElement("div");
  status.style.cssText = `font-size: 11px; color: #dc2626; min-height: 0; margin-top: 0.25rem;`;
  composer.appendChild(status);

  const actions = document.createElement("div");
  actions.style.cssText = `display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;`;

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding: 0.35rem 0.8rem; font-size: 12px; font-weight: 600; cursor: pointer;
    border: 1px solid ${border}; border-radius: 6px; background: transparent; color: ${fg};
    font-family: ${FONT};
  `;

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save note";
  saveBtn.style.cssText = `
    padding: 0.35rem 0.8rem; font-size: 12px; font-weight: 600; cursor: pointer;
    border: none; border-radius: 6px; background: #086972; color: #ffffff;
    font-family: ${FONT};
  `;

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  composer.appendChild(actions);

  const close = () => composer.remove();

  const save = async () => {
    const comment = textarea.value.trim();
    if (!draft.text && !comment) {
      status.textContent = "Add a thought before saving.";
      return;
    }
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.6";
    try {
      await addNote({
        videoId,
        videoTitle: getTitle(),
        timestamp: draft.timestamp,
        text: draft.text,
        comment,
      });
      close();
      onSaved?.();
    } catch (err) {
      console.error("Productive YouTube: failed to save note", err);
      status.textContent = "Couldn't save the note. Storage may be full.";
      saveBtn.disabled = false;
      saveBtn.style.opacity = "1";
    }
  };

  cancelBtn.onclick = (e) => {
    e.stopPropagation();
    close();
  };
  saveBtn.onclick = (e) => {
    e.stopPropagation();
    void save();
  };
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void save();
    }
  });

  const header = container.querySelector(".transcript-header");
  if (header) header.after(composer);
  else container.prepend(composer);

  textarea.focus();
}

/** Header button: saves the selected text, or the line currently being spoken. */
export function createSaveNoteButton(
  content: HTMLElement,
  getTitle: () => string,
): HTMLElement {
  const color = "#086972";
  const button = document.createElement("button");
  button.className = "transcript-save-note-button";
  button.title = "Save a note (uses selected text, or the current line)";
  button.appendChild(makeSvg(20, BOOKMARK_PATH));
  button.style.cssText = `
    background: transparent;
    color: ${color};
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
  `;

  button.onmouseover = () => {
    button.style.background = "rgba(8, 105, 114, 0.12)";
    button.style.transform = "scale(1.1)";
  };
  button.onmouseout = () => {
    button.style.background = "transparent";
    button.style.transform = "scale(1)";
  };

  // Keep the user's text selection when the button is pressed.
  button.onmousedown = (e) => e.preventDefault();

  button.onclick = (e) => {
    e.stopPropagation();
    openNoteComposer(content, pickDraft(content), getTitle, () =>
      flashSaved(button, color),
    );
  };

  return button;
}

/** Small bookmark shown next to each chunk timestamp (visible on row hover). */
export function createChunkBookmark(
  chunk: { start: number; lines: { text: string }[] },
  content: HTMLElement,
  getTitle: () => string,
): HTMLElement {
  const color = "#086972";
  const button = document.createElement("button");
  button.className = "transcript-chunk-bookmark";
  button.title = "Save a note on this section";
  button.appendChild(makeSvg(14, BOOKMARK_PATH));
  button.style.cssText = `
    background: transparent;
    color: ${color};
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 0.15s ease;
  `;

  button.onclick = (e) => {
    e.stopPropagation();
    const text = chunk.lines
      .map((l) => l.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    openNoteComposer(content, { timestamp: chunk.start, text }, getTitle, () => {
      button.style.opacity = "1";
      flashSaved(button, color);
    });
  };

  return button;
}