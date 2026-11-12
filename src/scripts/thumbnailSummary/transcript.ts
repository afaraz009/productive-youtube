// Fetch a plain-text transcript for ANY video id (not just the one being watched),
// reusing the same ANDROID Innertube pipeline as the watch-page transcript panel.

import {
  extractApiKey,
  extractApiKeyFromDOM,
  fetchPlayerApi,
  fetchTranscriptXml,
  fetchVideoPage,
  extractTranscriptUrl,
} from "../transcript/api"; //fetch transcript XML from YouTube's API
import { parseTranscript } from "../transcript/parser";
import { cleanTranscriptText, formatTimestamp } from "../transcript/utils";

const BLOCK_SECONDS = 60;

// INNERTUBE_API_KEY is the same for every video, so scan the page for it only once
let cachedApiKey: string | null = null;

export interface VideoTranscript {
  text: string;
  title: string;
  channel: string;
}
//Retrieve the API key needed to access YouTube's transcript data. It first checks if the API key is already cached; if so, it returns that cached key. If not, it attempts to extract the API key from the DOM of the current page. If that fails, it fetches the video page and extracts the API key from there. The function returns a Promise that resolves to the API key or null if it cannot be found.
async function getApiKey(videoId: string): Promise<string | null> {
  if (cachedApiKey) return cachedApiKey;
  cachedApiKey = extractApiKeyFromDOM();
  if (!cachedApiKey) {
    cachedApiKey = extractApiKey(await fetchVideoPage(videoId));
  }
  return cachedApiKey;
}

/**
 * Returns the transcript as compact text with a [mm:ss] marker every minute,
 * or null when the video has no captions.
 */
export async function fetchVideoTranscriptText(
  videoId: string
): Promise<VideoTranscript | null> {
  const apiKey = await getApiKey(videoId);
  if (!apiKey) throw new Error("Couldn't read YouTube's API key from the page");

  const player = await fetchPlayerApi(videoId, apiKey);
  const title: string = player?.videoDetails?.title || "";
  const channel: string = player?.videoDetails?.author || "";

  const url = extractTranscriptUrl(player);
  if (!url) return null;
  //entries are the individual transcript entries fetched from YouTube's API, each containing a start time and the corresponding text. The parseTranscript function processes the raw XML transcript data into a structured format that can be easily manipulated and displayed.
  const entries = parseTranscript(await fetchTranscriptXml(url));
  if (entries.length === 0) return null;
  //purpose of blocks is to group transcript entries into blocks of text that correspond to one-minute intervals of the video. Each block starts with a timestamp indicating the start time of that block, followed by the concatenated transcript text for that minute. This makes it easier to read and reference specific parts of the transcript based on time.
  const blocks: string[] = [];
  let blockStart = -1;
  let blockText: string[] = [];

  const flush = () => {
    if (blockText.length > 0) {
      blocks.push(`[${formatTimestamp(blockStart)}] ${blockText.join(" ")}`);
    }
  };

  for (const entry of entries) {
    const text = cleanTranscriptText(entry.text);
    if (!text) continue;
    const start = Math.floor(entry.start / BLOCK_SECONDS) * BLOCK_SECONDS;
    if (start !== blockStart) {
      flush();
      blockStart = start;
      blockText = [];
    }
    blockText.push(text);
  }
  flush();

  const text = blocks.join("\n");
  return text ? { text, title, channel } : null;
}
