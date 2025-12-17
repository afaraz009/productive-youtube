import { TranslationResponse } from "../types";

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, TranslationResponse>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (HF has generous limits)

// Call Hugging Face API for translation via background service worker
export async function translateWithAI(text: string): Promise<TranslationResponse> {
  // Check cache first
  if (translationCache.has(text)) {
    console.log("Using cached translation for:", text);
    return translationCache.get(text)!;
  }

  // Rate limiting: wait if last request was too recent
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  // Send message to background service worker to handle API call (bypasses CORS)
  // No API key needed - using free OpenRouter model
  const response = await chrome.runtime.sendMessage({
    type: "TRANSLATE_TEXT",
    text: text,
  });

  if (!response.success) {
    throw new Error(response.error || "Translation failed");
  }

  const result = response.data;

  // Cache the successful result
  translationCache.set(text, result);

  // Limit cache size to 50 entries
  if (translationCache.size > 50) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }

  return result;
}
