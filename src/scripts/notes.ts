// Notes storage for Productive YouTube.
// Place at: src/scripts/notes.ts
//
// Notes live under their own storage key (NOT inside Settings), so loadSettings()
// and the Focus Lock logic never see them.

export const NOTES_KEY = "ytNotes";

export interface Note {
  id: string;
  videoId: string;
  videoTitle: string;
  /** Seconds into the video */
  timestamp: number;
  /** The transcript text the note is attached to (may be empty) */
  text: string;
  /** The user's own thought (may be empty) */
  comment: string;
  createdAt: number;
}

/** Notes grouped by video ID */
export type NotesStore = Record<string, Note[]>;

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function videoUrlAt(videoId: string, seconds: number): string {
  return `${videoUrl(videoId)}&t=${Math.floor(seconds)}s`;
}

export function getAllNotes(): Promise<NotesStore> {
  return new Promise((resolve) => {
    chrome.storage.local.get([NOTES_KEY], (result) => {
      resolve((result[NOTES_KEY] as NotesStore | undefined) ?? {});
    });
  });
}

function saveAllNotes(store: NotesStore): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [NOTES_KEY]: store }, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

export async function addNote(
  input: Omit<Note, "id" | "createdAt">,
): Promise<Note> {
  const store = await getAllNotes();
  const note: Note = {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  store[note.videoId] = [...(store[note.videoId] ?? []), note];
  await saveAllNotes(store);
  return note;
}

export async function deleteNote(videoId: string, noteId: string): Promise<void> {
  const store = await getAllNotes();
  const remaining = (store[videoId] ?? []).filter((n) => n.id !== noteId);
  if (remaining.length > 0) {
    store[videoId] = remaining;
  } else {
    delete store[videoId];
  }
  await saveAllNotes(store);
}

/** Markdown for one video's notes, ready to paste into Notion / Obsidian. */
export function notesToMarkdown(notes: Note[]): string {
  if (notes.length === 0) return "";

  const first = notes[0];
  const title = first.videoTitle.replace(/([\[\]])/g, "\\$1");
  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  const lines: string[] = [`# [${title}](${videoUrl(first.videoId)})`, ""];

  for (const note of sorted) {
    const link = `[${formatTime(note.timestamp)}](${videoUrlAt(note.videoId, note.timestamp)})`;
    const quote = note.text ? ` "${note.text.replace(/\s+/g, " ")}"` : "";
    lines.push(`- ${link}${quote}`);
    if (note.comment) {
      lines.push(`  - **My note:** ${note.comment.replace(/\s*\n\s*/g, " ")}`);
    }
  }

  return lines.join("\n") + "\n";
}