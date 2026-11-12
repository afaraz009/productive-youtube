// Thumbnail TL;DR generation via the Gemini API (runs in the background service worker only).
// Imported only by background.ts so Vite inlines it there (no shared chunk with the content script).

import type { ThumbnailSummary, ThumbnailSummaryResponse } from "./scripts/types";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const CACHE_KEY = "thumbnailSummaryCache";
const CACHE_LIMIT = 200;
const MAX_TRANSCRIPT_CHARS = 300_000;

// Bump when SYSTEM_PROMPT changes so cached summaries from the old prompt are regenerated
const PROMPT_VERSION = 2;

const SYSTEM_PROMPT = `You compress a YouTube video transcript into a TL;DR a reader absorbs in under 30 seconds without losing any key idea.

Return JSON matching the schema:
- "tldr": ONE sentence, max 20 words: the video's specific core takeaway, answer or verdict, concrete enough that it could only describe THIS video. Never start with "This video", "The speaker" or "Learn".
- "sections": 1-6 groups following the video's logical structure.
  - "heading": 1-3 words.
  - "points": bullets, one distinct idea each.

Bullet rules (strict):
- HARD LIMIT: 12 words per bullet. If an idea needs more, split it or cut words.
- Telegraphic note style: drop articles, auxiliary verbs, filler and hedging. Fragments preferred.
- Every bullet carries a specific fact: number, name, date, mechanism, step, cause, comparison, reason or recommendation. Never write vague bullets like "Operates via semiconductor science".
- For any verdict, flaw or choice, include the reason in a few words.
- Use ":" to attach detail to a label, "→" for cause/effect or sequence, "=" ONLY for a true definition. Do not force bullets into "X = Y".
- Never repeat the tldr or another bullet.

Examples:
BAD: "Onnes discovered superconductivity in 1911 by cooling mercury until its electrical resistance plunged to zero at 4.2 Kelvin."
GOOD: "1911: Onnes finds superconductivity, mercury resistance → 0 at 4.2 K"
BAD: "Advantages over mechanical switches = no moving parts, no human controller, faster, tiny."
GOOD: "Beats mechanical switches: no moving parts, faster, tiny"
BAD: "Incorrect divide-and-conquer uses 1D peak on middle column."
GOOD: "Middle-column 1D peak fails: may not be a 2D peak"

Coverage (strict):
- Walk the transcript start to end. Every substantive idea, claim, step, technique, number, example that makes a point, caveat and conclusion must appear, including figures from the opening and timelines or limits near the end.
- Bullet count follows content density: about 3-6 for a short or simple video, up to about 30 for a long, dense one.
- Skip sponsors, ads, self-promotion, greetings, subscribe requests, teasers for other videos and tangents with no takeaway.

Songs, music videos, poems, ambience: never quote or list lyrics. "tldr" = artist/genre and the song's theme in one sentence; "sections" = [].

Accuracy: use only the transcript; never add outside facts or opinions. Write in English.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tldr: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          points: { type: "array", items: { type: "string" } },
        },
        required: ["heading", "points"],
      },
    },
  },
  required: ["tldr", "sections"],
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

export async function getCachedThumbnailSummary(
  videoId: string
): Promise<ThumbnailSummaryResponse> {
  const cache = await readCache();
  const entry = cache[videoId];
  const fresh = !!entry && entry.promptVersion === PROMPT_VERSION;
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

function buildBody(req: GenerateSummaryRequest, strict: boolean): object {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    responseMimeType: "application/json",
  };

  // Strict mode uses the JSON schema and minimal thinking for speed. If the chosen
  // model rejects either option, we retry once without them.
  if (strict) {
    generationConfig.responseJsonSchema = RESPONSE_SCHEMA;
    generationConfig.thinkingConfig = { thinkingLevel: "MINIMAL" };
  }

  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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

function normalizeSummary(raw: unknown): ThumbnailSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { tldr?: unknown; sections?: unknown };
  const tldr = typeof obj.tldr === "string" ? obj.tldr.trim() : "";
  const sections = Array.isArray(obj.sections)
    ? obj.sections
        .map((s) => {
          const sec = s as { heading?: unknown; points?: unknown };
          const heading = typeof sec.heading === "string" ? sec.heading.trim() : "";
          const points = Array.isArray(sec.points)
            ? sec.points
                .filter((p): p is string => typeof p === "string")
                .map((p) => p.trim().replace(/^[-•*]\s*/, ""))
                .filter(Boolean)
            : [];
          return { heading, points };
        })
        .filter((s) => s.points.length > 0)
    : [];

  if (!tldr && sections.length === 0) return null;
  return { tldr, sections };
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

export async function generateThumbnailSummary(
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
      promptVersion: PROMPT_VERSION,
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
