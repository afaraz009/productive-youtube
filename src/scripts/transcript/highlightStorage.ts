// Saved highlights: reading and writing them in Supabase (mala's "notes" table).
// Shared by highlight.ts (marking the transcript) and HighlightsView.tsx (the popup list).
// Each function calls notesApi.ts → background.ts → notesService.ts → Supabase.
//
// A HIGHLIGHT (what the frontend works with)
//   { id, start: { key: "8.4", offset: 8 }, end: { key: "11.92", offset: 5 }, text: "the back end…" }
//   key    = data-start of the caption line (span.transcript-segment) the start/end is in
//   offset = how many characters into that line
//   text   = first 40 characters, only used to check we found the same words again
//
// SAVED AS one row per highlight (notesService.ts flattens it):
//   start.key → start_time, end.key → end_segment_start, offsets → start_offset / end_offset,
//   text → preview, + video_id, video_title, end_time, user_id, created_at
//
// These functions throw when something fails (signed out, offline, ...):
// the caller decides what to do (highlight.ts warns and, when saving, erases the marks).

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
// returns the highlight as Supabase saved it (its id is the one the row got)
export async function addHighlight(note: NoteToSave): Promise<HighlightWithVideo> {
  const response = await saveNote(note);
  if (!response.success) throw new Error(response.error);
  return response.data;
}

// delete one highlight from Supabase by its id
// (no videoId needed: each row has its own unique id)
export async function removeHighlight(id: string): Promise<void> {
  const response = await deleteSavedNote(id);
  if (!response.success) throw new Error(response.error);
  // nothing to return: on success data is just null
}
