# Productive YouTube - AI Project Context

Updated: 2026-11-19

This document describes the current repository and the authentication and notes work completed so far. It is intended to give another AI coding assistant enough context to work safely without relying on older project summaries.

## Project overview

Productive YouTube is a Chrome Manifest V3 extension built with React, TypeScript, Tailwind CSS, and Vite. Its main functions are:

- Hide Shorts, homepage videos, watch-page suggestions, comments, and the Shorts sidebar button.
- Fetch and display YouTube transcripts, with transcript selection saved as a note.
- Manage settings and a focus-lock timer in the popup.
- Sign users up and in with Supabase Auth.
- Store authenticated users' saved notes in a Supabase `public.notes` table.
- Send transcript text to supported AI sites and request translation.

The extension has three principal runtime contexts:

1. **Popup and auth page** - React UI for settings, account status, sign-in/up, and notes.
2. **YouTube content script** - Runs on YouTube pages, modifies the page, displays transcripts, and initiates note saves.
3. **Background service worker** - Receives extension messages and performs auth, Supabase note operations, transcript fetches, translation, tab creation, and note navigation.

## Current status

- Authentication code is implemented. Sign-in, sign-up, status, and sign-out are routed through the background service worker to Supabase.
- Authentication was manually exercised using `chrome.runtime.sendMessage` from extension DevTools. Signup can return `needsEmailConfirmation: true` when Supabase email confirmation is enabled.
- The popup has an Account section showing loading/signed-out/signed-in status and opening the auth page for login or signup.
- Notes are being moved from local-only storage to Supabase. New note saves, listing, and deletion use the background message path. The note ownership ID is taken from the authenticated Supabase session, not supplied by the UI.
- Existing local `savedNotes` are **not migrated**. Their existing Chrome storage value is left untouched; the popup's current notes list reads cloud notes.
- `supabase/migrations/20261119110000_notes.sql` is present in the repository. The developer reports having run it manually in the Supabase SQL Editor.
- Supabase schema CI/CD has **not** been set up yet. There is currently no Supabase CLI config or GitHub Actions workflow for applying migrations.
- The current checkout is `notes-integration`. Check `git status` before editing or committing; note-related files may contain uncommitted work.

## Important privacy and configuration caveats

- Do not read, paste, or commit `.env` values. `.env` is ignored by Git. `.env.example` contains placeholders for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The extension uses the Supabase anon/public key. Do not put a Supabase service-role key in the extension or its build.
- Supabase session data is persisted under `pyt-auth` in `chrome.storage.local`. The content script does not receive session tokens.
- `PRIVACY_POLICY.md`, `README.md`, and `CLAUDE.md` contain older descriptions and may not reflect the account system or cloud notes. In particular, the privacy policy currently describes no account system/backend; it should be updated before release.
- `dist.pem` exists at the repository root. If this is the Chrome extension signing key, treat it as private and do not share or commit it.

## Repository structure

```text
/
|-- src/
|   |-- auth.html
|   |-- auth.tsx
|   |-- background.ts
|   |-- popup.html
|   |-- popup.tsx
|   |-- auth/
|   |-- components/
|   |-- hooks/
|   |-- notes/
|   |-- pages/
|   |-- scripts/
|   |-- styles/
|   `-- vite-env.d.ts
|-- public/
|   |-- manifest.json
|   `-- icons/
|-- scripts/
|   `-- copy-files.cjs
|-- supabase/
|   `-- migrations/
|       `-- 20261119110000_notes.sql
|-- demo/
|   `-- src/compositions/
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- .env.example
`-- documentation files
```

### Extension entry points and configuration

- `public/manifest.json` - Manifest V3 permissions, host permissions, background service worker, YouTube content script, popup, and icons. Supabase host access is included.
- `src/popup.html` and `src/popup.tsx` - Popup HTML shell and React entry point. `popup.tsx` renders `components/PopupApp.tsx`.
- `src/auth.html` and `src/auth.tsx` - Separate extension auth page shell and React entry point. `auth.tsx` renders `pages/AuthPage.tsx`.
- `src/background.ts` - Background service worker message router. It handles auth, notes, transcript fetches, translation, AI-site tab creation, and saved-note navigation.
- `vite.config.ts` - Defines multi-entry builds for the popup, auth page, content script, background worker, and AI automation scripts.
- `scripts/copy-files.cjs` - Copies the manifest and icons into `dist/` and moves/fixes popup and auth HTML output.
- `src/vite-env.d.ts` - Vite environment variable typing.
- `dist/` - Generated build output; do not edit it directly.

### Authentication files

- `src/auth/types.ts` - Auth request/response and `AuthUser` types.
- `src/auth/supabaseClient.ts` - Creates the typed Supabase client, uses the Chrome-storage adapter inline, persists the session using key `pyt-auth`, and configures auth behavior.
- `src/auth/authService.ts` - Background-side Supabase auth operations: signup, sign-in, sign-out, status, user-summary conversion, friendly errors, and `auth_status` broadcasts.
- `src/auth/authApi.ts` - Popup/auth-page client wrappers that send `AUTH_*` runtime messages and return Promises.
- `src/auth/openAuthPage.ts` - Opens or reuses the extension auth tab with `#login` or `#signup`.
- `src/hooks/useAuth.ts` - The hook imported by both `PopupApp.tsx` and `AuthPage.tsx`. It tracks user/loading/busy/error state and calls `authApi`.
- `src/pages/AuthPage.tsx` - Auth page UI coordinator; chooses login/signup mode, renders the auth panel or account controls, and closes the tab after a fresh sign-in.
- `src/components/AuthPanel.tsx` - Email/password form, basic validation, and email-confirmation notice.
- `src/components/AccountBar.tsx` - Shows the signed-in email and sign-out button.
- `src/scripts/authState.ts` - Content-script-side listener for initial auth status and `auth_status` changes. Note saving itself checks the session in the background rather than trusting this cached state.

There are two similarly named/duplicated files to be aware of:

- `src/auth/useAuth.ts` is not the hook imported by current UI entry points; current imports use `src/hooks/useAuth.ts`.
- `src/auth/chromeStorageAdapter.ts` exists, but `supabaseClient.ts` currently defines its own adapter inline rather than importing it.

### Notes and Supabase files

- `src/scripts/types.ts` - Contains the `SavedNote` TypeScript type.
- `src/notes/database.types.ts` - TypeScript database row/insert/update definition for `public.notes`.
- `src/notes/types.ts` - Notes request/response unions and runtime validation for note messages.
- `src/notes/notesApi.ts` - Popup-side wrappers for `GET_SAVED_NOTES` and `DELETE_SAVED_NOTE`. Its exported `saveNote()` helper is currently unused.
- `src/notes/notesService.ts` - Background-side Supabase operations: get authenticated user ID, map `SavedNote` to database row fields and back, insert a note, list the current user's notes, and delete an owned note.
- `supabase/migrations/20261119110000_notes.sql` - SQL to create/update the notes table, convert camelCase column names to snake_case, ensure `id` is the primary key, add the `user_id` foreign key, add precise-selection columns, enable RLS, add an owner policy, and grant authenticated table access.

The database row contains:

```text
id                  text primary key
user_id             uuid -> auth.users(id)
video_id            text
video_title         text
start_time          double precision
end_time            double precision
start_segment_start double precision
end_segment_start   double precision
start_offset        integer
end_offset          integer
preview             text
created_at           bigint (JavaScript epoch milliseconds)
```

`user_id` is not the primary key; each user can have multiple notes. RLS uses `auth.uid() = user_id` to limit access to the authenticated owner. The service also scopes queries by the session's user ID.

### Content script, transcript, and removers

- `src/scripts/content.ts` - Main content-script orchestrator. Initializes auth status, settings, removers, transcript behavior, mutation handling, and YouTube SPA navigation.
- `src/scripts/settings.ts` - Loads and updates extension settings in `chrome.storage.local`.
- `src/scripts/selectors.ts` - DOM selector constants used by removers.
- `src/scripts/types.ts` - Shared settings, focus feature, video, and saved-note types.
- `src/scripts/removers/shorts.ts` - Removes Shorts shelves.
- `src/scripts/removers/shortsButton.ts` - Removes the Shorts sidebar button.
- `src/scripts/removers/homepage.ts` - Removes homepage recommendations.
- `src/scripts/removers/suggestions.ts` - Removes watch-page suggestions.
- `src/scripts/removers/comments.ts` - Removes comments.
- `src/scripts/transcript/index.ts` - Coordinates transcript fetching and rendering.
- `src/scripts/transcript/api.ts` - Fetches YouTube watch/player data and transcript XML.
- `src/scripts/transcript/parser.ts` - Parses transcript XML.
- `src/scripts/transcript/display.ts` - Builds transcript UI and selection controls. It creates the full `SavedNote` and sends `SAVE_NOTE` directly with `chrome.runtime.sendMessage`.
- `src/scripts/transcript/utils.ts` - Video ID/page helpers and transcript text/time utilities.
- `src/scripts/transcript/domUtils.ts` - Player/sidebar readiness and retry helpers.

The content-script save request is sent directly from `display.ts`, not through `notesApi.saveNote()`. This keeps the content script standalone: Chrome loads `content_script.js` as a classic content script, so it must not rely on an emitted ES module import chunk.

### Popup and other features

- `src/components/PopupApp.tsx` - Popup settings, focus controls, account dropdown, and My Notes UI. It loads notes after auth resolves, clears displayed cloud notes when signed out, and calls `notesApi` to list/delete.
- `src/scripts/chatgpt-automation.ts`, `gemini-automation.ts`, `claude-automation.ts`, `grok-automation.ts` - Site-specific scripts that read temporary transcript payloads from extension storage and enter them into the chosen AI site.
- `src/background.ts` - Also fetches transcripts, calls the translation API, opens AI tabs, and manages temporary saved-note navigation data.
- `src/styles/index.css` - Shared styles for popup/auth page and transcript UI.
- `demo/` - A separate Remotion video/demo project. It is not part of the Chrome extension runtime.

## Key runtime flows

### Sign-in and sign-up

```text
PopupApp
  -> openAuthPage("login" | "signup")
  -> AuthPage
  -> useAuth
  -> authApi.signIn/signUp
  -> chrome.runtime.sendMessage(AUTH_*)
  -> background.ts
  -> authService.handleAuthMessage
  -> Supabase Auth
```

The full Supabase session remains in extension storage for Supabase. The response/broadcast to the UI is a limited `{ id, email }` user summary, not the access/refresh tokens.

### Save a transcript note

```text
YouTube transcript selection + Save note click
  -> scripts/transcript/display.ts creates SavedNote
  -> chrome.runtime.sendMessage({ type: "SAVE_NOTE", note })
  -> background.ts validates/routes the request
  -> handleNotesRequest
  -> notesService.saveNote
  -> requireUserId from Supabase session
  -> Supabase insert with user_id
  -> RLS verifies auth.uid() = user_id
  -> response callback updates the Save button or displays an error
```

If signed out, `requireUserId()` rejects the operation; no row is inserted and the content script reports the error. The user must sign in and retry.

### List and delete notes

```text
PopupApp auth state resolves
  -> if signed in: notesApi.getSavedNotes()
  -> GET_SAVED_NOTES runtime message
  -> background.ts -> notesService.getSavedNotes()
  -> Supabase select scoped to current user

Popup Delete click
  -> notesApi.deleteSavedNote(noteId)
  -> DELETE_SAVED_NOTE runtime message
  -> background.ts -> notesService.deleteSavedNote()
  -> Supabase delete scoped by note id and current user
```

Historical local notes are not uploaded or deleted by these flows. The popup's current `My Notes` list displays Supabase notes.

## Development and deployment

### Environment

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the intended Supabase project.
3. Keep `.env` private and untracked. Never use a service-role key in the extension.

### Commands

- `npm install` - Install dependencies.
- `npm run dev` - Start Vite development server; Chrome extension APIs are not fully available outside the loaded extension context.
- `npm run build` - Build all extension entry points, run the content/automation builds, and copy manifest/icons/pages into `dist/`.
- `npm run watch` - Vite build watch mode.
- `npm run package` - Build and package the `dist` output.

To test the built extension, load `dist/` using `chrome://extensions` with Developer mode enabled. After changing source, rebuild and reload the extension.

### Supabase schema CI/CD work still required

The SQL migration is currently checked into the repository and was manually applied by the developer in Supabase SQL Editor. Automated migration deployment is not yet implemented. Future CI/CD work should:

1. Add and use Supabase CLI project configuration and migration history.
2. Reconcile the manually applied migration with Supabase's migration tracking before enabling `db push`.
3. Validate migrations in CI for pull requests.
4. Apply migrations to a staging/production project from a protected workflow after merge/approval.
5. Store deployment credentials in GitHub Actions secrets, never in the extension bundle or repository.

## Notes for future AI contributors

- Read this file plus the relevant source files before changing code; older `README.md` and `CLAUDE.md` are not authoritative for auth/cloud notes.
- Preserve the complete `SavedNote` shape, including `startSegmentStart`, `endSegmentStart`, `startOffset`, and `endOffset`; these support exact transcript highlighting.
- Keep note Supabase operations in the background service worker. Derive `user_id` from the Supabase session and retain RLS; do not trust a user ID supplied by the popup/content script.
- Do not migrate old local notes unless the product owner explicitly asks for it.
- If adding/changing a database field, update the `SavedNote` model, database types/mapping, and add a versioned SQL migration together.
- Keep the content script bundle standalone; avoid introducing shared runtime imports that cause Vite to emit an ES module chunk for `content_script.js`.
- Do not change unrelated focus, remover, transcript, or AI behavior while working on auth/notes tasks.
