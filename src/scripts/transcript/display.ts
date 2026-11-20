import { settings } from "../settings";
import {
  formatTimestamp,
  decodeHtmlEntities,
  cleanTranscriptText,
} from "./utils";
import type { NotesResponse } from "../../notes/types";
import type { SavedNote } from "../types";

type ActiveSavedNoteRange = {
  startTime: number;
  endTime: number;
  startSegmentStart: number;
  endSegmentStart: number;
  startOffset: number;
  endOffset: number;
};

let activeSavedNoteRanges: ActiveSavedNoteRange[] = [];

export function clearActiveSavedNoteRange(): void {
  activeSavedNoteRanges = [];
}

const SAVED_NOTES_KEY = "savedNotes";
const PENDING_NOTE_PREFIX = "pendingNoteNavigation_";

// Interface for representing a selected range in the transcript
type NoteSelection = {
  startTime: number;
  endTime: number;
  startSegmentStart: number;
  endSegmentStart: number;
  startOffset: number;
  endOffset: number;
  preview: string;
};

function getSelectedTranscriptRange(): NoteSelection | null {
  // The returned object is the browser selection object and it has information about
  // where selection starts and ends in DOM, the actual text selected, and whether the selection is collapsed (no text selected) or not.
  const selection = window.getSelection();
  const container = document.getElementById("transcript-container");

  if (!selection || selection.isCollapsed || !container) {
    return null;
  }

  // A Range represents a specific portion of the DOM. It has four important properties:
  // range.startContainer - The node where the range starts
  // range.startOffset - At which position inside that node the selecftion begins
  // range.endContainer - The node where the range ends
  // range.endOffset - At which position inside that node the selection ends

  const range = selection.getRangeAt(0);
  // the range might look like this
  //   {
  //   startContainer: TextNode("Elon Musk became very successful"),
  //   startOffset: 10,

  //   endContainer: TextNode("work and how people make decisions"),
  //   endOffset: 24
  // }

  // Only allow selections completely inside our transcript.
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return null;
  }

  // Find which transcript segment contains the actual start/end
  // of the user's selection.

  // here our job is to The span where the selection starts.
  // The span where the selection ends.
  // The exact character position inside each span
  const startSegment =
    // startContainer is the text node having selected text not the html element so we are finding its closest parent element with the class transcript-segment, if the startContainer is an element then we are finding its closest parent element with the class transcript-segment
    range.startContainer instanceof Element
      ? range.startContainer.closest<HTMLElement>(".transcript-segment")
      : range.startContainer.parentElement?.closest<HTMLElement>(
          ".transcript-segment",
        ); // closest() method returns the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter. If there isn't such an ancestor, it returns null.

  const endSegment =
    range.endContainer instanceof Element
      ? range.endContainer.closest<HTMLElement>(".transcript-segment")
      : range.endContainer.parentElement?.closest<HTMLElement>(
          ".transcript-segment",
        );

  if (!startSegment || !endSegment) {
    return null;
  }

  const startOffset = range.startOffset;
  const endOffset = range.endOffset;

  const startTime = Number(startSegment.dataset.start);

  const lastStart = Number(endSegment.dataset.start);
  const lastDuration = Number(endSegment.dataset.duration || 0);

  const startSegmentStart = startTime;
  const endSegmentStart = lastStart;

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(lastStart) ||
    !Number.isFinite(lastDuration) ||
    !Number.isFinite(startSegmentStart) ||
    !Number.isFinite(endSegmentStart)
  ) {
    return null;
  }

  return {
    startTime,
    endTime: lastStart + lastDuration,
    startSegmentStart,
    endSegmentStart,
    startOffset,
    endOffset,
    preview: selection.toString().trim().slice(0, 100),
  };
}

// function setupTranscriptNoteSaving(): void {
//   if (document.getElementById("save-transcript-note-button")) {
//     return;
//   }

//   const button = document.createElement("button");
//   button.id = "save-transcript-note-button";
//   button.textContent = "Save note";

//   button.style.cssText = `
//     position: fixed;
//     display: none;
//     z-index: 10000;
//     padding: 8px 14px;
//     border: none;
//     border-radius: 6px;
//     background: #086972;
//     color: white;
//     font-size: 13px;
//     font-weight: 600;
//     cursor: pointer;
//     box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
//   `;

//   document.body.appendChild(button);

//   let selectedRange: NoteSelection | null = null;

//   document.addEventListener("mouseup", () => {
//     // Allow the browser to finish updating the selection first.
//     setTimeout(() => {
//       const selection = getSelectedTranscriptRange();

//       // if nothing is selected, hide the button
//       if (!selection) {
//         selectedRange = null;
//         button.style.display = "none";
//         return;
//       }

//       selectedRange = selection;

//       const browserSelection = window.getSelection();
//       if (!browserSelection || browserSelection.rangeCount === 0) {
//         return;
//       }

//       // it helps us to set the position of the button to be near the selected text in the transcript container
//       const rect = browserSelection.getRangeAt(0).getBoundingClientRect();

//       button.style.left = `${Math.max(8, rect.left + rect.width / 2 - 45)}px`;
//       button.style.top = `${Math.max(8, rect.top - 42)}px`;
//       button.style.display = "block";
//     }, 0);
//   });

//   button.addEventListener("mousedown", (event) => {
//     // Prevent clicking the button from clearing the text selection before we
//     // access it in the click handler. This is a workaround for the fact that clicking a button will clear the selection.
//     event.preventDefault();
//   });

//   button.addEventListener("click", () => {
//     if (!selectedRange) return;

//     const videoId = new URL(window.location.href).searchParams.get("v");

//     if (!videoId) {
//       alert("Could not identify this video.");
//       return;
//     }

//     const note = {
//       id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
//       videoId,
//       videoTitle: getVideoTitle(),
//       startTime: selectedRange.startTime,
//       endTime: selectedRange.endTime,

//       startSegmentStart: selectedRange.startSegmentStart,
//       endSegmentStart: selectedRange.endSegmentStart,
//       startOffset: selectedRange.startOffset,
//       endOffset: selectedRange.endOffset,

//       preview: selectedRange.preview,
//       createdAt: Date.now(),
//     };
//     // spread the existing notes and add the new note to the array, then save it back to storage
//     chrome.storage.local.get([SAVED_NOTES_KEY], (result) => {
//       const notes = (result[SAVED_NOTES_KEY] || []) as (typeof note)[];
//       // this is an arrar of objects
//       // we are creating a new array with the existing notes and the new note added to it
//       const updatedNotes = [...notes, note];

//       // Check if adding this note would exceed the storage quota
//       chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
//         // here are finding the size of the existing notes and the new note to estimate if adding it would exceed the quota
//         const oldSize = new Blob([JSON.stringify(notes)]).size;
//         const newSize = new Blob([JSON.stringify(updatedNotes)]).size;
//         const estimatedBytes = newSize - oldSize;

//         const quota = chrome.storage.local.QUOTA_BYTES;

//         if (bytesInUse + estimatedBytes > quota) {
//           alert("Storage is full. Delete some saved notes before adding more.");
//           return;
//         }

//         // save in local storage and then popup's useeffect has a
//         // listener to update the savedNotes state in the popup
//         //  when storage changes, so we don't need to do anything else here
//         chrome.storage.local.set({ [SAVED_NOTES_KEY]: updatedNotes }, () => {
//           if (chrome.runtime.lastError) {
//             console.error(
//               "Productive YouTube: Could not save note:",
//               chrome.runtime.lastError.message,
//             );

//             alert(
//               "Could not save your note. Your extension storage may be full.",
//             );
//             return;
//           }

//           button.textContent = "Saved";

//           setTimeout(() => {
//             button.style.display = "none";
//             button.textContent = "Save note";
//           }, 1000);

//           selectedRange = null;
//           window.getSelection()?.removeAllRanges();
//         });
//       });
//     });
//   });
// }

function setupTranscriptNoteSaving(): void {
  if (document.getElementById("save-transcript-note-button")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "save-transcript-note-button";
  button.textContent = "Save note";

  button.style.cssText = `
    position: fixed;
    display: none;
    z-index: 10000;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: #086972;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  `;

  document.body.appendChild(button);

  let selectedRange: NoteSelection | null = null;

  document.addEventListener("mouseup", () => {
    setTimeout(() => {
      const selection = getSelectedTranscriptRange();

      if (!selection) {
        selectedRange = null;
        button.style.display = "none";
        return;
      }

      selectedRange = selection;

      const browserSelection = window.getSelection();
      if (!browserSelection || browserSelection.rangeCount === 0) {
        return;
      }

      const rect = browserSelection.getRangeAt(0).getBoundingClientRect();

      button.style.left = `${Math.max(8, rect.left + rect.width / 2 - 45)}px`;
      button.style.top = `${Math.max(8, rect.top - 42)}px`;
      button.style.display = "block";
    }, 0);
  });

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  //notes1.....
  button.addEventListener("click", () => {
    if (!selectedRange) return;

    const videoId = new URL(window.location.href).searchParams.get("v");

    if (!videoId) {
      alert("Could not identify this video.");
      return;
    }

    const note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      videoId,
      videoTitle: getVideoTitle(),
      startTime: selectedRange.startTime,
      endTime: selectedRange.endTime,
      startSegmentStart: selectedRange.startSegmentStart,
      endSegmentStart: selectedRange.endSegmentStart,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
      preview: selectedRange.preview,
      createdAt: Date.now(),
    };

    chrome.runtime.sendMessage(
      { type: "SAVE_NOTE", note },
      (response?: NotesResponse<SavedNote>) => {
        if (chrome.runtime.lastError || !response) {
          const error =
            chrome.runtime.lastError?.message ??
            "Could not reach the extension background.";

          console.error("Productive YouTube: Could not save note:", error);
          alert("Could not save your note. Please try again.");
          return;
        }

        if (!response.success) {
          console.error(
            "Productive YouTube: Could not save note:",
            response.error,
          );

          alert(response.error);
          return;
        }

        // Create the range for the newly saved note.
        const newRange: ActiveSavedNoteRange = {
          startTime: note.startTime,
          endTime: note.endTime,
          startSegmentStart: note.startSegmentStart,
          endSegmentStart: note.endSegmentStart,
          startOffset: note.startOffset,
          endOffset: note.endOffset,
        };

        // Keep all previous ranges and add the new one.
        activeSavedNoteRanges.push(newRange);

        // Rebuild all highlights, but scroll to the newly saved note.
        addSavedNoteStyles();

        // pass active ranges array to highlight all and the newly created note to the highlight function so will scroll to that note instead of the first one
        highlightSavedNote(activeSavedNoteRanges, newRange);
        button.textContent = "Saved";

        setTimeout(() => {
          button.style.display = "none";
          button.textContent = "Save note";
        }, 1000);

        selectedRange = null;
        window.getSelection()?.removeAllRanges();
      },
    );
  });
}

type SavedNoteHighlightRange = {
  startSegmentStart: number;
  endSegmentStart: number;
  startOffset: number;
  endOffset: number;
};
function addSavedNoteStyles(): void {
  if (document.getElementById("saved-note-styles")) return;

  const style = document.createElement("style");
  style.id = "saved-note-styles";

  style.textContent = `
    #transcript-container .transcript-segment.saved-note-segment {
      background-color: rgba(195, 164, 33, 0.35) !important;
      color: inherit !important;
      border-radius: 3px;
      padding: 2px 3px;
    }
      ::highlight(saved-note-highlight) {
        background-color: #f6d365;
        color: #202020;
}
  `;

  document.head.appendChild(style);
}
function highlightSavedNote(
  savedRanges: ActiveSavedNoteRange[],
  scrollToRange?: ActiveSavedNoteRange,
): void {
  console.log("highlightSavedNote called:", savedRanges.length, "notes");

  const container = document.getElementById("transcript-container");
  if (!container) return;

  const segments = Array.from(
    container.querySelectorAll<HTMLElement>(".transcript-segment"),
  );

  const css = window.CSS as any;

  // Remove previous highlights before rebuilding all of them.
  css.highlights?.delete("saved-note-highlight");

  segments.forEach((segment) => {
    segment.classList.remove("saved-note-segment");
  });

  // This array will contain one DOM Range for each valid saved note.
  const domRanges: Range[] = [];

  let firstHighlighted: HTMLElement | undefined;

  // 1. Process every saved note's details
  savedRanges.forEach((preciseRange) => {
    const startSegment = segments.find(
      (segment) =>
        // the segment whose starting time stamp is same as the saved note's starting timestamp is the first segment
        Number(segment.dataset.start) === preciseRange.startSegmentStart,
    );

    const endSegment = segments.find(
      (segment) =>
        Number(segment.dataset.start) === preciseRange.endSegmentStart,
    );

    let exactRangeCreated = false;

    if (startSegment && endSegment) {
      // found segment now find their child text node who actucally contain the text
      const startTextNode = startSegment.firstChild;
      const endTextNode = endSegment.firstChild;

      if (
        startTextNode?.nodeType === Node.TEXT_NODE &&
        endTextNode?.nodeType === Node.TEXT_NODE
      ) {
        const startLength = startTextNode.textContent?.length ?? 0;
        const endLength = endTextNode.textContent?.length ?? 0;

        const validOffsets =
          Number.isInteger(preciseRange.startOffset) &&
          Number.isInteger(preciseRange.endOffset) &&
          preciseRange.startOffset >= 0 &&
          preciseRange.endOffset >= 0 &&
          preciseRange.startOffset <= startLength &&
          preciseRange.endOffset <= endLength;

        if (validOffsets) {
          // 2. create the browser range for that note details
          const range = document.createRange();

          // where the selection begings
          range.setStart(startTextNode, preciseRange.startOffset);
          range.setEnd(endTextNode, preciseRange.endOffset);

          // 3. Store the browser range
          domRanges.push(range);
          exactRangeCreated = true;

          if (!firstHighlighted) {
            firstHighlighted = startSegment;
          }
        }
      }
    }

    // Fallback for this note if its exact text range cannot be reconstructed.
    if (!exactRangeCreated) {
      segments.forEach((segment) => {
        const start = Number(segment.dataset.start);
        const duration = Number(segment.dataset.duration || 0);
        const end = start + duration;

        if (start < preciseRange.endTime && end > preciseRange.startTime) {
          segment.classList.add("saved-note-segment");

          if (!firstHighlighted) {
            firstHighlighted = segment;
          }
        }
      });
    }
  });

  // Register all exact text ranges together.
  const HighlightClass = (window as any).Highlight;

  if (css.highlights && HighlightClass && domRanges.length > 0) {
    // 4. Register the DOM ranges with the hughlight API so it can aplly the below css class
    const highlight = new HighlightClass(...domRanges);

    css.highlights.set("saved-note-highlight", highlight);

    console.log("Highlighted", domRanges.length, "exact note ranges");
  } else if (domRanges.length > 0) {
    // CSS Highlight API unavailable: use whole-segment highlighting instead.
    domRanges.forEach((range) => {
      const startNode = range.startContainer;
      const startElement =
        startNode instanceof Element ? startNode : startNode.parentElement;

      const endNode = range.endContainer;
      const endElement =
        endNode instanceof Element ? endNode : endNode.parentElement;

      const startSegment = startElement?.closest(".transcript-segment");
      const endSegment = endElement?.closest(".transcript-segment");

      const startTime = Number(
        (startSegment as HTMLElement | null)?.dataset.start,
      );
      const endTime = Number((endSegment as HTMLElement | null)?.dataset.start);

      const matchingRange = savedRanges.find(
        (item) =>
          item.startSegmentStart === startTime &&
          item.endSegmentStart === endTime,
      );

      if (matchingRange) {
        segments.forEach((segment) => {
          const start = Number(segment.dataset.start);
          const end = start + Number(segment.dataset.duration || 0);

          if (start < matchingRange.endTime && end > matchingRange.startTime) {
            segment.classList.add("saved-note-segment");
          }
        });
      }
    });
  }

  // If a specific note was provided, scroll to that note.
  // Otherwise, keep the existing first-highlight behaviour.
  const targetSegment = scrollToRange
    ? segments.find(
        (segment) =>
          // the segment whose starting timestamp is same as the scrollToRange's starting timestamp save that as target timestamp to scoll to
          Number(segment.dataset.start) === scrollToRange.startSegmentStart,
      )
    : firstHighlighted;

  if (targetSegment) {
    targetSegment.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

function restorePendingNoteHighlight(): void {
  // 1 . take the video id
  const videoId = new URL(window.location.href).searchParams.get("v");

  if (!videoId) return;

  // 2. First, fetch all notes belonging to the signed-in user from Supabase.
  chrome.runtime.sendMessage(
    { type: "GET_SAVED_NOTES" },
    (notesResponse?: NotesResponse<SavedNote[]>) => {
      if (chrome.runtime.lastError || !notesResponse?.success) {
        const responseError =
          notesResponse && !notesResponse.success
            ? notesResponse.error
            : undefined;
        console.error(
          "Could not retrieve saved notes:",
          chrome.runtime.lastError?.message ?? responseError,
        );
        return;
      }

      // Keep only notes belonging to the currently opened video in videonotes array
      const videoNotes = (notesResponse.data ?? []).filter(
        (note) => note.videoId === videoId,
      );

      // Convert every saved note into the format used by the
      // existing multi-highlight function.
      // from each not got from supabase make activesavednotesrange to pass the data needed to highlight the notes
      activeSavedNoteRanges = videoNotes.map((note) => ({
        startTime: note.startTime,
        endTime: note.endTime,
        startSegmentStart: note.startSegmentStart,
        endSegmentStart: note.endSegmentStart,
        startOffset: note.startOffset,
        endOffset: note.endOffset,
      }));

      // Keep the existing popup-to-video navigation flow.
      // This also lets us prioritize the note the user clicked.
      chrome.runtime.sendMessage(
        { type: "GET_SAVED_NOTE_RANGE" },
        (pendingResponse) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Could not retrieve pending note range:",
              chrome.runtime.lastError.message,
            );

            // response received successfully convert the data into the format needed to highlight
          } else if (pendingResponse?.success && pendingResponse.data) {
            const pendingRange = {
              startTime: pendingResponse.data.startTime,
              endTime: pendingResponse.data.endTime,
              startSegmentStart: pendingResponse.data.startSegmentStart,
              endSegmentStart: pendingResponse.data.endSegmentStart,
              startOffset: pendingResponse.data.startOffset,
              endOffset: pendingResponse.data.endOffset,
            };

            // Check whether this note is already in the Supabase results.
            // now we have all the notes from the supabase we are finding the index of the note whose data is same as that of the note clicked which is basically the pending note range here

            const existingIndex = activeSavedNoteRanges.findIndex(
              (range) =>
                range.startSegmentStart === pendingRange.startSegmentStart &&
                range.endSegmentStart === pendingRange.endSegmentStart &&
                range.startOffset === pendingRange.startOffset &&
                range.endOffset === pendingRange.endOffset,
            );

            // Avoid adding the same note twice.
            if (existingIndex !== -1) {
              // removed the selected note that was already in supabase and returns it
              const [selectedRange] = activeSavedNoteRanges.splice(
                existingIndex,
                1,
              );
              // we shift that new note to the starting position
              activeSavedNoteRanges.unshift(selectedRange);
            } else {
              // if the note is not in the supabase we just push it to the start of the active range
              activeSavedNoteRanges.unshift(pendingRange);
            }
          }

          // now we have all the notes so just apply the styles and then apply the highlight on them together
          // Apply all notes together, not just the selected one.
          if (activeSavedNoteRanges.length > 0) {
            addSavedNoteStyles();
            highlightSavedNote(activeSavedNoteRanges);
          }
        },
      );
    },
  );
}

function getVideoTitle(): string {
  // Try multiple selectors to get the video title
  const titleSelectors = [
    "h1.ytd-watch-metadata yt-formatted-string",
    "h1.ytd-video-primary-info-renderer",
    "h1.title.ytd-video-primary-info-renderer",
    "ytd-watch-metadata h1",
    "h1 yt-formatted-string",
  ];

  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent) {
      return titleElement.textContent.trim();
    }
  }

  // Fallback: try to get from document title
  const docTitle = document.title;
  if (docTitle && docTitle !== "YouTube") {
    // Remove " - YouTube" suffix if present
    return docTitle.replace(/ - YouTube$/, "").trim();
  }

  return "Video Title Not Found";
}

export function displayTranscript(
  transcript: { text: string; start: number }[],
): void {
  console.log(
    "Productive YouTube: displayTranscript function called with",
    transcript.length,
    "entries",
  );

  // Check if we're on a watch page
  if (!window.location.pathname.includes("/watch")) {
    console.log(
      "Productive YouTube: Not on watch page, skipping transcript display",
    );
    return;
  }

  // #transcript-fixed-wrapper is the wrapper that hold the transcript container and is placed in the #secondary sidebar
  // Place the transcript inside YouTube's #secondary sidebar, above the suggestions.
  // The suggestion remover hides individual suggestion elements but #secondary stays visible.
  let transcriptWrapper = document.getElementById(
    "transcript-fixed-wrapper",
  ) as HTMLElement | null;

  if (!transcriptWrapper) {
    transcriptWrapper = document.createElement("div");
    transcriptWrapper.id = "transcript-fixed-wrapper";
    transcriptWrapper.style.cssText = `
      width: 100% !important;
      max-height: calc(100vh - 100px) !important;
      z-index: 2000 !important;
      pointer-events: auto !important;
      overflow-y: auto !important;
    `;

    // Insert into #secondary or #secondary-inner so it sits above suggestions
    const secondaryInner =
      document.querySelector("#secondary-inner") ||
      document.querySelector("#secondary");
    // it means insert the transcriptWrapper as the first child of the secondaryInner, so it appears above suggestions
    if (secondaryInner) {
      secondaryInner.insertBefore(transcriptWrapper, secondaryInner.firstChild);
    } else {
      // Fallback to fixed positioning if sidebar not found
      transcriptWrapper.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 24px !important;
        width: 402px !important;
        max-height: calc(100vh - 100px) !important;
        z-index: 2000 !important;
        pointer-events: auto !important;
        overflow-y: auto !important;
      `;
      document.body.appendChild(transcriptWrapper);
    }
  }

  const secondary = transcriptWrapper;

  if (!secondary) {
    console.error(
      "Productive YouTube: Could not find any suitable container for transcript - giving up",
    );
    return;
  }

  console.log(
    "Productive YouTube: Using container:",
    secondary.tagName || secondary.id || "unknown",
  );

  // Group transcript entries into 25-second chunks with individual lines
  const CHUNK_SIZE = 25; // seconds
  // we will store the final grouped transcript here where each chunk has a start time and an array of lines with text, start time, and duration
  const chunkedTranscript: {
    start: number; // this start means the start time of the chunk
    lines: { text: string; start: number; duration: number }[]; // this start means the starting time of an individual line within the chunk, and duration is how long that line lasts
  }[] = [];
  let currentChunk: {
    start: number;
    lines: { text: string; start: number; duration: number }[];
  } | null = null;

  transcript.forEach((line, index) => {
    // Decode HTML entities and clean the text
    let decodedText = decodeHtmlEntities(line.text);
    decodedText = cleanTranscriptText(decodedText);

    // Skip if text is empty after cleaning
    if (!decodedText) return;

    const chunkStart = Math.floor(line.start / CHUNK_SIZE) * CHUNK_SIZE; // Round down to nearest chunk

    // Calculate duration for this line
    const nextStart =
      index < transcript.length - 1
        ? transcript[index + 1].start
        : line.start + 2;
    const lineDuration = nextStart - line.start;

    const lineData = {
      text: decodedText,
      start: line.start,
      duration: lineDuration,
    };

    if (!currentChunk || currentChunk.start !== chunkStart) {
      // Start a new chunk
      if (currentChunk) {
        chunkedTranscript.push(currentChunk);
      }
      currentChunk = {
        start: chunkStart,
        lines: [lineData],
      };
    } else {
      // Add to current chunk
      currentChunk.lines.push(lineData);
    }
  });

  // Don't forget the last chunk
  if (currentChunk) {
    chunkedTranscript.push(currentChunk);
  }

  let container = document.getElementById("transcript-container");
  if (container) {
    console.log("Productive YouTube: Reusing existing transcript container");
    container.innerHTML = "";
  } else {
    console.log("Productive YouTube: Creating new transcript container");
    container = document.createElement("div");
    container.id = "transcript-container";
    container.className = "transcript-container";
    // Add inline styles with !important flags to ensure visibility
    const initialDark = isDarkMode();
    const initialBorder = initialDark
      ? "rgba(60, 60, 60, 0.6)"
      : "rgba(229, 231, 235, 0.8)";
    const initialShadow = initialDark
      ? "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)"
      : "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08)";
    const initialBg = initialDark
      ? "rgba(0, 0, 0, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
    container.style.cssText = `
      background: ${initialBg} !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 1px solid ${initialBorder} !important;
      border-radius: 12px !important;
      margin-bottom: 1.5rem !important;
      margin-top: 1.5rem !important;
      box-shadow: ${initialShadow} !important;
      width: 100% !important;
      max-width: 400px !important;
      z-index: 1000 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      overflow: hidden !important;
    `;
    secondary.prepend(container);
    console.log(
      "Productive YouTube: Transcript container created and inserted into DOM",
    );
  }

  const header = createTranscriptHeader();
  container.appendChild(header);

  const content = createTranscriptContent();
  container.appendChild(content);

  const { copyButton, syncButton } = setupHeaderButtons(
    header,
    chunkedTranscript,
    content,
  );

  setupHeaderToggle(header, content);

  renderTranscriptChunks(chunkedTranscript, content);

  applyDarkModeStyles(isDarkMode(), container, header, content);
  setupDarkModeObserver(container, header, content);
  setupVideoTimeTracking(content);

  // styles for highlighted note
  addSavedNoteStyles();
  setupTranscriptNoteSaving();
  restorePendingNoteHighlight();
}

function createTranscriptHeader(): HTMLElement {
  const header = document.createElement("div");
  header.className = "transcript-header";
  const isDark = isDarkMode();
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid ${isDark ? "rgba(60, 60, 60, 0.6)" : "rgba(229, 231, 235, 0.6)"};
    cursor: pointer;
    background: ${isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(249, 250, 251, 0.8)"};
    gap: 0.5rem;
  `;

  const title = document.createElement("div");
  title.className = "transcript-title";
  title.textContent = "Video Transcript";
  title.style.cssText = `
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    letter-spacing: -0.01em;
  `;
  header.appendChild(title);

  const arrowSpan = document.createElement("span");
  arrowSpan.className = "transcript-arrow";
  arrowSpan.style.cssText = `
    margin-left: 0.5rem;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `;
  arrowSpan.textContent = "▲";
  title.appendChild(arrowSpan);

  const headerButtons = document.createElement("div");
  headerButtons.className = "transcript-header-buttons";
  headerButtons.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  `;
  header.appendChild(headerButtons);

  return header;
}

function createTranscriptContent(): HTMLElement {
  const isFullHeight = settings.removeWatchPageSuggestions;
  const maxHeight = isFullHeight ? "calc(100vh - 180px)" : "24rem";

  const content = document.createElement("div");
  content.className = "transcript-content";
  content.style.cssText = `
    max-height: ${maxHeight};
    overflow-y: auto;
    padding: 1.5rem;
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `;

  return content;
}

function setupHeaderButtons(
  header: HTMLElement,
  chunkedTranscript: any[],
  content: HTMLElement,
): { copyButton: HTMLElement; syncButton: HTMLElement } {
  const headerButtons = header.querySelector(
    ".transcript-header-buttons",
  ) as HTMLElement;

  const copyButton = createCopyButton(chunkedTranscript);
  const syncButton = createSyncButton(content);
  const translateButton = createTranslateButton(chunkedTranscript);
  const summaryButton = createSummaryButton(chunkedTranscript);
  const vocabularyButton = createVocabularyButton(chunkedTranscript);

  headerButtons.appendChild(copyButton);
  headerButtons.appendChild(syncButton);
  headerButtons.appendChild(translateButton);
  headerButtons.appendChild(summaryButton);
  headerButtons.appendChild(vocabularyButton);

  return { copyButton, syncButton };
}

function createCopyButton(chunkedTranscript: any[]): HTMLElement {
  const copyButton = document.createElement("button");
  copyButton.className = "transcript-copy-button";
  copyButton.title = "Copy transcript to clipboard";

  const copyIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  copyIconSvg.setAttribute("width", "20");
  copyIconSvg.setAttribute("height", "20");
  copyIconSvg.setAttribute("viewBox", "0 0 24 24");
  copyIconSvg.setAttribute("fill", "none");
  copyIconSvg.setAttribute("stroke", "currentColor");
  copyIconSvg.setAttribute("stroke-width", "2");
  copyIconSvg.setAttribute("stroke-linecap", "round");
  copyIconSvg.setAttribute("stroke-linejoin", "round");
  copyIconSvg.innerHTML = `
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  `;
  copyButton.appendChild(copyIconSvg);

  copyButton.style.cssText = `
    background: transparent;
    color: #3b82f6;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  copyButton.onmouseover = () => {
    copyButton.style.background = "rgba(59, 130, 246, 0.1)";
    copyButton.style.color = "#2563eb";
    copyButton.style.transform = "scale(1.1)";
  };
  copyButton.onmouseout = () => {
    copyButton.style.background = "transparent";
    copyButton.style.color = "#3b82f6";
    copyButton.style.transform = "scale(1)";
  };

  copyButton.onclick = (e) => {
    e.stopPropagation();

    // Get video title
    const videoTitle = getVideoTitle();

    // Get video URL
    const videoUrl = window.location.href.split("&")[0]; // Remove extra params

    // Build transcript text
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    // Format the complete text with title, URL, and transcript
    const completeText = `${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    navigator.clipboard.writeText(completeText);

    copyButton.style.background = "transparent";
    copyButton.style.color = "#10b981";
    const svg = copyButton.querySelector("svg");
    if (svg) {
      svg.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;
    }
    setTimeout(() => {
      if (svg) {
        svg.innerHTML = `
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        `;
      }
      copyButton.style.background = "transparent";
      copyButton.style.color = "#3b82f6";
    }, 2000);
  };

  return copyButton;
}

function createSyncButton(content: HTMLElement): HTMLElement {
  const syncButton = document.createElement("button");
  syncButton.className = "transcript-sync-button";
  syncButton.title = "Scroll to current timestamp";

  const syncIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  syncIconSvg.setAttribute("width", "20");
  syncIconSvg.setAttribute("height", "20");
  syncIconSvg.setAttribute("viewBox", "0 0 24 24");
  syncIconSvg.setAttribute("fill", "none");
  syncIconSvg.setAttribute("stroke", "currentColor");
  syncIconSvg.setAttribute("stroke-width", "2");
  syncIconSvg.setAttribute("stroke-linecap", "round");
  syncIconSvg.setAttribute("stroke-linejoin", "round");
  syncIconSvg.innerHTML = `
    <path d="M1 4v6h6"></path>
    <path d="M23 20v-6h-6"></path>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  `;
  syncButton.appendChild(syncIconSvg);

  syncButton.style.cssText = `
    background: transparent;
    color: #10b981;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  syncButton.onmouseover = () => {
    syncButton.style.background = "rgba(16, 185, 129, 0.1)";
    syncButton.style.color = "#059669";
    syncButton.style.transform = "scale(1.1)";
  };
  syncButton.onmouseout = () => {
    syncButton.style.background = "transparent";
    syncButton.style.color = "#10b981";
    syncButton.style.transform = "scale(1)";
  };

  syncButton.onclick = (e) => {
    e.stopPropagation();
    const video = document.querySelector("video");
    if (video) {
      const currentTime = video.currentTime;
      const activeSegment = content.querySelector(
        ".transcript-segment.active",
      ) as HTMLElement | null;
      if (activeSegment) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const containerHeight = content.clientHeight;
        const scrollPosition = relativeTop - containerHeight / 2;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
      } else {
        const segments = Array.from(
          content.querySelectorAll<HTMLElement>(".transcript-segment"),
        );
        let closestSegment: HTMLElement | null = null;
        let minDiff = Infinity;

        segments.forEach((segmentEl) => {
          const start = parseFloat(segmentEl.dataset.start || "0");
          const diff = Math.abs(currentTime - start);
          if (diff < minDiff) {
            minDiff = diff;
            closestSegment = segmentEl;
          }
        });

        const segmentToScroll = closestSegment as HTMLElement | null;
        if (segmentToScroll) {
          const segmentTop = segmentToScroll.getBoundingClientRect().top;
          const contentTop = content.getBoundingClientRect().top;
          const relativeTop = segmentTop - contentTop + content.scrollTop;
          const containerHeight = content.clientHeight;
          const scrollPosition = relativeTop - containerHeight / 2;
          content.scrollTo({ top: scrollPosition, behavior: "smooth" });
        }
      }
    }
  };

  return syncButton;
}

function createTranslateButton(chunkedTranscript: any[]): HTMLElement {
  const translateButton = document.createElement("button");
  translateButton.className = "transcript-translate-button";
  translateButton.title = "Translate transcript to Urdu in ChatGPT";

  const translateIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  translateIconSvg.setAttribute("width", "20");
  translateIconSvg.setAttribute("height", "20");
  translateIconSvg.setAttribute("viewBox", "0 0 24 24");
  translateIconSvg.setAttribute("fill", "none");
  translateIconSvg.setAttribute("stroke", "currentColor");
  translateIconSvg.setAttribute("stroke-width", "2");
  translateIconSvg.setAttribute("stroke-linecap", "round");
  translateIconSvg.setAttribute("stroke-linejoin", "round");
  translateIconSvg.innerHTML = `
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  `;
  translateButton.appendChild(translateIconSvg);

  translateButton.style.cssText = `
    background: transparent;
    color: #8b5cf6;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  translateButton.onmouseover = () => {
    translateButton.style.background = "rgba(139, 92, 246, 0.1)";
    translateButton.style.color = "#7c3aed";
    translateButton.style.transform = "scale(1.1)";
  };
  translateButton.onmouseout = () => {
    translateButton.style.background = "transparent";
    translateButton.style.color = "#8b5cf6";
    translateButton.style.transform = "scale(1)";
  };

  translateButton.onclick = (e) => {
    e.stopPropagation();

    // Get video title
    const videoTitle = getVideoTitle();

    // Get video URL
    const videoUrl = window.location.href.split("&")[0];

    // Build transcript text
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    // Format with translation prompt from settings
    const prompt = settings.aiPrompts.translate;
    const completeText = `${prompt}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    // Show loading state
    translateButton.style.color = "#7c3aed";
    const svg = translateButton.querySelector("svg");
    if (svg) {
      svg.style.opacity = "0.5";
    }

    // Send message to background script with AI service selection
    chrome.runtime.sendMessage(
      {
        type: "",
        aiService: settings.aiService,
        content: completeText,
      },
      (response) => {
        // Reset button state
        if (svg) {
          svg.style.opacity = "1";
        }
        translateButton.style.color = "#8b5cf6";

        if (response && !response.success) {
          console.error("Failed to open AI service:", response.error);
        }
      },
    );
  };

  return translateButton;
}

function createSummaryButton(chunkedTranscript: any[]): HTMLElement {
  const summaryButton = document.createElement("button");
  summaryButton.className = "transcript-summary-button";
  summaryButton.title = "Summarize transcript in ChatGPT";

  const summaryIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  summaryIconSvg.setAttribute("width", "20");
  summaryIconSvg.setAttribute("height", "20");
  summaryIconSvg.setAttribute("viewBox", "0 0 24 24");
  summaryIconSvg.setAttribute("fill", "none");
  summaryIconSvg.setAttribute("stroke", "currentColor");
  summaryIconSvg.setAttribute("stroke-width", "2");
  summaryIconSvg.setAttribute("stroke-linecap", "round");
  summaryIconSvg.setAttribute("stroke-linejoin", "round");
  summaryIconSvg.innerHTML = `
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  `;
  summaryButton.appendChild(summaryIconSvg);

  summaryButton.style.cssText = `
    background: transparent;
    color: #f59e0b;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  summaryButton.onmouseover = () => {
    summaryButton.style.background = "rgba(245, 158, 11, 0.1)";
    summaryButton.style.color = "#d97706";
    summaryButton.style.transform = "scale(1.1)";
  };
  summaryButton.onmouseout = () => {
    summaryButton.style.background = "transparent";
    summaryButton.style.color = "#f59e0b";
    summaryButton.style.transform = "scale(1)";
  };

  summaryButton.onclick = (e) => {
    e.stopPropagation();

    // Get video title
    const videoTitle = getVideoTitle();

    // Get video URL
    const videoUrl = window.location.href.split("&")[0];

    // Build transcript text
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    // Format with summary prompt from settings
    const prompt = settings.aiPrompts.summarize;
    const completeText = `${prompt}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    // Show loading state
    summaryButton.style.color = "#d97706";
    const svg = summaryButton.querySelector("svg");
    if (svg) {
      svg.style.opacity = "0.5";
    }

    // Send message to background script with AI service selection
    chrome.runtime.sendMessage(
      {
        type: "OPEN_AI_SERVICE",
        aiService: settings.aiService,
        content: completeText,
      },
      (response) => {
        // Reset button state
        if (svg) {
          svg.style.opacity = "1";
        }
        summaryButton.style.color = "#f59e0b";

        if (response && !response.success) {
          console.error("Failed to open AI service:", response.error);
        }
      },
    );
  };

  return summaryButton;
}

function createVocabularyButton(chunkedTranscript: any[]): HTMLElement {
  const vocabularyButton = document.createElement("button");
  vocabularyButton.className = "transcript-vocabulary-button";
  vocabularyButton.title = "Find difficult words and create vocabulary table";

  const vocabularyIconSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  vocabularyIconSvg.setAttribute("width", "20");
  vocabularyIconSvg.setAttribute("height", "20");
  vocabularyIconSvg.setAttribute("viewBox", "0 0 24 24");
  vocabularyIconSvg.setAttribute("fill", "none");
  vocabularyIconSvg.setAttribute("stroke", "currentColor");
  vocabularyIconSvg.setAttribute("stroke-width", "2");
  vocabularyIconSvg.setAttribute("stroke-linecap", "round");
  vocabularyIconSvg.setAttribute("stroke-linejoin", "round");
  vocabularyIconSvg.innerHTML = `
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    <line x1="10" y1="8" x2="16" y2="8"></line>
    <line x1="10" y1="12" x2="16" y2="12"></line>
    <line x1="10" y1="16" x2="14" y2="16"></line>
  `;
  vocabularyButton.appendChild(vocabularyIconSvg);

  vocabularyButton.style.cssText = `
    background: transparent;
    color: #ec4899;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  `;

  vocabularyButton.onmouseover = () => {
    vocabularyButton.style.background = "rgba(236, 72, 153, 0.1)";
    vocabularyButton.style.color = "#db2777";
    vocabularyButton.style.transform = "scale(1.1)";
  };
  vocabularyButton.onmouseout = () => {
    vocabularyButton.style.background = "transparent";
    vocabularyButton.style.color = "#ec4899";
    vocabularyButton.style.transform = "scale(1)";
  };

  vocabularyButton.onclick = (e) => {
    e.stopPropagation();

    // Get video title
    const videoTitle = getVideoTitle();

    // Get video URL
    const videoUrl = window.location.href.split("&")[0];

    // Build transcript text
    const transcriptText = chunkedTranscript
      .map((chunk) => {
        const chunkTimestamp = formatTimestamp(chunk.start);
        const chunkText = chunk.lines.map((line: any) => line.text).join(" ");
        return `[${chunkTimestamp}] ${chunkText}`;
      })
      .join("\n\n");

    // Format with vocabulary prompt from settings
    const prompt = settings.aiPrompts.vocabulary;
    const completeText = `${prompt}\n\n${videoTitle}\n${videoUrl}\n\nTranscript:\n${transcriptText}`;

    // Show loading state
    vocabularyButton.style.color = "#db2777";
    const svg = vocabularyButton.querySelector("svg");
    if (svg) {
      svg.style.opacity = "0.5";
    }

    // Send message to background script with AI service selection
    chrome.runtime.sendMessage(
      {
        type: "OPEN_AI_SERVICE",
        aiService: settings.aiService,
        content: completeText,
      },
      (response) => {
        // Reset button state
        if (svg) {
          svg.style.opacity = "1";
        }
        vocabularyButton.style.color = "#ec4899";

        if (response && !response.success) {
          console.error("Failed to open AI service:", response.error);
        }
      },
    );
  };

  return vocabularyButton;
}

function setupHeaderToggle(header: HTMLElement, content: HTMLElement): void {
  header.onclick = () => {
    content.style.display = content.style.display === "none" ? "block" : "none";
    const arrow = header.querySelector(".transcript-arrow");
    if (arrow) {
      arrow.textContent = content.style.display === "none" ? "▼" : "▲";
    }
  };
}

function renderTranscriptChunks(
  chunkedTranscript: any[],
  content: HTMLElement,
): void {
  chunkedTranscript.forEach((chunk) => {
    const chunkHeader = createChunkHeader(chunk);
    content.appendChild(chunkHeader);

    const chunkParagraph = createChunkParagraph(chunk);
    content.appendChild(chunkParagraph);
  });
}

function createChunkHeader(chunk: any): HTMLElement {
  const chunkHeader = document.createElement("div");
  chunkHeader.className = "transcript-chunk-header";
  chunkHeader.style.cssText = `
    color: #2563eb;
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.4em;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    margin-bottom: 0.125rem;
    margin-top: 0.125rem;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    border-left: 3px solid #2563eb;
    display: inline-block;
    transition: all 0.2s ease;
  `;

  chunkHeader.onmouseover = function () {
    (this as HTMLElement).style.transform = "translateX(4px)";
  };
  chunkHeader.onmouseout = function () {
    (this as HTMLElement).style.transform = "translateX(0)";
  };

  chunkHeader.textContent = formatTimestamp(chunk.start);
  chunkHeader.onclick = () => {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = chunk.start;
    }
  };

  return chunkHeader;
}

function createChunkParagraph(chunk: any): HTMLElement {
  const paragraphEl = document.createElement("div");
  paragraphEl.className = "transcript-chunk-paragraph";

  const isCurrentlyDarkMode = isDarkMode();
  const textColor = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";

  paragraphEl.style.cssText = `
    margin-bottom: 0.1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    line-height: 1.8em;
    font-size: 15px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: ${textColor};
    text-align: justify;
    transition: all 0.3s ease;
  `;

  // Create spans for each line in the chunk
  chunk.lines.forEach((lineData: any, index: number) => {
    const span = document.createElement("span");
    span.className = "transcript-segment";
    span.dataset.start = lineData.start.toString();
    span.dataset.duration = lineData.duration.toString();
    span.textContent = lineData.text;
    span.style.cssText = `
      color: ${textColor};
      transition: all 0.2s ease;
      cursor: pointer;
    `;

    span.onclick = () => {
      const video = document.querySelector("video");
      if (video) {
        video.currentTime = lineData.start;
      }
    };

    paragraphEl.appendChild(span);

    // Add space between segments (but not after the last one)
    if (index < chunk.lines.length - 1) {
      paragraphEl.appendChild(document.createTextNode(" "));
    }
  });

  return paragraphEl;
}

// Not used anywhere
function createTranscriptLine(lineData: any): HTMLElement {
  const lineEl = document.createElement("div");
  lineEl.className = "transcript-line";
  lineEl.dataset.start = lineData.start.toString();
  lineEl.dataset.duration = lineData.duration.toString();
  lineEl.style.cssText = `
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    line-height: 1.6em;
  `;

  lineEl.onmouseover = function () {
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      document.querySelector("html")?.getAttribute("dark") !== null ||
      document.body.style.backgroundColor === "rgb(19, 19, 19)" ||
      document.body.style.backgroundColor === "#131313";

    if (!lineEl.classList.contains("active")) {
      lineEl.style.backgroundColor = isDarkMode
        ? "rgba(55, 65, 81, 0.5)"
        : "rgba(243, 244, 246, 0.8)";
    }
  };
  lineEl.onmouseout = function () {
    if (!lineEl.classList.contains("active")) {
      lineEl.style.backgroundColor = "transparent";
    }
  };

  const textEl = document.createElement("span");
  textEl.className = "transcript-text";
  textEl.textContent = lineData.text;
  textEl.style.cssText = `
    color: #1f2937;
    font-size: 15px;
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: color 0.3s ease;
    cursor: pointer;
    letter-spacing: 0.01em;
    user-select: text;
    display: block;
    word-wrap: break-word;
  `;

  lineEl.appendChild(textEl);
  return lineEl;
}

function isDarkMode(): boolean {
  const html = document.querySelector("html");
  if (html?.hasAttribute("dark")) return true;
  if (document.documentElement.classList.contains("dark")) return true;
  const bodyBg = document.body.style.backgroundColor;
  if (bodyBg === "rgb(19, 19, 19)" || bodyBg === "#131313") return true;
  if (html?.hasAttribute("light")) return false;
  return !!(
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyDarkModeStyles(
  isDark: boolean,
  container: HTMLElement,
  header: HTMLElement,
  content: HTMLElement,
): void {
  const isFullHeight = settings.removeWatchPageSuggestions;
  const maxHeight = isFullHeight ? "calc(100vh - 180px)" : "24rem";

  if (isDark) {
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(60, 60, 60, 0.6);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    `;
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid rgba(60, 60, 60, 0.6);
      cursor: pointer;
      background: rgba(30, 30, 30, 0.8);
      gap: 0.5rem;
    `;
    const title = header.querySelector(".transcript-title") as HTMLElement;
    if (title) {
      title.style.color = "#e5e7eb";
    }
    content.style.maxHeight = maxHeight;
  } else {
    container.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    `;
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid rgba(229, 231, 235, 0.6);
      cursor: pointer;
      background: rgba(249, 250, 251, 0.8);
      gap: 0.5rem;
    `;
    const title = header.querySelector(".transcript-title") as HTMLElement;
    if (title) {
      title.style.color = "#1f2937";
    }
    content.style.maxHeight = maxHeight;
  }
}

function setupDarkModeObserver(
  container: HTMLElement,
  header: HTMLElement,
  content: HTMLElement,
): void {
  const observer = new MutationObserver(() => {
    const currentDarkMode = isDarkMode();
    applyDarkModeStyles(currentDarkMode, container, header, content);

    // Update paragraph and segment colors
    const textColor = currentDarkMode ? "#e5e7eb" : "#1f2937";
    const paragraphs = content.querySelectorAll(".transcript-chunk-paragraph");
    paragraphs.forEach((p) => {
      const paragraphEl = p as HTMLElement;
      paragraphEl.style.color = textColor;
    });

    const segments = content.querySelectorAll(".transcript-segment");
    segments.forEach((s) => {
      const segmentEl = s as HTMLElement;
      if (!segmentEl.classList.contains("active")) {
        segmentEl.style.color = textColor;
      }
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  observer.observe(document.body, { attributes: true });

  // Also observe for style changes on body
  const bodyObserver = new MutationObserver(() => {
    const currentDarkMode = isDarkMode();
    applyDarkModeStyles(currentDarkMode, container, header, content);
  });
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
  });

  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const currentDarkMode = isDarkMode();
      applyDarkModeStyles(currentDarkMode, container, header, content);
      const textColor = currentDarkMode ? "#e5e7eb" : "#1f2937";
      content.querySelectorAll(".transcript-chunk-paragraph").forEach((p) => {
        (p as HTMLElement).style.color = textColor;
      });
      content.querySelectorAll(".transcript-segment").forEach((s) => {
        const el = s as HTMLElement;
        if (!el.classList.contains("active")) el.style.color = textColor;
      });
    };
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange);
  }
}

function setupVideoTimeTracking(content: HTMLElement): void {
  let isUserScrolling = false;
  let scrollTimeout: number;

  content.addEventListener("scroll", () => {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      isUserScrolling = false;
    }, 3000);
  });

  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", () => {
      const currentTime = video.currentTime;
      const segments = content.querySelectorAll(".transcript-segment");
      const isCurrentlyDarkMode = isDarkMode();

      let activeSegment: HTMLElement | null = null;

      segments.forEach((segment) => {
        const segmentEl = segment as HTMLElement;
        const start = parseFloat(segmentEl.dataset.start || "0");
        const duration = parseFloat(segmentEl.dataset.duration || "2");
        const end = start + duration;

        if (currentTime >= start && currentTime < end) {
          segmentEl.classList.add("active");
          activeSegment = segmentEl;

          // Highlight the active segment
          segmentEl.style.cssText = `
            background-color: ${
              isCurrentlyDarkMode
                ? "rgba(59, 130, 246, 0.4)"
                : "rgba(59, 130, 246, 0.25)"
            };
            color: ${isCurrentlyDarkMode ? "#93c5fd" : "#1e40af"};
            font-weight: 600;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            transition: all 0.2s ease;
            cursor: pointer;
          `;
        } else {
          segmentEl.classList.remove("active");
          const inactiveTextColor = isCurrentlyDarkMode ? "#e5e7eb" : "#1f2937";
          segmentEl.style.cssText = `
            color: ${inactiveTextColor};
            transition: all 0.2s ease;
            cursor: pointer;
          `;
        }
      });

      // Auto-scroll to active segment
      if (activeSegment && !isUserScrolling) {
        const segmentTop = activeSegment.getBoundingClientRect().top;
        const contentTop = content.getBoundingClientRect().top;
        const relativeTop = segmentTop - contentTop + content.scrollTop;
        const containerHeight = content.clientHeight;
        const scrollPosition = relativeTop - containerHeight / 2;
        content.scrollTo({ top: scrollPosition, behavior: "smooth" });
      }
    });
  }
}
