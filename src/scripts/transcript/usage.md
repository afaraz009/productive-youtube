``` typescript
button.addEventListener("click", () => {
  if (!selectedRange) return;

  const videoId = new URL(window.location.href).searchParams.get("v");

  if (!videoId) {
    alert("Could not identify this video.");
    return;
  }

  const note = {
    videoId,
    videoTitle: getVideoTitle(),
    startTime: selectedRange.startTime,
    endTime: selectedRange.endTime,
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
        endSegmentStart: note.endSegmentStart,
        startOffset: note.startOffset,
        endOffset: note.endOffset,
      };

      // Keep all previous ranges and add the new one.
      activeSavedNoteRanges.push(newRange);

      // Rebuild all highlights, but scroll to the newly saved note.
      addSavedNoteStyles();

      // Pass the active ranges array to highlight all notes
      // and the newly created note to determine which one to scroll to.
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
```