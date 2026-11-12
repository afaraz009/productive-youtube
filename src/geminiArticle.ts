// Article generation via the Gemini API (runs in the background service worker only).
// Imported only by background.ts so Vite inlines it there (no shared chunk with the content script).

import type { ThumbnailSummary, ThumbnailSummaryResponse } from "./scripts/types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const CACHE_KEY = "articleCache";
const CACHE_LIMIT = 200;
const MAX_TRANSCRIPT_CHARS = 300_000;

// Bump when ARTICLE_PROMPT changes so cached articles are regenerated
const ARTICLE_PROMPT_VERSION = 1;

const ARTICLE_PROMPT = `You turn a YouTube video transcript into a well-written blog article that fully replaces watching the video.

The transcript has a [mm:ss] marker at the start of each minute. Title and channel are given above it.

Return JSON matching the schema:
- "title": a clear, specific headline, max 12 words. Not clickbait, not a copy of the video title if that title is vague.
- "dek": one sentence, max 30 words, stating the article's core takeaway or answer.
- "sections": the article body, following the video's logical structure (not one section per minute).
  - "heading": 2-6 words, specific to the content ("Why mercury lost all resistance", not "Discovery").
  - "startSeconds": where this part begins in the video, taken from the nearest [mm:ss] marker before it, converted to seconds.
  - "paragraphs": 1-4 paragraphs of 2-5 sentences each.
  - "bullets": optional. Use ONLY for real lists in the video: steps, ingredients, tools, ranked items, pros/cons. Otherwise [].
- "takeaways": 3-6 short sentences with the most important, actionable or surprising points. No repetition of the dek.

Writing:
- Write as an article, not a recap of a video. State ideas directly ("The bowline holds because..."), not "In this video, the speaker explains...".
- Attribute opinions, predictions and disputed claims to the creator by channel name ("Veritasium argues..."). State facts and demonstrations plainly.
- Plain, concrete, confident prose. Short sentences. No filler, hype, rhetorical questions or "In conclusion".
- Keep every specific: numbers, names, dates, units, prices, step order, comparisons and the reasons behind each verdict or recommendation.
- Turn spoken habits into written ones: drop "um", "you know", repetition, self-corrections and asides to the camera.
- Visual-only moments ("as you can see here"): describe what is being shown if the transcript makes it clear; otherwise skip it.
- Plain text only: no Markdown, asterisks, headings syntax, emoji or HTML.

Coverage:
- Walk the transcript start to end. Every substantive idea, claim, step, example that makes a point, caveat and conclusion must appear, including figures from the opening and limits or timelines near the end.
- Length follows content density: roughly a quarter to a third of the transcript's word count, at least 250 words, at most about 2,500.
- Skip sponsors, ads, merch, self-promotion, greetings, subscribe requests, teasers for other videos and tangents with no takeaway.

Songs, music videos, poems, ambience: never quote or list lyrics. Write one short section describing the artist, genre and theme; "takeaways" = [].

Accuracy: use only the transcript; never add outside facts, context or opinions. If the transcript is garbled or too short to support a point, leave the point out. Write in English, whatever the transcript's language.`;

const ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          startSeconds: { type: "integer" },
          paragraphs: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["heading", "startSeconds", "paragraphs"],
      },
    },
    takeaways: { type: "array", items: { type: "string" } },
  },
  required: ["title", "dek", "sections", "takeaways"],
};

interface CacheEntry {
  summary: ThumbnailSummary;
  model: string;
  createdAt: number;
  promptVersion?: number;
}

type SummaryCache = Record<string, CacheEntry>;

export interface GenerateSummaryRequest {
  videoId: string;
  title: string;
  channel?: string;
  transcript: string;
}

async function readCache(): Promise<SummaryCache> {
  const result = await chrome.storage.local.get(CACHE_KEY);
  return (result[CACHE_KEY] as SummaryCache | undefined) || {};
}

export async function getCachedArticle(
  videoId: string
): Promise<ThumbnailSummaryResponse> {
  const cache = await readCache();
  const entry = cache[videoId];
  const fresh = !!entry && entry.promptVersion === ARTICLE_PROMPT_VERSION;
  return { success: true, data: fresh ? entry.summary : null, cached: fresh };
}

async function writeCache(videoId: string, entry: CacheEntry): Promise<void> {
  const cache = await readCache();
  cache[videoId] = entry;

  const ids = Object.keys(cache);
  if (ids.length > CACHE_LIMIT) {
    ids
      .sort((a, b) => cache[a].createdAt - cache[b].createdAt)
      .slice(0, ids.length - CACHE_LIMIT)
      .forEach((id) => delete cache[id]);
  }

  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

function buildUserPrompt(req: GenerateSummaryRequest): string {
  const transcript =
    req.transcript.length > MAX_TRANSCRIPT_CHARS
      ? req.transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n[transcript truncated]"
      : req.transcript;

  return [
    `Title: ${req.title || "(unknown)"}`,
    req.channel ? `Channel: ${req.channel}` : "",
    "",
    "Transcript:",
    transcript,
  ]
    .filter((line, i) => line !== "" || i === 2)
    .join("\n");
}
//maxOutputTokens: 8192
function buildBody(req: GenerateSummaryRequest, strict: boolean): object {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    responseMimeType: "application/json",
    maxOutputTokens: 8192,
  };

  // Strict mode uses the JSON schema and minimal thinking for speed. If the chosen
  // model rejects either option, we retry once without them.
  if (strict) {
    generationConfig.responseJsonSchema = ARTICLE_SCHEMA;
    generationConfig.thinkingConfig = { thinkingLevel: "LOW" };
  }

  return {
    systemInstruction: { parts: [{ text: ARTICLE_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }],
    generationConfig,
  };
}

function describeApiError(status: number, message: string): string {
  if (status === 400 && /api key/i.test(message)) {
    return "Your Gemini API key is invalid. Check it in the extension popup.";
  }
  if (status === 403) {
    return "Gemini refused the request (403). Check the API key's permissions.";
  }
  if (status === 404) {
    return "This Gemini model isn't available to your key. Pick another model in the popup.";
  }
  if (status === 429) {
    return "Gemini rate limit or quota reached. Try again in a minute.";
  }
  if (status >= 500) {
    return "Gemini is having trouble right now. Try again shortly.";
  }
  return message || `Gemini error (${status})`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return JSON");
  }
}
//Gemini’s raw output -> validated ThumbnailSummary object, returning null if the input is invalid or empty.
//It still reads TL;DR fields (tldr, points). It needs rewriting to read the article fields
function normalizeSummary(raw: unknown): ThumbnailSummary | null {
    if (!raw || typeof raw !== "object") return null;
    const title = typeof (raw as any).title === "string" ? (raw as any).title.trim() : "";
    const dek = typeof (raw as any).dek === "string" ? (raw as any).dek.trim() : "";
    const paragraphs = Array.isArray((raw as any).sections)
      ? (raw as any).sections
          .filter((s: any) => s && typeof s === "object" && Array.isArray(s.paragraphs))
          .flatMap((s: any) => s.paragraphs)
    : [];
    const takeaways = Array.isArray((raw as any).takeaways)
      ? (raw as any).takeaways
          .filter((t: unknown) => typeof t === "string")
          .map((t) => t.trim())
    : [];
    return { title, dek, paragraphs, takeaways } as unknown as ThumbnailSummary;
}

async function callGemini(
  apiKey: string,
  model: string,
  req: GenerateSummaryRequest,
  strict: boolean
): Promise<{ ok: true; summary: ThumbnailSummary } | { ok: false; status: number; message: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(buildBody(req, strict)),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: data?.error?.message || response.statusText,
    };
  }

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    return { ok: false, status: 200, message: `Gemini blocked this transcript (${blockReason}).` };
  }

  const parts: { text?: string; thought?: boolean }[] =
    data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");

  if (!text) {
    const finish = data?.candidates?.[0]?.finishReason || "unknown";
    return { ok: false, status: 200, message: `Gemini returned no text (${finish}).` };
  }

  const summary = normalizeSummary(extractJson(text));
  if (!summary) {
    return { ok: false, status: 200, message: "Gemini returned an empty summary." };
  }
  return { ok: true, summary };
}

export async function generateArticle(
  req: GenerateSummaryRequest
): Promise<ThumbnailSummaryResponse> {
  const stored = await chrome.storage.local.get(["geminiApiKey", "geminiModel"]);
  const apiKey = typeof stored.geminiApiKey === "string" ? stored.geminiApiKey.trim() : "";
  const model =
    typeof stored.geminiModel === "string" && stored.geminiModel.trim()
      ? stored.geminiModel.trim()
      : DEFAULT_MODEL;

  if (!apiKey) {
    return {
      success: false,
      errorCode: "NO_API_KEY",
      error: "Add your Gemini API key in the Productive YouTube popup.",
    };
  }

  if (!req.transcript || !req.transcript.trim()) {
    return { success: false, errorCode: "BAD_RESPONSE", error: "Transcript is empty." };
  }

  try {
    let result = await callGemini(apiKey, model, req, true);

    // Some models reject the schema or thinking options with a 400: retry once in lenient mode.
    if (!result.ok && result.status === 400 && !/api key/i.test(result.message)) {
      result = await callGemini(apiKey, model, req, false);
    }

    if (!result.ok) {
      return {
        success: false,
        errorCode: "API_ERROR",
        error: describeApiError(result.status, result.message),
      };
    }

    await writeCache(req.videoId, {
      summary: result.summary,
      model,
      createdAt: Date.now(),
      promptVersion: ARTICLE_PROMPT_VERSION,
    });

    return { success: true, data: result.summary, cached: false };
  } catch (error) {
    return {
      success: false,
      errorCode: "BAD_RESPONSE",
      error: error instanceof Error ? error.message : "Summary generation failed",
    };
  }
}
