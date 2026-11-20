import type { SavedNote } from "../scripts/types";
import type { NotesRequest, NotesResponse } from "./types";

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


//currently unused
export const saveNote = (note: SavedNote) =>
  send<SavedNote>({ type: "SAVE_NOTE", note });

export const getSavedNotes = () =>
  send<SavedNote[]>({ type: "GET_SAVED_NOTES" });

export const deleteSavedNote = (noteId: string) =>
  send<null>({ type: "DELETE_SAVED_NOTE", noteId });
