// API functions for fetching transcript data

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

export async function fetchPlayerApi(
  videoId: string,
  apiKey: string
): Promise<any> {
  console.log("Productive YouTube: Fetching player API response...");
  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    if (!text) {
      throw new Error("Empty transcript response");
    }
    return text;
  } catch (error) {
    console.error("Productive YouTube: Error fetching transcript XML:", error);
    throw error;
  }
}
