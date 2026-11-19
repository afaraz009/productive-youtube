import type { SavedNote } from "../scripts/types";

export type NotesRequest =
  | { type: "SAVE_NOTE"; note: SavedNote }
  | { type: "GET_SAVED_NOTES" }
  | { type: "DELETE_SAVED_NOTE"; noteId: string };

export type NotesResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isSavedNote(value: unknown): value is SavedNote {
  if (!value || typeof value !== "object") return false;

  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.videoId === "string" &&
    typeof note.videoTitle === "string" &&
    isFiniteNumber(note.startTime) &&
    isFiniteNumber(note.endTime) &&
    isFiniteNumber(note.startSegmentStart) &&
    isFiniteNumber(note.endSegmentStart) &&
    Number.isInteger(note.startOffset) &&
    Number.isInteger(note.endOffset) &&
    typeof note.preview === "string" &&
    Number.isSafeInteger(note.createdAt)
  );
}

export function isNotesRequest(value: unknown): value is NotesRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Record<string, unknown>;
  switch (request.type) {
    case "SAVE_NOTE":
      return isSavedNote(request.note);
    case "GET_SAVED_NOTES":
      return true;
    case "DELETE_SAVED_NOTE":
      return typeof request.noteId === "string" && request.noteId.length > 0;
    default:
      return false;
  }
}
