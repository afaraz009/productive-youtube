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

import type { SavedHighlight, HighlightWithVideo } from "../types";
// the Supabase plugs: each one messages background.ts and never throws,
// it answers { success: true, data } or { success: false, error }
import { getSavedNotes, saveNote, deleteSavedNote } from "../../notes/notesApi";
import type { NoteToSave } from "../../notes/types";

// all saved highlights of one video ([] if none), from Supabase
export async function getHighlights(videoId: string): Promise<SavedHighlight[]> {
  const response = await getSavedNotes(videoId);
  // not signed in, offline, ... → throw, so the caller's try/catch handles it
  if (!response.success) throw new Error(response.error);
  return response.data;
}

// every saved highlight of every video (newest first), from Supabase
// each row already has its video_id, so every item comes back tagged with its videoId
export async function getAllHighlights(): Promise<HighlightWithVideo[]> {
  const response = await getSavedNotes(); // no videoId = every video
  if (!response.success) throw new Error(response.error);
  return response.data;
}

// save one highlight to Supabase (one new row in mala's notes table)
// note = { videoId, videoTitle, endTime, highlight }
export async function addHighlight(note: NoteToSave): Promise<void> {
  const response = await saveNote(note);
  if (!response.success) throw new Error(response.error);
  // data = the saved highlight, not needed: highlight.ts already has it
}

// delete one highlight from Supabase by its id
// (no videoId needed: each row has its own unique id)
export async function removeHighlight(id: string): Promise<void> {
  const response = await deleteSavedNote(id);
  if (!response.success) throw new Error(response.error);
  // nothing to return: on success data is just null
}
