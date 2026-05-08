# Privacy Policy — Productive YouTube

**Last updated:** 2026-04-25

Productive YouTube ("the extension") is a Chrome browser extension that helps users stay focused on YouTube by hiding Shorts, homepage suggestions, and watch-page recommendations, and by providing optional transcript, translation, and AI-summarization tools.

This document explains what data the extension handles, where it goes, and what it does not do.

## 1. Data the extension stores

The extension uses `chrome.storage` to store the following on your device:

- **User preferences** — which features are enabled (block Shorts, hide homepage videos, hide suggestions, etc.).
- **Temporary clipboard payloads** — when you choose to send a transcript to an AI service (ChatGPT, Claude, Gemini, Grok), the transcript text is briefly written to `chrome.storage.local` so the helper script on the AI site can read it. This entry is removed immediately after it is consumed.

This data is stored locally in your browser. It is not transmitted to any server operated by the developer.

## 2. Data the extension transmits

The extension makes network requests to the following third-party services, only when you use the corresponding feature:

| Feature | Destination | What is sent |
|---|---|---|
| Transcript fetch | `youtube.com` (YouTube's own player API) | The video ID of the YouTube page you are viewing |
| Translation | `api.mymemory.translated.net` | The transcript text or selection you asked to translate |
| Send to AI | `chatgpt.com`, `claude.ai`, `gemini.google.com`, `grok.com` | The transcript text, pasted into the AI service's normal input field |

These requests happen only in response to a user action (loading a watch page with the transcript feature enabled, or clicking a translate / send-to-AI button). The extension does not send your data anywhere else.

## 3. Data the extension does NOT collect

The extension does not collect, transmit, or sell:

- Personally identifiable information (name, email, address, phone number).
- Authentication credentials, cookies, or session tokens.
- Browsing history, search history, or watch history.
- Analytics, telemetry, crash reports, or usage metrics.
- Financial or payment information.
- Health or location data.

The developer operates no backend server and has no account system. There is nothing to log in to.

## 4. Third-party services

When you use the optional translation or AI features, your data is processed by the third party you chose to send it to, under their own privacy policies:

- MyMemory (translation): https://mymemory.translated.net/doc/privacy.php
- OpenAI (ChatGPT): https://openai.com/policies/privacy-policy
- Anthropic (Claude): https://www.anthropic.com/legal/privacy
- Google (Gemini): https://policies.google.com/privacy
- xAI (Grok): https://x.ai/legal/privacy-policy

If you do not use these features, no data is sent to these third parties.

## 5. Permissions justification

- **`storage`** — to remember your feature toggles between sessions.
- **`tabs`** and **`scripting`** — to open an AI service in a new tab and paste the transcript into its input field when you click "Send to AI".
- **Host permissions for `youtube.com`** — to apply the focus features (hide Shorts, suggestions, etc.) and fetch transcripts on the page you are watching.
- **Host permissions for AI sites and the translation API** — only used by the optional translate / send-to-AI features described above.

## 6. Children's privacy

The extension is not directed at children under 13 and does not knowingly collect data from them.

## 7. Changes to this policy

If this policy changes, the "Last updated" date at the top will change and the new version will replace this file in the repository. Material changes will also be reflected in the Chrome Web Store listing.

## 8. Contact

Questions about this policy can be sent to: **ahmed.faraz22@outlook.com**
