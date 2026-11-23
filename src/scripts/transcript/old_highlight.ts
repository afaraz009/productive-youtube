
import { getVideoId } from "./utils";

// Only the first N characters of a highlight's text are saved: enough to check on
// restore that we found the same words, without storing whole paragraphs.
const TEXT_PREFIX_LENGTH = 40;
let selectionHighlightListeners: AbortController | undefined;

export function setupSelectionHighlight(content: HTMLElement): void {
  selectionHighlightListeners?.abort();
  selectionHighlightListeners = new AbortController();
  const { signal } = selectionHighlightListeners;

  let tooltip = document.getElementById("transcript-tooltip");
  if (!tooltip) {
    tooltip = createTooltip();
    document.body.appendChild(tooltip);
    tooltip.addEventListener("mousedown", (e) => handleHighlightPress (e, tooltip!));

  }
  
  let selectionChanged = false;
  
  document.addEventListener("selectionchange", () => {
    selectionChanged = true;
  }, { signal });
  
  document.addEventListener("mousedown", () => {
      tooltip.style.display = "none";
      selectionChanged = false;
    }, { signal });
  document.addEventListener("scroll", () => {
      tooltip.style.display = "none";
      selectionChanged = false;
    }, { signal });
  content.addEventListener("scroll", () => {
      tooltip.style.display = "none";
      selectionChanged = false;
    }, { signal });

  content.addEventListener("mouseup", () => {
    //get highlighted text
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.toString().trim() || !selection.rangeCount || !selectionChanged) {
      tooltip.style.display = "none";
      return;
    }
    //get start and end coordinates
    const range = selection.getRangeAt(0);

    if (!content.contains(range.commonAncestorContainer)) {
      tooltip.style.display = "none";
      return;
    }
    // get coordinates of the bounding rectangle of the selection
    const rect = range.getBoundingClientRect();
    // place the tooltip above the selection
    tooltip.style.position = "fixed";
    tooltip.style.top = `${rect.top - 40}px`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.display = "block";
  }, { signal });

}

async function handleHighlightPress (e: MouseEvent, tooltip: HTMLElement): Promise<void> {
  e.preventDefault();

  const selection = window.getSelection();
  //range count -> count of highlighted segments
  if (!selection?.rangeCount) {
    tooltip.style.display = "none";
    return;
  }

  const range = selection.getRangeAt(0);
  // read both ends BEFORE the DOM changes (wrapping splits text nodes)
  const item = getDataToSaveHighlight(range);

  // show the highlight right away, then save it
  const marks = wrapRange(range);
  selection.removeAllRanges();
  tooltip.style.display = "none";

  // nothing to save if we can't tell the video or where the selection starts/ends
  if (!item.videoId || !item.start.key || !item.end.key) return;

  const key = `highlights_${item.videoId}`;
  try {
    //get all the highlights of this video
    const stored = await chrome.storage.local.get(key); //read
    //if there aren’t any yet, start with an empty list.
    const list = stored[key] ?? [];
    list.push(item); //update
    await chrome.storage.local.set({ [key]: list }); //store
    // console.log("list: ",list)
  } catch (err) {
    // e.g. storage quota exceeded, or "Extension context invalidated" after an
    // extension reload: the highlight wasn't saved, so don't leave it on screen
    console.warn("[highlight] could not save highlight:", err);
    unwrapMarks(marks);
  }
}


function createTooltip(): HTMLElement {
  const div = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Highlight";
  div.id="transcript-tooltip";
  div.appendChild(button);
  div.style.display = "none";
  return div;
}

type SavedHighlight = {
  videoId: string | null;
  start: { key: string | undefined; offset: number };
  end: { key: string | undefined; offset: number };
  text: string;
};

export function getDataToSaveHighlight(range: Range): SavedHighlight {
  const videoId = getVideoId();
  //the toSpanPosition gives key and offset of the closest ancestor span (.transcript-segment)
  //key -> starting/ending time of the highlight
  //offset -> position of starting/ending character inside that span's full text
  const item: SavedHighlight = {
    videoId,
    start: toSpanPosition(range.startContainer, range.startOffset),
    end: toSpanPosition(range.endContainer, range.endOffset),
    // cleaned the same way as on restore, then cut to a short prefix
    text: normalize(range.toString()).slice(0, TEXT_PREFIX_LENGTH), //slice(start, characters count from start)
  };

  return item;
}

// Turns one end of a live Range (node + offset) into storable data:
// which transcript span it is in, and how many characters into that span's text.
// Counting from the span's start (not the text node's start) keeps the offset right
// even after earlier highlights have split the span's text into several nodes.
function toSpanPosition(node: Node, offset: number): { key: string | undefined; offset: number } {
  // a text node → its parent element; an element (e.g. the span itself) → the element
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  //
  const span = el?.closest<HTMLElement>(".transcript-segment");
  if (!span) return { key: undefined, offset };

  // a temporary range from the very start of the span up to this point
  const before = document.createRange();
  before.setStart(span, 0);
  //node ->the node where the exact starting/ending position of the selection is located
  before.setEnd(node, offset);
  //before.toString().length -> number of characters from the start of the span to the exact position of the selection
  return { key: span.dataset.start, offset: before.toString().length };
}

// Runs every time the panel is (re)built: reads this video's saved highlights
// and wraps the same text again. It is toSpanPosition in reverse.
export async function retrieveSelectionHighlight(content: HTMLElement): Promise<void> {
  const videoId = getVideoId();
  if (!videoId) return;

  const key = `highlights_${videoId}`;
  const stored = await chrome.storage.local.get(key);
  //if nothing is saved fallback to empty list
  const highlights = (stored[key] ?? []) as SavedHighlight[];

  // the panel may have been rebuilt while we waited for storage → this one is gone
  // if the panel is not part of the DOM, return
  if (!content.isConnected) return;

  for (const item of highlights) {
    // we need Range to use the methods that are needed to recover the highlights
    const range = rangeFromSaved(content, item);
    if (!range) continue;

    // the words at those positions must match what was saved, otherwise the
    // transcript changed (e.g. different captions) and we'd mark the wrong text
    // only a prefix is saved, so check "starts with" (full texts saved earlier still pass)
    if (!normalize(range.toString()).startsWith(normalize(item.text))) continue;
    //its inside a loop so one by one wraps all the ranges with <mark>
    wrapRange(range);
  }
}

// Saved { key, offset } pair for both ends → a live Range in the current panel
function rangeFromSaved(content: HTMLElement, item: SavedHighlight): Range | null {
  if (!item.start.key || !item.end.key) return null;

  const startSpan = findSpan(content, item.start.key);
  const endSpan = findSpan(content, item.end.key);
  if (!startSpan || !endSpan) return null;
  //find point gives the point i,e. node, offset  that's needed to build the Range
  const start = findPoint(startSpan, item.start.offset);
  const end = findPoint(endSpan, item.end.offset);
  if (!start || !end) return null;

  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}
//find transcript-segment span containing the start/end of the highlight that is needed to build the range
function findSpan(content: HTMLElement, key: string): HTMLElement | null {
  return content.querySelector<HTMLElement>(`.transcript-segment[data-start="${CSS.escape(key)}"]`);
}

// "N characters into this span" → (text node, offset inside that text node).
// Walks the span's text nodes in order, subtracting each one's length.
function findPoint(span: HTMLElement, offset: number): { node: Text; offset: number } | null {
  //Tree walker is a cursor through which we can read the #text elements in order inside a container element
  // 1st argument -> starting node/ancestor of the tree 
  // 2nd argument -> type of nodes that the treewalker has to walk through (that we wanna get)
  const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode() as Text | null;

  while (node) {
    if (remaining <= node.length) return { node, offset: remaining };
    remaining -= node.length;
    node = walker.nextNode() as Text | null;
  }
  return null; // offset is past the end of the span's text
}

// Wrapping a single range in <mark>
// Its inside a loop. so one by one wraps all the ranges with <mark>
// Unlike extractContents(), this never copies spans, so each span keeps its
// click-to-seek handler and its data-start stays unique.
function wrapRange(range: Range): HTMLElement[] {
  // 1. collect the pieces first: wrapping changes the DOM, and the range moves with it
  const pieces: { node: Text; start: number; end: number }[] = [];
  //narrows down -> get the ancestor node that contains both the start and end nodes
  const root = range.commonAncestorContainer;

  const textNodes: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) { // found the highlighted #text node
    textNodes.push(root as Text);
  } else { // found an element 
    //Tree walker is a cursor through which we can read the #text elements in order inside a container
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    //.nextNode moves the walker to the next #text node
    let n = walker.nextNode();
    while (n) {
      //Only push those text nodes that are inside the highlight
      if (range.intersectsNode(n)) textNodes.push(n as Text);
      n = walker.nextNode();
    }
  }
  //go through all the text nodes that are part of the highlight (and then extract the start & end positions of them)
  for (const node of textNodes) {
    // if this is the starting node (startContainer) i,e. its text matches the starting node's text, start at the Range's start offset
    // otherwise, start at the beginning of the node.
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (start < end) pieces.push({ node, start, end });
  }

  // 2. wrap each piece (a range inside a single text node can always be surrounded)
  const marks: HTMLElement[] = [];
  for (const { node, start, end } of pieces) {
    const piece = document.createRange();
    piece.setStart(node, start);
    piece.setEnd(node, end);
    const mark = document.createElement("mark");
    mark.classList.add("pyt-highlight");
    piece.surroundContents(mark);
    marks.push(mark);
  }
  // returned so the caller can undo them (see unwrapMarks)
  return marks;
}

// Undo wrapRange: put each <mark>'s text back in its place, then merge the
// split text nodes back together so the span looks like it never had a mark.
function unwrapMarks(marks: HTMLElement[]): void {
  for (const mark of marks) {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize();
  }
}
// Cleans up whitespaces to prevent spacing differences from causing comparison mismatches.
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
