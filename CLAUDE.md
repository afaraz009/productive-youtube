# Claude/Gemini Reference: YouTube Shorts & Video Suggestions Remover

This document is a reference for Claude and Gemini, to understand and work with this codebase.

## 1. Project Overview

This is a Chrome browser extension that removes YouTube Shorts, homepage videos, and video suggestions from YouTube.  Built with React, TypeScript, and Tailwind CSS using a modular architecture.

## 2. Tech Stack

-   **Frontend**: React 18, TypeScript, Tailwind CSS
-   **Build Tool**: Vite
-   **Platform**: Chrome Extension (Manifest V3)
-   **Architecture**: Modular ES6 modules

## 3. Project Structure

```
/
├── src/
│   ├── components/
│   │   └── PopupApp.tsx           # Main popup React component
│   ├── scripts/
│   │   ├── content.ts             # Main orchestrator (115 lines)
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── selectors.ts           # DOM selector constants
│   │   ├── settings.ts            # Settings management
│   │   ├── removers/              # Content removal modules
│   │   │   ├── shorts.ts          # Remove YouTube Shorts
│   │   │   ├── homepage.ts        # Remove homepage videos
│   │   │   ├── suggestions.ts     # Remove video suggestions
│   │   │   └── shortsButton.ts    # Remove Shorts sidebar button
│   │   ├── transcript/            # Transcript feature modules
│   │      ├── index.ts           # Main transcript coordinator
│   │      ├── api.ts             # YouTube API calls
│   │      ├── parser.ts          # XML parsing
│   │      ├── display.ts         # UI rendering
│   │      └── utils.ts           # Helper functions
│   ├── popup.html                 # Popup entry point
│   └── popup.tsx                  # React entry point for popup
├── public/
│   └── manifest.json              # Chrome extension manifest
├── dist/                          # Build output
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration
├── REFACTORING_SUMMARY.md         # Detailed refactoring guide
└── MODULE_STRUCTURE.md            # Visual module structure
```

## 4. Key Files & Modules

### Core Files

-   **`src/scripts/content.ts`**: Main orchestrator that coordinates all features. Very lightweight (115 lines), imports and uses all modules below.
-   **`src/scripts/types.ts`**: TypeScript interfaces (`Settings`, `VideoInfo`).
-   **`src/scripts/selectors.ts`**: All DOM selector constants organized by feature.
-   **`src/scripts/settings.ts`**: Settings management with Chrome storage integration.

### Removers Module (`src/scripts/removers/`)

Each remover handles a specific content blocking feature:

-   **`shorts.ts`**: Removes YouTube Shorts from feed, includes restore functionality.
-   **`homepage.ts`**: Removes suggested videos from homepage.
-   **`suggestions.ts`**: Removes video suggestions on watch page (preserves playlists).
-   **`shortsButton.ts`**: Removes Shorts button from sidebar.

### Transcript Module (`src/scripts/transcript/`)

Handles video transcript fetching and display:

-   **`index.ts`**: Main coordinator for transcript feature.
-   **`api.ts`**: Fetches video page, extracts API key, calls YouTube Player API.
-   **`parser.ts`**: Parses transcript XML into structured data.
-   **`display.ts`**: Creates and manages transcript UI with copy/sync features.
-   **`utils.ts`**: Helper functions (getVideoId, formatTimestamp, page detection).


### UI Components

-   **`src/components/PopupApp.tsx`**: React component for extension popup with toggle switches.

### Configuration

-   **`public/manifest.json`**: Extension permissions, content scripts, service worker.
-   **`vite.config.ts`**: Vite build configuration (bundles modules into single content_script.js).

## 5. Development Workflow

-   **Install dependencies**: `npm install`
-   **Build for development**: `npm run watch` (Watches for file changes and auto-rebuilds)
-   **Load the extension in Chrome**:
    1.  Open `chrome://extensions`
    2.  Enable "Developer mode"
    3.  Click "Load unpacked" and select the `dist` directory
-   **Create a production build**: `npm run build`
-   **Package for distribution**: `npm run package` (Creates `extension.zip` file)

## 6. Core Logic & Data Flow

### Initialization Flow

```
content.ts
  └─► initializeFullExtension()
       ├─► loadSettings() (from settings.ts)
       ├─► applyAllRemovals()
       │    ├─► removeShorts() (from removers/shorts.ts)
       │    ├─► removeShortsButton() (from removers/shortsButton.ts)
       │    ├─► isWatchPage() ? (from transcript/utils.ts)
       │    │    ├─► removeVideoSuggestions() (from removers/suggestions.ts)
       │    │    └─► showVideoTranscript() (from transcript/index.ts)
       │    └─► isHomePage() ?
       │         └─► removeHomepageVideos() (from removers/homepage.ts)
       └─► MutationObserver setup (watches DOM changes)
```

### Transcript Feature Flow

```
showVideoTranscript()
  ├─► getVideoId() (utils.ts)
  ├─► fetchVideoPage() (api.ts)
  ├─► extractApiKey() (api.ts)
  ├─► fetchPlayerApi() (api.ts)
  ├─► extractTranscriptUrl() (api.ts)
  ├─► fetchTranscriptXml() (api.ts)
  ├─► parseTranscript() (parser.ts)
  ├─► displayTranscript() (display.ts)

```


## 7. How to Add a New Feature

### For a New Content Removal Feature

1.  **Create a new remover module**: `src/scripts/removers/yourFeature.ts`
    ```typescript
    import { settings } from "../settings";
    import { YOUR_SELECTORS } from "../selectors";

    export function removeYourFeature(): void {
      if (!settings.yourFeature) {
        restoreYourFeature();
        return;
      }
      // Implementation
    }

    export function throttledRemoveYourFeature(): void {
      // Throttled version
    }
    ```

2.  **Add selectors**: Update `src/scripts/selectors.ts`
    ```typescript
    export const YOUR_SELECTORS: string[] = [
      "selector1",
      "selector2",
    ];
    ```

3.  **Update types**: Update `src/scripts/types.ts`
    ```typescript
    export interface Settings {
      // ... existing settings
      yourFeature: boolean;
    }
    ```

4.  **Update settings**: Update `src/scripts/settings.ts`
    ```typescript
    const defaultSettings: Settings = {
      // ... existing settings
      yourFeature: true,
    };
    ```

5.  **Import and use**: Update `src/scripts/content.ts`
    ```typescript
    import { removeYourFeature, throttledRemoveYourFeature } from "./removers/yourFeature";

    function applyAllRemovals() {
      removeYourFeature();
      // ...
    }
    ```

6.  **Add UI toggle**: Update `src/components/PopupApp.tsx`
    ```typescript
    // Add toggle switch for yourFeature
    ```

### For a New Utility Function

1.  Add to appropriate module (`utils.ts`, `api.ts`, etc.) or create new module
2.  Export the function
3.  Import where needed

### For a New UI Component

1.  Create component in transcript/display.ts 
2.  Follow existing UI patterns (dark mode support, inline styles)
3.  Export and use in appropriate context

## 8. Module Architecture Benefits

-   **Maintainability**: Each module has a single responsibility (~50-150 lines each)
-   **Testability**: Individual modules can be unit tested
-   **Scalability**: Easy to add features without bloating files
-   **Readability**: Clear imports show dependencies
-   **Performance**: Vite bundles and tree-shakes for optimal output

## 9. Important Notes

-   **Settings Object**: The `settings` object from `settings.ts` is a mutable shared object. Use `Object.assign()` to update it, never reassign.
-   **Build Output**: All modules are bundled into a single `content_script.js` (~37KB minified).
-   **No Circular Dependencies**: The module structure prevents circular imports.
-   **Throttling**: All DOM manipulation uses throttled functions to avoid performance issues.

## 10. Documentation

-   **REFACTORING_SUMMARY.md**: Detailed guide on the refactoring from monolithic to modular
-   **MODULE_STRUCTURE.md**: Visual diagrams and dependency graphs
-   **This file**: Quick reference for working with the codebase
