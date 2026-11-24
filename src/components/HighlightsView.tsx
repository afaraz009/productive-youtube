import React, { useState, useEffect } from "react";
import { getAllHighlights } from "../scripts/transcript/highlightStorage";
import type { HighlightWithVideo } from "../scripts/types";
// The "My Saved Highlights" view of the popup.
// It replaces the settings view when "My Saved Highlights" is clicked (switching not wired up yet).
//
// STRUCTURE
//   header  ← back button + title
//   body    → empty message, or one card per saved highlight

const HighlightsView: React.FC<{ setActiveView: (view: string) => void }> = ({
    setActiveView
}) => {
  // every saved highlight, each with the videoId it belongs to
  const [highlights, setHighlights] = useState<HighlightWithVideo[]>([]);

  // video titles by videoId: { "dQw4w9WgXcQ": "Rick Astley - Never Gonna…" }
  // filled in one by one as they arrive; until then a card shows the videoId
  const [titles, setTitles] = useState<Record<string, string>>({});

  // load them once, when the view opens
  useEffect(() => {
    //same as -> getAllHighlights().then((list) => setHighlights(list));
    //list holds highlights of all videos
    getAllHighlights().then((list) => {
      setHighlights(list);
      // one title request per video (not per highlight): Set removes the repeated ids
      const videoIds = [...new Set(list.map((h) => h.videoId))];

      videoIds.forEach(async (videoId) => {
        // YouTube's oEmbed URL gives a video's title without an API key
        // (the popup is allowed to call youtube.com through host_permissions in the manifest)
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        try {
          const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`);
          if (!res.ok) return; // deleted or private video → keep showing the videoId
          const data = await res.json();
          //[videoId] -> use the value of this variable as the key name
          //prev -> current value of `titles`
          setTitles((prev) => ({ ...prev, [videoId]: data.title }));
        } catch {
          // offline → keep showing the videoId
        }
      });
    });
  }, []);
  
  const openVideo = (videoId: string, timestamp: number) => {
    chrome.tabs.create({
        url: `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`
    });
};


  return (
    <div className="w-96 max-h-[600px] pb-5 overflow-y-auto font-sans text-sm bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-950">
      {/* header: same blue bar as the settings view, with a back button */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 border-b border-blue-800 dark:border-blue-950 px-4 py-3.5 shadow-md">
        <button
          type="button"
          onClick={() => setActiveView("settings")}
          className="px-2 py-1 text-xs font-medium text-white bg-white/15 hover:bg-white/25 rounded-md"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-sm font-bold text-white">My Saved Highlights</h1>
          <p className="text-xs text-blue-100 mt-1">Highlights you saved from video transcripts</p>
        </div>
      </div>

      {/* body */}
      <div className="p-4">
        {highlights.length === 0 ? (
          // nothing saved yet
          <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No highlights yet. Select text in a video's transcript and click "Highlight".
          </p>
        ) : (
          // one card per highlight
          <ul className="space-y-2">
            {highlights.map((highlight) => (
              <li
                key={highlight.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50"
              >
                <p className="text-xs text-slate-900 dark:text-slate-100">“{highlight.text}”</p>
                {/* bottom row: time + title on the left, "Open" button on the right */}
                <div className="flex items-center gap-2 mt-1">
                  {/* the title, or the videoId until (or if) the title loads.
                      truncate = one line with "…"; hover shows the whole title.
                      flex-1 min-w-0 = take the free space, and let it shrink so truncate works */}
                  <p
                    className="flex-1 min-w-0 text-xs text-slate-500 dark:text-slate-400 truncate"
                    title={titles[highlight.videoId] ?? highlight.videoId}
                  >
                    at {highlight.start.key}s · {titles[highlight.videoId] ?? `video ${highlight.videoId}`}
                  </p>

                  {/* opens this video at this highlight (not wired up yet) */}
                  <button
                    type="button"
                    onClick={() => openVideo(highlight.videoId, highlight.start.key)}
                    className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                  >
                    ▶ Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HighlightsView;
