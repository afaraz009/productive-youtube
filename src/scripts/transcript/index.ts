import { settings } from "../settings";
import { getVideoId } from "./utils";
import {
  fetchVideoPage,
  extractApiKey,
  extractApiKeyFromDOM,
  fetchPlayerApi,
  extractTranscriptUrl,
  fetchTranscriptXml,
} from "./api";
import { parseTranscript } from "./parser";
import { displayTranscript } from "./display";
import {
  waitForYouTubePlayerReady,
  waitForSecondarySidebar,
  retryWithBackoff,
} from "./domUtils";

// Track the current video ID to detect video changes
let currentVideoId: string | null = null;

// Clean up transcript containers when leaving watch page
export function cleanupTranscript(): void {
  const existingContainer = document.getElementById("transcript-container");
  const fixedWrapper = document.getElementById("transcript-fixed-wrapper");
  if (existingContainer) {
    existingContainer.remove();
    console.log("Productive YouTube: Transcript container removed");
  }
  if (fixedWrapper) {
    fixedWrapper.remove();
    console.log("Productive YouTube: Fixed wrapper removed");
  }
  currentVideoId = null;
}

export async function showVideoTranscript(): Promise<void> {
  console.log(
    "Productive YouTube: showVideoTranscript called, showTranscript setting:",
    settings.showTranscript
  );

  // Check if we're on a watch page
  if (!window.location.pathname.includes('/watch')) {
    console.log("Productive YouTube: Not on watch page, cleaning up");
    cleanupTranscript();
    return;
  }

  if (!settings.showTranscript) {
    cleanupTranscript();
    return;
  }

  // Use retry logic to handle timing issues
  const result = await retryWithBackoff(
    async () => await fetchAndDisplayTranscript(),
    2, // Max 2 retries (3 total attempts)
    500 // Start with 500ms delay
  );

  if (!result) {
    console.error(
      "Productive YouTube: Failed to show transcript after multiple attempts"
    );
  }
}

async function fetchAndDisplayTranscript(): Promise<boolean> {
  try {
    console.log("Productive YouTube: Starting transcript fetch process...");

    const videoId = getVideoId();
    if (!videoId) {
      console.warn("Productive YouTube: Could not get video ID");
      return false;
    }
    console.log("Productive YouTube: Video ID found:", videoId);

    // Check if video has changed - if so, remove old transcript
    if (currentVideoId !== videoId) {
      console.log(
        "Productive YouTube: Video changed from",
        currentVideoId,
        "to",
        videoId,
        "- clearing old transcript"
      );
      const existingContainer = document.getElementById("transcript-container");
      if (existingContainer) {
        existingContainer.remove();
        console.log("Productive YouTube: Old transcript container removed");
      }
      currentVideoId = videoId;
    }

    // CRITICAL FIX 1: Wait for YouTube's player to be ready
    console.log("Productive YouTube: Waiting for YouTube player to be ready...");
    const playerReady = await waitForYouTubePlayerReady(5000);

    // Don't fail if player check times out - continue anyway
    if (!playerReady) {
      console.warn(
        "Productive YouTube: Player ready check timed out, but continuing anyway..."
      );
    }

    // CRITICAL FIX 2: Wait for secondary sidebar to exist before we try to display
    console.log(
      "Productive YouTube: Waiting for secondary sidebar container..."
    );
    const sidebar = await waitForSecondarySidebar(8000);
    if (!sidebar) {
      console.warn(
        "Productive YouTube: Secondary sidebar not found, will retry..."
      );
      throw new Error("Sidebar not available");
    }
    console.log("Productive YouTube: Secondary sidebar is ready");

    // First, try to use the existing player response on the page
    let playerApiResponse = null;

    // @ts-ignore
    const ytResponse = window.ytInitialPlayerResponse;

    // Check if ytInitialPlayerResponse exists AND matches the current video
    const responseVideoId = ytResponse?.videoDetails?.videoId;

    if (ytResponse && responseVideoId === videoId) {
      playerApiResponse = ytResponse;
      console.log(
        "Productive YouTube: Using ytInitialPlayerResponse from page (video ID matches)"
      );
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
      if (ytResponse && responseVideoId !== videoId) {
        console.log(
          "Productive YouTube: ytInitialPlayerResponse contains stale data (expected:",
          videoId,
          "got:",
          responseVideoId,
          "), fetching from API"
        );
      } else {
        console.log(
          "Productive YouTube: ytInitialPlayerResponse not found on page, fetching from API"
        );
      }

      try {
        // CRITICAL FIX 3: Try to extract API key from live DOM first
        let apiKey = extractApiKeyFromDOM();

        // Fallback to fetching if DOM extraction fails
        if (!apiKey) {
          console.log(
            "Productive YouTube: API key not in DOM, fetching video page..."
          );
          const videoPageHtml = await fetchVideoPage(videoId);
          apiKey = extractApiKey(videoPageHtml);
        }

        if (!apiKey) {
          console.warn(
            "Productive YouTube: Could not extract API key from DOM or video page"
          );
          throw new Error("No API key available");
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
        throw fetchError;
      }
    }

    if (!playerApiResponse) {
      console.warn("Productive YouTube: No player API response received");
      throw new Error("No player response");
    }

    console.log("Productive YouTube: Attempting to extract transcript URL...");
    const transcriptUrl = extractTranscriptUrl(playerApiResponse);
    if (!transcriptUrl) {
      console.warn(
        "Productive YouTube: Could not extract transcript URL - this video may not have captions available"
      );
      // This is not a retry-able error - video genuinely has no captions
      return true; // Return true to stop retrying
    }

    console.log("Productive YouTube: Transcript URL found, fetching XML...");
    const transcriptXml = await fetchTranscriptXml(transcriptUrl);
    const transcript = parseTranscript(transcriptXml);

    if (!transcript || transcript.length === 0) {
      console.warn("Productive YouTube: No transcript content parsed");
      return true; // Return true to stop retrying
    }

    console.log(
      "Productive YouTube: SUCCESS - Parsed transcript with",
      transcript.length,
      "entries, displaying..."
    );
    displayTranscript(transcript);
    return true; // Success!
  } catch (error) {
    console.error(
      "Productive YouTube: Error in fetchAndDisplayTranscript:",
      error
    );
    throw error; // Propagate error to trigger retry
  }
}

// Re-export utils for convenience
export { getVideoId, isWatchPage, isHomePage } from "./utils";
