// What the frontend calls (content script and popup) to reach the saved highlights.
// Each function sends a message to background.ts, which runs notesService.ts (the Supabase part).
// They never throw: a failure comes back as { success: false, error }.
import type { HighlightWithVideo } from "../scripts/types";
import type { NoteToSave, NotesRequest, NotesResponse } from "./types";

function send<T>(request: NotesRequest): Promise<NotesResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      request,
      (response?: NotesResponse<T>) => {
        if (chrome.runtime.lastError || !response) {
          resolve({
            success: false,
            error: "Could not reach the extension background. Please try again.",
          });
          return;
        }

        resolve(response);
      },
    );
  });
}

// note = { videoId, videoTitle, endTime, highlight }
export const saveNote = (note: NoteToSave) =>
  send<HighlightWithVideo>({ type: "SAVE_NOTE", note });

// leave videoId out to get every video's highlights
export const getSavedNotes = (videoId?: string) =>
  send<HighlightWithVideo[]>({ type: "GET_SAVED_NOTES", videoId });

export const deleteSavedNote = (noteId: string) =>
  send<null>({ type: "DELETE_SAVED_NOTE", noteId });
