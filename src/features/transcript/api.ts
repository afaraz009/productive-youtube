// API functions for fetching transcript data

/**
 * Extract ytInitialPlayerResponse from page script tags.
 * Content scripts can't access window.ytInitialPlayerResponse directly
 * due to Chrome's isolated world, but they CAN read script tag innerHTML.
 */
export function extractPlayerResponseFromScripts(videoId: string): any | null {
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const content = script.textContent || "";
    const markers = [
      "var ytInitialPlayerResponse = ",
      "ytInitialPlayerResponse = ",
    ];
    for (const marker of markers) {
      const markerIndex = content.indexOf(marker);
      if (markerIndex === -1) continue;

      const jsonStartIndex = content.indexOf("{", markerIndex + marker.length);
      if (jsonStartIndex === -1) continue;

      try {
        const jsonStr = extractCompleteJson(content, jsonStartIndex);
        if (!jsonStr) continue;

        const parsed = JSON.parse(jsonStr);
        // Verify it matches the current video
        if (parsed?.videoDetails?.videoId === videoId) {
          console.log(
            "Productive YouTube: Successfully extracted player response from script tag"
          );
          return parsed;
        }
      } catch {
        // JSON parse failed, try next marker
      }
    }
  }
  return null;
}

/** Extract a complete JSON object from a string starting at the given index */
function extractCompleteJson(content: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        return content.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

export async function fetchVideoPage(videoId: string): Promise<string> {
  console.log(`Fetching video page for video ID: ${videoId}`);
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  console.log(
    "fetch youtube video response is -------------------------------",
    response
  );
  return response.text();
}

export function extractApiKey(html: string): string | null {
  const match = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (match && match[1]) {
    console.log("Productive YouTube: API key extracted successfully");
    return match[1];
  }
  console.warn(
    "Productive YouTube: Could not extract API key from video page HTML"
  );
  return null;
}

export function extractApiKeyFromDOM(): string | null {
  console.log("Productive YouTube: Attempting to extract API key from live DOM...");

  // Try to find API key in script tags
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const content = script.textContent || script.innerHTML;
    const match = content.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    if (match && match[1]) {
      console.log("Productive YouTube: API key extracted from DOM successfully");
      return match[1];
    }
  }

  console.warn("Productive YouTube: Could not extract API key from DOM");
  return null;
}

export async function fetchPlayerApi(
  videoId: string,
  apiKey: string
): Promise<any> {
  console.log("Productive YouTube: Fetching player API response...");
  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
          },
        },
        videoId: videoId,
      }),
    }
  );
  if (!response.ok) {
    console.error(
      "Productive YouTube: Player API HTTP error:",
      response.status
    );
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log(
    "Productive YouTube: Player API response received, has captions:",
    !!data?.captions
  );
  return data;
}

export function extractTranscriptUrl(playerApiResponse: any): string | null {
  console.log("Productive YouTube: Extracting transcript URL...");
  const captionTracks =
    playerApiResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    console.warn(
      "Productive YouTube: No caption tracks found in player response"
    );
    return null;
  }

  console.log(
    `Productive YouTube: Found ${captionTracks.length} caption track(s)`
  );

  // Log all available languages for debugging
  captionTracks.forEach((track: any, index: number) => {
    console.log(
      `Track ${index + 1}: ${track.languageCode || "unknown"} - ${
        track.name?.simpleText || "unknown name"
      }`
    );
  });

  // Priority 1: Try to find English caption track (en, en-US, en-GB, etc.)
  let transcriptTrack = captionTracks.find(
    (track: any) =>
      track.baseUrl &&
      track.languageCode &&
      track.languageCode.toLowerCase().startsWith("en")
  );

  // Priority 2: If no English track, try to find auto-generated English
  if (!transcriptTrack) {
    transcriptTrack = captionTracks.find(
      (track: any) =>
        track.baseUrl &&
        track.name?.simpleText &&
        (track.name.simpleText.toLowerCase().includes("english") ||
          track.name.simpleText.toLowerCase().includes("auto-generated"))
    );
  }

  // Priority 3: If still no English track, use any available track with baseUrl
  if (!transcriptTrack) {
    transcriptTrack = captionTracks.find((track: any) => track.baseUrl);
  }

  // Priority 4: Last resort - use first track
  if (!transcriptTrack && captionTracks.length > 0) {
    transcriptTrack = captionTracks[0];
  }

  if (!transcriptTrack || !transcriptTrack.baseUrl) {
    console.warn(
      "Productive YouTube: Could not find caption track with baseUrl"
    );
    return null;
  }

  console.log(
    "Productive YouTube: Selected caption track:",
    transcriptTrack.languageCode || "unknown language",
    "-",
    transcriptTrack.name?.simpleText || "no name"
  );
  return transcriptTrack.baseUrl;
}

export async function fetchTranscriptXml(url: string): Promise<string> {
  try {
    // Route through background script to use proper User-Agent and avoid CORS
    const response = await new Promise<{ success: boolean; data?: string; error?: string }>(
      (resolve) => {
        chrome.runtime.sendMessage(
          { type: "FETCH_TRANSCRIPT", url },
          (resp) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(resp);
            }
          }
        );
      }
    );

    if (!response.success || !response.data) {
      console.warn(
        "Productive YouTube: Background fetch failed, trying direct fetch...",
        response.error
      );
      // Fallback to direct fetch
      const directResponse = await fetch(url);
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`);
      }
      const text = await directResponse.text();
      if (!text) {
        throw new Error("Empty transcript response from direct fetch");
      }
      return text;
    }

    return response.data;
  } catch (error) {
    console.error("Productive YouTube: Error fetching transcript XML:", error);
    throw error;
  }
}
