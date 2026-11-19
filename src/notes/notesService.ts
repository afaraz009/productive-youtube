import { supabase } from "../auth/supabaseClient";
import type { SavedNote } from "../scripts/types";
import type { Database } from "./database.types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

function toNoteRow(note: SavedNote, userId: string): NoteRow {
  return {
    id: note.id,
    user_id: userId,
    video_id: note.videoId,
    video_title: note.videoTitle,
    start_time: note.startTime,
    end_time: note.endTime,
    start_segment_start: note.startSegmentStart,
    end_segment_start: note.endSegmentStart,
    start_offset: note.startOffset,
    end_offset: note.endOffset,
    preview: note.preview,
    created_at: note.createdAt,
  };
}

function toSavedNote(row: NoteRow): SavedNote {
  return {
    id: row.id,
    videoId: row.video_id,
    videoTitle: row.video_title,
    startTime: row.start_time,
    endTime: row.end_time,
    startSegmentStart: row.start_segment_start,
    endSegmentStart: row.end_segment_start,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    preview: row.preview,
    createdAt: row.created_at,
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user.id) {
    throw new Error("Sign in to save and sync notes.");
  }
  return data.session.user.id;
}

export async function saveNote(note: SavedNote): Promise<SavedNote> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("notes")
    .insert(toNoteRow(note, userId))
    .select("*")
    .single();

  if (error) throw error;
  return toSavedNote(data);
}

export async function getSavedNotes(): Promise<SavedNote[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(toSavedNote);
}

export async function deleteSavedNote(noteId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw error;
}
