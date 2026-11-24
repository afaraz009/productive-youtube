// Runs in the background only: it's the one place that talks to mala's Supabase "notes" table.
// The content script and popup reach it through messages (notesApi.ts → background.ts → here).
import { supabase } from "../auth/supabaseClient";
import type { HighlightWithVideo } from "../scripts/types";
import type { Database } from "./database.types";
import type { NoteToSave } from "./types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];

// frontend shape → table row (no id: the database makes it with gen_random_uuid())
//   { start: { key: "8.4", offset: 8 }, end: { key: "11.92", offset: 5 }, text }
//   → { start_time: 8.4, start_offset: 8, end_segment_start: 11.92, end_offset: 5, preview, ... }
function toNoteRow(note: NoteToSave, userId: string): NoteInsert {
  const { highlight } = note;
  return {
    user_id: userId,
    video_id: note.videoId,
    video_title: note.videoTitle,
    start_time: Number(highlight.start.key), // "8.4" → 8.4
    end_time: note.endTime,
    end_segment_start: Number(highlight.end.key),
    start_offset: highlight.start.offset,
    end_offset: highlight.end.offset,
    preview: highlight.text,
    created_at: Date.now(),
  };
}

// table row → frontend shape (+ the video it belongs to)
// String(8.4) gives back "8.4", the same text as the line's data-start
function toHighlight(row: NoteRow): HighlightWithVideo {
  return {
    id: row.id,
    videoId: row.video_id,
    start: { key: String(row.start_time), offset: row.start_offset },
    end: { key: String(row.end_segment_start), offset: row.end_offset },
    text: row.preview,
  };
}

// when the user tries to save/read highlights but isn't signed in
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!data.session?.user.id) {
    throw new Error("Sign in to save and sync highlights.");
  }
  return data.session.user.id;
}

export async function saveNote(note: NoteToSave): Promise<HighlightWithVideo> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("notes")
    .insert(toNoteRow(note, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toHighlight(data);
}

// one video's highlights, or every video's when videoId is left out (newest first)
export async function getSavedNotes(videoId?: string): Promise<HighlightWithVideo[]> {
  const userId = await requireUserId();

  let query = supabase.from("notes").select("*").eq("user_id", userId);
  if (videoId) query = query.eq("video_id", videoId);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(toHighlight);
}

export async function deleteSavedNote(noteId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
