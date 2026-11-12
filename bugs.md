It's still not complete. `geminiArticle.ts` has moved forward, but three bugs in it would stop it producing an article, and nothing else has changed.

**What's done since last time**
- **Prompt and schema:** pasted into `geminiArticle.ts`.
- **Thinking level:** changed to `"LOW"`.
- **Exports renamed:** `getCachedArticle` and `generateArticle`.

**Bugs in `geminiArticle.ts`**
1. **[Line 304](src/geminiArticle.ts:304) uses `PROMPT_VERSION`, which no longer exists.** This is a new type error, bringing the count to 31. It should be `ARTICLE_PROMPT_VERSION`. The build doesn't type-check, so this would only fail when it runs, after the Gemini call has already been made.
2. **`normalizeSummary` (lines 184-206) still reads TL;DR fields** (`tldr`, `points`). The article JSON has `title`, `dek`, `paragraphs` and `takeaways`, so every section is dropped and every request fails with "Gemini returned an empty summary." It needs rewriting to read the article fields, along with new `Article` and `ArticleResponse` types in `types.ts` to replace `ThumbnailSummary` on lines 4, 70, 184 and 213.
3. **[Line 7](src/geminiArticle.ts:7) still uses the `"thumbnailSummaryCache"` key,** so articles and TL;DRs for the same video would overwrite each other. Change it to `"articleCache"`.

**Minor:** `maxOutputTokens: 8192` isn't in `buildBody` yet. The new indentation glitch in [content.ts:36](src/scripts/content.ts:36) is harmless.

**Unchanged since last check**
- **`background.ts`:** still has no `GET_ARTICLE` or `GENERATE_ARTICLE` handlers.
- **`loadSummaryForArticle`:**
  - It's still never called.
  - Line 171 still uses `GENERATE_ARTICLE` to check the cache; it should be `GET_ARTICLE`.
  - Line 190 still requests a TL;DR.
  - It still renders into the TL;DR card.
- **Reader view and "Read as article" button:** neither exists yet.

The quickest next step is to fix the three bugs and add the two background handlers. After that the generating half is complete, and only the reader view and button remain.

I checked this by reading the code and running `tsc`. I didn't build it or try it in Chrome, since nothing calls this code yet.