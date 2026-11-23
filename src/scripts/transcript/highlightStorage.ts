// Saved highlights: reading and writing them in chrome.storage.local.
// Shared by highlight.ts (marking the transcript) and anything that shows saved highlights.
//
// SAVED DATA  one key per video:
//   "highlights_<videoId>": [
//     { id, start: { key: "8.4", offset: 8 }, end: { key: "11.92", offset: 5 }, text: "the back end…" },
//   ]
//   key    = data-start of the caption line (span.transcript-segment) the end is in
//   offset = how many characters into that line
//   text   = first 40 characters, only used to check we found the same words again
//
// These functions don't catch errors (e.g. storage full, "Extension context
// invalidated"): the caller decides what to do when one fails.

export type Point = { key: string; offset: number };
export type SavedHighlight = { id: string; start: Point; end: Point; text: string };

// all saved highlights of one video ([] if none)
export async function getHighlights(videoId: string): Promise<SavedHighlight[]> {
  const key = `highlights_${videoId}`;
  const stored = await chrome.storage.local.get(key);
  return stored[key] ?? [];
}

// read this video's list → add one → write back
export async function addHighlight(videoId: string, highlight: SavedHighlight): Promise<void> {
  const highlights = await getHighlights(videoId);
  highlights.push(highlight);
  await chrome.storage.local.set({ [`highlights_${videoId}`]: highlights });
}

// read this video's list → keep all but this id → write back
export async function removeHighlight(videoId: string, id: string): Promise<void> {
  const highlights = await getHighlights(videoId);
  const remaining = highlights.filter((h) => h.id !== id);
  await chrome.storage.local.set({ [`highlights_${videoId}`]: remaining });
}
