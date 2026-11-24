// Transcript highlights: select text → click "Highlight" → it's marked, saved,
// and marked again the next time the transcript panel is built.
//
// FLOW
//   SETUP    setupSelectionHighlight: creates the tooltip, shows it on mouseup
//   SAVE     click "Highlight" → saveHighlight: Range → plain data → drawHighlight → addHighlight (Supabase)
//   RESTORE  retrieveSelectionHighlight: getHighlights (Supabase) → plain data → Range → drawHighlight
//   DELETE   hover a highlight → "Delete" → removeHighlight (Supabase) → eraseHighlight
//
// SAVED DATA  see highlightStorage.ts (what's saved, how it maps to the Supabase row,
//             and the get/add/remove functions)
//
// Each <mark> gets data-highlight-id = the highlight's id, so all marks of one
// highlight can be found again (see eraseHighlight).

import { getVideoId } from "./utils";
import { getHighlights, addHighlight, removeHighlight } from "./highlightStorage";
import type { Point, SavedHighlight } from "../types";

const LINE_SELECTOR = ".transcript-segment"; // one <span> per caption line
const TOOLTIP_ID = "transcript-tooltip";
const DELETE_BTN_ID="highlight-delete-btn";
const TEXT_PREFIX_LENGTH = 40;

// Lets us remove the previous panel's listeners before adding new ones
let listeners: AbortController | undefined;

// true once the user has selected something new since their last mousedown.
// Stops the tooltip from popping up again when you just click on old selected text.
let selectionChanged = false;

// The delete button hides a moment AFTER the mouse leaves, so you can cross the
// small gap between the highlight and the button. Entering either one cancels it.
let deleteBtnHideTimer: number | undefined;

// ─── SETUP: display.ts calls this every time the panel is built ──────────────

export function setupSelectionHighlight(content: HTMLElement): void {
  listeners?.abort();
  listeners = new AbortController();
  const options = { signal: listeners.signal };

  const tooltip = createTooltip();

  // show the tooltip above a new selection inside the transcript
  content.addEventListener("mouseup", () => {
    const selection = window.getSelection();

    // nothing selected || nothing new selected → nothing to show
    if (!selection || selection.isCollapsed || !selection.toString().trim() || !selectionChanged) {
      hideTooltip();
      return;
    }

    // the selection must be inside the transcript
    const range = selection.getRangeAt(0);
    if (!content.contains(range.commonAncestorContainer)) {
      hideTooltip();
      return;
    }

    // place it 40px above the middle of the selection
    const rect = range.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 40}px`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.display = "block";
  }, options);
  
  const deleteBtn=createDeleteBtn();
  content.addEventListener("mouseover",(e:MouseEvent)=>{
    //Don’t show it while the user is selecting text (e.buttons !== 0) or while the Highlight tooltip is showing
    if(e.buttons !== 0 || tooltip.style.display === "block"){
      return;
    }
    //find the hovered mark
    const mark = e.target instanceof Element
      ? e.target.closest<HTMLElement>("mark.pyt-highlight")
      : null;
    if(!mark){
      return;
    }
    clearTimeout(deleteBtnHideTimer); // back on a highlight → don't hide
    const id=mark.dataset.highlightId;
    deleteBtn.dataset.highlightId = id;
    const rect = mark.getBoundingClientRect();
    deleteBtn.style.top = `${rect.top - 30}px`;
    deleteBtn.style.left = `${rect.left + rect.width / 2}px`;
    deleteBtn.style.display = "block";
  }, options)

  // hide the delete button when the mouse leaves a highlight…
  content.addEventListener("mouseout", (e: MouseEvent) => {
    // relatedTarget = the element the mouse is moving onto (the element the mouse entered)
    const nextElement = e.relatedTarget;

    // …unless it's moving onto another highlight or onto the button itself
    // (otherwise the button disappears before you can reach it)
    if (
      (nextElement instanceof Element && nextElement.closest("mark.pyt-highlight")) ||
      (nextElement instanceof Node && deleteBtn.contains(nextElement))
    ) {
      return;
    }

    hideDeleteBtnSoon();
  }, options);

  // hide it when clicking anywhere or scrolling
  document.addEventListener("selectionchange", () => (selectionChanged = true), options);
  document.addEventListener("mousedown", hideTooltip, options);
  document.addEventListener("scroll", hideTooltip, options);
  content.addEventListener("scroll", hideTooltip, options);

  // hide the delete button on scroll too: it's position:fixed, so it would stay put
  // while the highlight scrolls away. Hide it right away, no 300ms wait.
  const hideDeleteBtnNow = () => {
    clearTimeout(deleteBtnHideTimer); // a countdown may be running → it's not needed now
    deleteBtn.style.display = "none";
  };
  document.addEventListener("scroll", hideDeleteBtnNow, options); // the YouTube page scrolls
  content.addEventListener("scroll", hideDeleteBtnNow, options);  // the transcript list scrolls
}

function createTooltip(): HTMLElement {
  const existing = document.getElementById(TOOLTIP_ID);
  if (existing) return existing;

  const tooltip = document.createElement("div");
  tooltip.id = TOOLTIP_ID;
  // translateX(-50%) centers it on the `left` we set on mouseup
  tooltip.style.cssText = "position: fixed; display: none; z-index: 9999; transform: translateX(-50%);";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Highlight";
  tooltip.appendChild(button);

  // mousedown (not click) so we can preventDefault: that keeps the text selected
  tooltip.addEventListener("mousedown", (e) => {
    e.preventDefault();
    hideTooltip();
    saveHighlight();
  });

  document.body.appendChild(tooltip);
  return tooltip;
}



function createDeleteBtn(): HTMLElement {
  const existing = document.getElementById(DELETE_BTN_ID);
  if (existing) return existing;
  const deleteBtn=document.createElement("button");
  deleteBtn.id = DELETE_BTN_ID;
  deleteBtn.type="button";
  deleteBtn.textContent="Delete";
  deleteBtn.style.cssText="position:fixed; display:none; z-index:9999; transform:translateX(-50%);";

  // mouse reached the button → cancel the hide that leaving the highlight started
  deleteBtn.addEventListener("mouseenter", () => clearTimeout(deleteBtnHideTimer));

  // hide it when the mouse leaves the button
  // (moving back onto the highlight cancels this through the mouseover listener)
  deleteBtn.addEventListener("mouseleave", hideDeleteBtnSoon);

  // clicking it deletes the highlight it was shown for
  deleteBtn.addEventListener("click", async () => {
    // the mouseover listener put the hovered highlight's id here
    const id = deleteBtn.dataset.highlightId;
    if (!id) return; // no highlight id (e.g. an old highlight saved before ids existed)

    // remove it from Supabase, then from the screen
    try {
      await removeHighlight(id);
      eraseHighlight(id);
      clearTimeout(deleteBtnHideTimer);
      deleteBtn.style.display = "none";
    } catch (err) {
      console.warn("[highlight] could not delete:", err);
    }
  });

  document.body.appendChild(deleteBtn);
  return deleteBtn;
}

// hide the delete button in 300ms, unless the mouse enters the button or a highlight first
function hideDeleteBtnSoon(): void {
  clearTimeout(deleteBtnHideTimer);
  deleteBtnHideTimer = window.setTimeout(() => {
    const deleteBtn = document.getElementById(DELETE_BTN_ID);
    if (deleteBtn) deleteBtn.style.display = "none";
  }, 300);
}

function hideTooltip(): void {
  const tooltip = document.getElementById(TOOLTIP_ID);
  if (tooltip) tooltip.style.display = "none";
  selectionChanged = false;
}

// ─── SAVE: runs when "Highlight" is clicked ──────────────────────────────────

async function saveHighlight(): Promise<void> {
  const videoId = getVideoId();
  const selection = window.getSelection();
  if (!videoId || !selection || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);

  // 1. Range → plain data. Do this BEFORE drawing: drawing splits the text nodes.
  const start = toPoint(range.startContainer, range.startOffset);
  const end = toPoint(range.endContainer, range.endOffset);
  if (!start || !end) return; // starts or ends outside a caption line
  // ": SavedHighlight" -> this object must have exactly the shape of a SavedHighlight
  const highlight: SavedHighlight = {
    id: crypto.randomUUID(),
    start,
    end,
    text: clean(range.toString()).slice(0, TEXT_PREFIX_LENGTH),
  };

  // what mala's notes table needs on top of the highlight:
  // endTime = when the last line ends = its data-start (end.key) + its data-duration
  const endNode = range.endContainer;
  const endLine = (endNode instanceof Element ? endNode : endNode.parentElement)
    ?.closest<HTMLElement>(LINE_SELECTOR);
  const endTime = Number(end.key) + Number(endLine?.dataset.duration ?? 0);
  // videoTitle = the title under the video ("" if YouTube hasn't shown it yet)
  const videoTitle = document.querySelector("ytd-watch-metadata h1")?.textContent?.trim() ?? "";

  // 2. show it
  drawHighlight(range, highlight.id);
  selection.removeAllRanges();

  // 3. save it. If saving fails, take it off the screen again.
  try {
    await addHighlight({ videoId, videoTitle, endTime, highlight });
  } catch (err) {
    console.warn("[highlight] could not save:", err);
    eraseHighlight(highlight.id);
  }
}

// ─── RESTORE: display.ts calls this every time the panel is built ────────────

export async function retrieveSelectionHighlight(content: HTMLElement): Promise<void> {
  const videoId = getVideoId();
  if (!videoId) return; // not on a video page

  // 1. read this video's saved highlights from Supabase
  // (fails when signed out or offline → no highlights to draw, the transcript still works)
  let highlights;
  try {
    highlights = await getHighlights(videoId);
  } catch (err) {
    console.warn("[highlight] could not load:", err);
    return;
  }

  // the panel may have been rebuilt while we waited for Supabase → this one is gone
  if (!content.isConnected) return;

  for (const highlight of highlights) {
    // 2. plain data → Range
    const start = fromPoint(content, highlight.start);
    const end = fromPoint(content, highlight.end);
    if (!start || !end) continue; // that caption line doesn't exist (any more)

    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    // 3. the words there must start with the saved words, otherwise the captions changed
    if (!clean(range.toString()).startsWith(clean(highlight.text))) continue;

    // 4. show it
    drawHighlight(range, highlight.id);
  }
}

// ─── ONE END OF A HIGHLIGHT: DOM position ⇄ saved { key, offset } ────────────
// A Range points at DOM nodes, which can't be saved (and are rebuilt on every
// refresh). So each end is saved as { key: line's data-start, offset: chars into line }.

// (node, offset) inside the panel → { key, offset } inside a caption line
// key -> starting/ending timestamps
function toPoint(node: Node, offset: number): Point | null {
  //take it if it is an Element otherwise (if #text node) take its parent cz only elements have closest()
  const element = node instanceof Element ? node : node.parentElement;
  const line = element?.closest<HTMLElement>(LINE_SELECTOR);
  // dataset.start -> data-start
  const key = line?.dataset.start;
  if (!line || !key) return null;

  // count the characters from the start of the line up to this point
  // (the line may already be split into several text nodes by older highlights)
  const before = document.createRange();
  before.setStart(line, 0);
  before.setEnd(node, offset);
  return { key, offset: before.toString().length };
}

// { key, offset } inside a caption line → (text node, offset) inside the panel
function fromPoint(content: HTMLElement, point: Point): { node: Text; offset: number } | null {
  const line = content.querySelector<HTMLElement>(`${LINE_SELECTOR}[data-start="${point.key}"]`);
  if (!line) return null;

  // walk the line's text nodes until we've counted `offset` characters
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let remaining = point.offset;
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (remaining <= node.length) return { node, offset: remaining };
    remaining -= node.length;
    node = walker.nextNode() as Text | null;
  }
  return null; // the line is shorter than the saved offset
}

// ─── ON SCREEN: putting <mark>s on and taking them off ───────────────────────

// Wraps every piece of text inside the range in its own <mark>.
// (One <mark> around everything would copy the line <span>s when a highlight
//  crosses lines, and the copies lose their click-to-seek.)
function drawHighlight(range: Range, id: string): void {
  // 1. find the text nodes the range touches
  const root = range.commonAncestorContainer;
  const textNodes: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) {
    textNodes.push(root as Text); // selection inside one text node
  } else {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (range.intersectsNode(node)) textNodes.push(node as Text);
      node = walker.nextNode();
    }
  }

  // 2. work out the selected part of each one BEFORE wrapping:
  //    wrapping changes the DOM, and the range moves with it
  const pieces = textNodes.map((node) => ({
    node,
    //Is this the starting node? Use the Range’s start offset. Otherwise, start at 0 of this text note because the highlight began in an earlier node.
    start: node === range.startContainer ? range.startOffset : 0,
    //Is this the ending node? Use the Range’s end offset. Otherwise, continue to the end of this node (node.length).
    end: node === range.endContainer ? range.endOffset : node.length,
  }));

  // 3. wrap each piece (a range inside one text node can always be wrapped)
  for (const { node, start, end } of pieces) {
    if (start >= end) continue; // nothing selected in this node

    const piece = document.createRange();
    piece.setStart(node, start);
    piece.setEnd(node, end);

    const mark = document.createElement("mark");
    mark.classList.add("pyt-highlight");
    mark.dataset.highlightId = id;
    piece.surroundContents(mark);
  }
}

// Takes a highlight off the screen: every <mark> with this id is replaced by its text.
function eraseHighlight(id: string): void {
  document.querySelectorAll(`mark[data-highlight-id="${id}"]`).forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize(); // join the split text back into one text node
  });
}

// Turns every run of spaces/newlines into one space and trims the ends,
// so spacing differences don't break the text check (used when saving AND restoring)
function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
