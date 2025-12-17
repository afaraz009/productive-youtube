import { settings } from "../settings";
import { getVideoId } from "./utils";
import {
  fetchVideoPage,
  extractApiKey,
  fetchPlayerApi,
  extractTranscriptUrl,
  fetchTranscriptXml,
} from "./api";
import { parseTranscript } from "./parser";
import { displayTranscript } from "./display";

export async function showVideoTranscript(): Promise<void> {
  console.log(
    "Productive YouTube: showVideoTranscript called, showTranscript setting:",
    settings.showTranscript
  );

  if (!settings.showTranscript) {
    const existingContainer = document.getElementById("transcript-container");
    if (existingContainer) {
      existingContainer.remove();
      console.log("Productive YouTube: Transcript container removed");
    }
    return;
  }

  try {
    console.log("Productive YouTube: Starting transcript fetch process...");

    const videoId = getVideoId();
    if (!videoId) {
      console.warn("Productive YouTube: Could not get video ID");
      return;
    }
    console.log("Productive YouTube: Video ID found:", videoId);

    // Wait a bit for YouTube to load the player response, then try again
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // First, try to use the existing player response on the page
    let playerApiResponse = null;

    // @ts-ignore
    if (window.ytInitialPlayerResponse) {
      // @ts-ignore
      playerApiResponse = window.ytInitialPlayerResponse;
      console.log(
        "Productive YouTube: Using ytInitialPlayerResponse from page"
      );
      // Debug: log the captions structure
      if (playerApiResponse?.captions) {
        const captionCount =
          playerApiResponse.captions.playerCaptionsTracklistRenderer
            ?.captionTracks?.length || 0;
        console.log(
          "Productive YouTube: Caption tracks available:",
          captionCount
        );
      } else {
        console.log(
          "Productive YouTube: No captions object in player response"
        );
      }
    } else {
      console.log(
        "Productive YouTube: ytInitialPlayerResponse not found on page, fetching from API"
      );
      try {
        // If not available on page, fetch it
        const videoPageHtml = await fetchVideoPage(videoId);
        const apiKey = extractApiKey(videoPageHtml);
        if (!apiKey) {
          console.warn(
            "Productive YouTube: Could not extract API key from video page"
          );
          return;
        }

        playerApiResponse = await fetchPlayerApi(videoId, apiKey);
        console.log(
          "Productive YouTube: Fetched player response from API successfully"
        );
      } catch (fetchError) {
        console.error(
          "Productive YouTube: Failed to fetch from API:",
          fetchError
        );
        return;
      }
    }

    if (!playerApiResponse) {
      console.warn("Productive YouTube: No player API response received");
      return;
    }

    console.log("Productive YouTube: Attempting to extract transcript URL...");
    const transcriptUrl = extractTranscriptUrl(playerApiResponse);
    if (!transcriptUrl) {
      console.warn(
        "Productive YouTube: Could not extract transcript URL - this video may not have captions available"
      );
      return;
    }

    console.log("Productive YouTube: Transcript URL found, fetching XML...");
    const transcriptXml = await fetchTranscriptXml(transcriptUrl);
    const transcript = parseTranscript(transcriptXml);

    if (!transcript || transcript.length === 0) {
      console.warn("Productive YouTube: No transcript content parsed");
      return;
    }

    console.log(
      "Productive YouTube: SUCCESS - Parsed transcript with",
      transcript.length,
      "entries, displaying..."
    );
    displayTranscript(transcript);
  } catch (error) {
    console.error("Productive YouTube: Error showing video transcript:", error);
  }
}

// Re-export utils for convenience
export { getVideoId, isWatchPage, isHomePage } from "./utils";
