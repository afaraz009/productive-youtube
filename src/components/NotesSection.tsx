// Popup section that lists saved notes, grouped by video.
// Place at: src/popup/NotesSection.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Bookmark, Check, Copy, Trash2 } from "lucide-react";
import {
  NOTES_KEY,
  Note,
  NotesStore,
  deleteNote,
  formatTime,
  getAllNotes,
  notesToMarkdown,
  videoUrlAt,
} from "../scripts/notes";

function openUrl(url: string) {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, "_blank");
  }
}

const NotesSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [store, setStore] = useState<NotesStore>({});
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    getAllNotes().then(setStore);

    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes[NOTES_KEY]) {
        setStore((changes[NOTES_KEY].newValue as NotesStore | undefined) ?? {});
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  // Most recently noted video first
  const videos = useMemo(() => {
    return Object.entries(store)
      .filter(([, notes]) => notes.length > 0)
      .sort(
        ([, a], [, b]) =>
          Math.max(...b.map((n) => n.createdAt)) -
          Math.max(...a.map((n) => n.createdAt)),
      );
  }, [store]);

  const totalNotes = videos.reduce((sum, [, notes]) => sum + notes.length, 0);

  const copyMarkdown = async (videoId: string, notes: Note[]) => {
    try {
      await navigator.clipboard.writeText(notesToMarkdown(notes));
      setCopiedVideoId(videoId);
      window.setTimeout(() => setCopiedVideoId(null), 2000);
    } catch (err) {
      console.error("Failed to copy notes", err);
    }
  };

  return (
    <div className="px-4 pt-4 border-t border-[#e8eeeb] dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e8f2ef] dark:bg-teal-900/40 flex items-center justify-center">
            <Bookmark size={16} className="text-[#086972] dark:text-teal-300" />
          </div>
          <div>
            <span className="block text-[13px] font-bold text-[#263e40] dark:text-slate-100">
              My Notes
            </span>
            <span className="block text-[10px] text-[#879493] dark:text-slate-400 mt-0.5">
              {totalNotes === 0
                ? "Notes you save from transcripts"
                : `${totalNotes} note${totalNotes === 1 ? "" : "s"} across ${videos.length} video${videos.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
        <div
          className={`text-[#086972] dark:text-teal-300 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </div>
      </button>

      {open && (
        <div className="space-y-3 pt-3 pb-3">
          {videos.length === 0 && (
            <p className="text-[11px] text-[#879493] dark:text-slate-400 leading-relaxed">
              No notes yet. While watching, select some transcript text (or just
              let the video play) and press the bookmark button in the transcript
              header.
            </p>
          )}

          {videos.map(([videoId, notes]) => {
            const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);
            return (
              <div
                key={videoId}
                className="rounded-xl border border-[#e5ebe7] dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => openUrl(videoUrlAt(videoId, 0).replace(/&t=0s$/, ""))}
                    className="text-left text-[12px] font-bold text-[#263e40] dark:text-slate-100 leading-snug hover:underline"
                    title={sorted[0].videoTitle}
                  >
                    {sorted[0].videoTitle}
                  </button>
                  <button
                    onClick={() => copyMarkdown(videoId, notes)}
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-[#086972] dark:text-teal-300 px-2 py-1 rounded-md hover:bg-[#edf5f1] dark:hover:bg-teal-900/20"
                    title="Copy these notes as Markdown"
                  >
                    {copiedVideoId === videoId ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Markdown
                      </>
                    )}
                  </button>
                </div>

                <ul className="space-y-2.5">
                  {sorted.map((note) => (
                    <li key={note.id} className="flex items-start gap-2 group">
                      <button
                        onClick={() => openUrl(videoUrlAt(note.videoId, note.timestamp))}
                        className="flex-shrink-0 mt-0.5 text-[10px] font-bold font-mono text-[#086972] dark:text-teal-300 bg-[#e8f2ef] dark:bg-teal-900/40 px-1.5 py-0.5 rounded"
                        title="Open the video at this moment"
                      >
                        {formatTime(note.timestamp)}
                      </button>

                      <div className="flex-1 min-w-0">
                        {note.text && (
                          <p
                            className="text-[11px] text-[#879493] dark:text-slate-400 leading-relaxed"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                            title={note.text}
                          >
                            “{note.text}”
                          </p>
                        )}
                        {note.comment && (
                          <p className="text-[12px] text-[#263e40] dark:text-slate-100 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                            {note.comment}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteNote(note.videoId, note.id)}
                        className="flex-shrink-0 mt-0.5 text-[#879493] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotesSection;