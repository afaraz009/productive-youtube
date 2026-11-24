import type { Point, SavedHighlight } from "../scripts/types";

// What the frontend sends to save one highlight: the highlight itself + the 3 things
// mala's notes table needs that the highlight doesn't have.
//   videoTitle → video_title
//   endTime    → end_time (end line's data-start + its data-duration)
// The highlight has no id yet: the database gives the new row one, and saveNote returns it.
export type NoteToSave = {
  videoId: string;
  videoTitle: string;
  endTime: number;
  highlight: Omit<SavedHighlight, "id">; // { start, end, text }
};

// Messages sent to background.ts (by notesApi.ts) to read/write saved highlights
export type NotesRequest =
  | { type: "SAVE_NOTE"; note: NoteToSave }
  | { type: "GET_SAVED_NOTES"; videoId?: string } // no videoId = every video
  | { type: "DELETE_SAVED_NOTE"; noteId: string };

export type NotesResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// The checks below run in background.ts before anything reaches Supabase,
// so a broken message is ignored instead of being saved.

// key must be a number in text form ("8.4"): it's saved in a float8 column
function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.key === "string" &&
    Number.isFinite(Number(point.key)) &&
    Number.isInteger(point.offset)
  );
}

// a highlight that's about to be saved: no id needed (the database makes it)
function isNewHighlight(value: unknown): value is Omit<SavedHighlight, "id"> {
  if (!value || typeof value !== "object") return false;
  const highlight = value as Record<string, unknown>;
  return (
    isPoint(highlight.start) &&
    isPoint(highlight.end) &&
    typeof highlight.text === "string"
  );
}

function isNoteToSave(value: unknown): value is NoteToSave {
  if (!value || typeof value !== "object") return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.videoId === "string" &&
    note.videoId.length > 0 &&
    typeof note.videoTitle === "string" &&
    typeof note.endTime === "number" &&
    Number.isFinite(note.endTime) &&
    isNewHighlight(note.highlight)
  );
}

export function isNotesRequest(value: unknown): value is NotesRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Record<string, unknown>;
  switch (request.type) {
    case "SAVE_NOTE":
      return isNoteToSave(request.note);
    case "GET_SAVED_NOTES":
      return request.videoId === undefined || typeof request.videoId === "string";
    case "DELETE_SAVED_NOTE":
      return typeof request.noteId === "string" && request.noteId.length > 0;
    default:
      return false;
  }
}
