import { settings } from "../settings";
import { closeAllSummaryCards } from "../thumbnailSummary";
import { SummaryCard } from "../thumbnailSummary/card";
import { fetchVideoTranscriptText } from "../thumbnailSummary/transcript";



// function to place the article posts button
export function placeArticlePostsButton() {
  if (!settings.showArticlePosts) return;
  // Implementation for placing the button
  // ...
}

    
//Load the summary. First use cached summary if available. If not, it fetches the video transcript and generates a new summary using Gemini. The function handles errors and updates the card's UI accordingly.
export async function loadSummary(card: SummaryCard, force: boolean): Promise<void> {
  try {
    //forece  -> force generating a new summary, bypassing cache. If force is false, we first check for a cached summary. If found, we render it and return early.
    if (!force) {
      const cached = await chrome.runtime.sendMessage({ type: "GET_THUMBNAIL_SUMMARY", videoId: card.videoId });
      if (card.closed) return;
      if (cached.success && cached.data) {
        card.renderSummary(cached.data);
        return;
      }
    }

    card.renderLoading("Reading transcript…");
    const transcript = await fetchVideoTranscriptText(card.videoId);
    if (card.closed) return;
    if (!transcript) {
      card.renderError("This video has no captions, so there's nothing to summarize.", false);
      return;
    }
    card.setTitle(transcript.title);

    card.renderLoading("Summarizing with Gemini…");
    const result = await chrome.runtime.sendMessage({
      type: "GENERATE_THUMBNAIL_SUMMARY",
      videoId: card.videoId,
      title: transcript.title || card.title,
      channel: transcript.channel,
      transcript: transcript.text,
    });
    if (card.closed) return;

    if (result.success && result.data) {
      card.renderSummary(result.data);
    } else {
      card.renderError(result.error || "Couldn't generate a summary.", true);
    }
  } catch (error) {
    if (card.closed) return;
    card.renderError(
      error instanceof Error ? error.message : "Couldn't generate a summary.",
      true
    );
  }
}

export function applyThumbnailSummarySetting(): void {
  //if the thumbnail summary setting is disabled
  if (!settings.thumbnailSummary) closeAllSummaryCards();
}