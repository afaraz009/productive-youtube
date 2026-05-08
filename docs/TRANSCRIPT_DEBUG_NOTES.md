# Transcript Feature Debug Notes

## Problem Summary
The transcript feature stopped working. When a YouTube video is loaded, the transcript card no longer appears in the sidebar.

## Root Cause Analysis

### Issue 1: Content Script Isolation
Content scripts run in an isolated world and **cannot directly access `window.ytInitialPlayerResponse`** - a page-level JavaScript variable that contains video metadata including caption track URLs.

**What we found:**
- `window.ytInitialPlayerResponse` exists on the page and contains captions data
- But the content script sees it as `undefined` due to Chrome's content script isolation
- The extension was checking `window.ytInitialPlayerResponse` directly, which always fails

### Issue 2: YouTube API Returns Empty Transcript
When falling back to YouTube's player API (`/youtubei/v1/player`), the response **does not include caption data** when called from an extension context.

**What we found:**
- API call returns `200 OK` but `captions` field is missing or empty
- The same API call from the page context (with cookies/auth) includes captions
- YouTube likely requires specific authentication context to return captions

### Issue 3: Timedtext URL Returns Empty Response
Even when we successfully extract the transcript URL from `ytInitialPlayerResponse`, fetching it returns **empty content**.

**What we found:**
- URL format: `https://www.youtube.com/api/timedtext?v={videoId}&...&signature=...`
- Response: `200 OK`, `Content-Type: text/html`, `Content-Length: 0`
- Tried multiple `fmt` parameters (`srv1`, `srv2`, `srv3`, `json3`, `ttml`, `vtt`) - all return empty
- Tried with `credentials: 'include'` - still empty
- Tried via background service worker - still empty
- This appears to be a YouTube API change that blocks transcript fetching from extensions

## Solutions Attempted

### Solution 1: Extract from Script Tags (Partially Working)
Instead of accessing `window.ytInitialPlayerResponse` directly, parse the HTML script tags to extract the JSON.

**Implementation in `src/scripts/transcript/api.ts`:**
```typescript
export function getPlayerResponseFromPage(): Promise<any> {
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const content = script.textContent || '';
    const markers = [
      'var ytInitialPlayerResponse = ',
      'ytInitialPlayerResponse = ',
    ];
    for (const marker of markers) {
      const markerIndex = content.indexOf(marker);
      if (markerIndex !== -1) {
        const jsonStartIndex = content.indexOf('{', markerIndex + marker.length);
        const jsonStr = extractCompleteJson(content, jsonStartIndex);
        // Parse and return...
      }
    }
  }
}
```

**Status:** Works intermittently. Sometimes the script tags don't contain `ytInitialPlayerResponse` (possibly due to YouTube's dynamic loading).

### Solution 2: Background Script Fetch
Route the transcript URL fetch through the background service worker to bypass CORS restrictions.

**Implementation in `src/background.ts`:**
```typescript
if (request.type === "FETCH_TRANSCRIPT") {
  const response = await fetch(request.url);
  const text = await response.text();
  return { success: true, data: text };
}
```

**Status:** Does not work - YouTube returns empty response regardless of fetch context.

### Solution 3: DOM Scraping Fallback
Click YouTube's native "Show transcript" button and scrape the transcript from the DOM.

**Implementation in `src/scripts/transcript/api.ts`:**
```typescript
export async function scrapeTranscriptFromDOM() {
  await findAndClickTranscriptButton();
  await new Promise(resolve => setTimeout(resolve, 1500));
  const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
  // Extract timestamp and text from each segment...
}
```

**Status:** Partially working. Issues:
- Description needs to be expanded first to reveal "Show transcript" button
- Multiple selectors tried for expand button
- Button detection is fragile due to YouTube's complex DOM structure

## Current Code State

### Files Modified:
1. **`src/scripts/transcript/api.ts`**
   - Added `getPlayerResponseFromPage()` - extracts player response from script tags
   - Added `scrapeTranscriptFromDOM()` - DOM scraping fallback
   - Added `findAndClickTranscriptButton()` - finds and clicks transcript button
   - Modified `fetchTranscriptXml()` - uses background script for fetch

2. **`src/scripts/transcript/index.ts`**
   - Updated to use `getPlayerResponseFromPage()` as primary method
   - Added DOM scraping as fallback when XML fetch fails

3. **`src/background.ts`**
   - Added `FETCH_TRANSCRIPT` message handler

## Key Observations

### YouTube's Transcript Panel Works
When manually clicking "Show transcript" in the description, YouTube successfully loads and displays the transcript. This means:
- The transcript data IS available
- YouTube has internal methods to fetch it that work
- The extension just can't access them the same way

### Network Requests
When YouTube's transcript panel opens, we could not capture the network request it makes (started monitoring after it loaded). The transcript might be:
- Pre-loaded in the initial page data
- Fetched via a different endpoint
- Using WebSocket or other non-standard transport

## Recommended Next Steps

### Option A: Improve DOM Scraping (Most Promising)
1. Fix the description expand logic - try clicking the description area directly
2. Use MutationObserver to wait for transcript panel to appear
3. Handle various YouTube layouts (theater mode, fullscreen, etc.)

### Option B: Inject Script into Main World
Use Chrome's `world: "MAIN"` option in manifest to run code in the page context:
```json
"content_scripts": [{
  "matches": ["*://*.youtube.com/*"],
  "js": ["content_script.js"],
  "world": "MAIN"
}]
```
This would allow direct access to `window.ytInitialPlayerResponse` but has security implications.

### Option C: Use YouTube's Internal API
Research how YouTube's transcript panel fetches data:
- Check for `get_transcript` endpoint parameters
- Look for authentication tokens in requests
- Reverse engineer the exact request format

### Option D: Alternative Transcript Sources
Consider using third-party transcript APIs that may have figured out YouTube's current requirements.

## Test Video
Use this video for testing: https://www.youtube.com/watch?v=V4liZGKva8g
- Has auto-generated English captions
- "Show transcript" button is available in description

## Console Log Patterns to Watch

**Success indicators:**
- `Successfully extracted player response from script tag`
- `Has captions: true`
- `Caption tracks available: X`
- `Transcript URL found, fetching XML...`
- `SUCCESS - Got transcript with X entries`

**Failure indicators:**
- `Could not find ytInitialPlayerResponse in page scripts`
- `No caption tracks found in player response`
- `Empty transcript response from YouTube`
- `Could not find or click transcript button`
- `No transcript segments found in DOM`

## Environment
- Chrome Extension Manifest V3
- Vite build system
- TypeScript
- The extension ID: `dhlcpamognmaojpjlghgpdndbfbdjgag`
