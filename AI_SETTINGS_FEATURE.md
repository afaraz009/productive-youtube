# AI Settings Feature - Implementation Summary

## Overview
Added a comprehensive AI settings feature that allows users to:
1. Choose between different AI services (ChatGPT, Gemini, Claude, Grok)
2. Customize prompts for translation, summarization, and vocabulary extraction
3. All AI-related buttons (Translate, Summarize, Vocabulary) use the selected service and custom prompts

## Files Modified

### 1. Type Definitions (`src/scripts/types.ts`)
- Added `AIService` type: `'chatgpt' | 'gemini' | 'claude' | 'grok'`
- Added `AIPrompts` interface with three prompt types:
  - `translate`: Translation prompt
  - `summarize`: Summary prompt
  - `vocabulary`: Vocabulary extraction prompt
- Updated `Settings` interface to include:
  - `aiService`: Selected AI service
  - `aiPrompts`: Custom prompts object

### 2. Settings Module (`src/scripts/settings.ts`)
- Added default AI service: `'chatgpt'`
- Added default prompts for all three button types
- All settings are now stored and loaded from Chrome storage

### 3. Display Module (`src/scripts/transcript/display.ts`)
- Updated translate button to use `settings.aiPrompts.translate`
- Updated summary button to use `settings.aiPrompts.summarize`
- Updated vocabulary button to use `settings.aiPrompts.vocabulary`
- All buttons now send `OPEN_AI_SERVICE` message with `aiService` parameter

### 4. Background Script (`src/background.ts`)
- Added new message handler: `OPEN_AI_SERVICE`
- Added `AIServiceConfig` interface
- Added `AI_SERVICE_CONFIGS` object mapping services to their URLs and scripts
- Added `handleAIServiceOpen()` function that:
  - Takes AI service type and content
  - Stores content in appropriate storage key
  - Opens the selected AI service in a new tab
  - Injects the corresponding automation script

### 5. Automation Scripts (New Files)
Created three new automation scripts following the ChatGPT pattern:

#### `src/scripts/gemini-automation.ts`
- Selectors for Gemini's input field and submit button
- Storage key: `gemini_content`
- URL: `https://gemini.google.com/app`

#### `src/scripts/claude-automation.ts`
- Selectors for Claude's input field and submit button
- Storage key: `claude_content`
- URL: `https://claude.ai/`

#### `src/scripts/grok-automation.ts`
- Selectors for Grok's input field and submit button
- Storage key: `grok_content`
- URL: `https://grok.com/`

### 6. Popup UI (`src/components/PopupApp.tsx`)
- Updated Settings interface to match backend types
- Added default AI settings to defaultSettings
- Added three new handlers:
  - `handleAIServiceChange()`: Updates selected AI service
  - `handlePromptChange()`: Updates individual prompts
  - `showAISettings` state for collapsible section
- Added new AI Settings section with:
  - Collapsible panel (click to expand/collapse)
  - AI Service dropdown (ChatGPT, Gemini, Claude, Grok)
  - Three textarea fields for customizing prompts
  - "Reset to Defaults" button

### 7. Build Configuration (`vite.config.ts`)
- Added three new entry points:
  - `gemini_automation`
  - `claude_automation`
  - `grok_automation`
- Added output file name mappings for new scripts

### 8. Manifest (`public/manifest.json`)
- Added host permissions for new AI services:
  - `https://gemini.google.com/*`
  - `https://claude.ai/*`
  - `https://grok.com/*`

## How It Works

### User Flow
1. User opens extension popup
2. Clicks "AI Settings" to expand the section
3. Selects preferred AI service from dropdown
4. Optionally customizes prompts for each button type
5. Settings are automatically saved to Chrome storage
6. When user clicks any AI button (Translate/Summarize/Vocabulary):
   - Extension uses the selected AI service
   - Uses the customized prompt for that button type
   - Opens the AI service in a new tab
   - Automatically pastes and submits the content

### Technical Flow
```
User clicks AI button (e.g., Translate)
  ↓
display.ts sends message:
  - type: "OPEN_AI_SERVICE"
  - aiService: settings.aiService (e.g., "gemini")
  - content: prompt + transcript
  ↓
background.ts receives message
  ↓
handleAIServiceOpen() is called
  ↓
Looks up config for selected service:
  - url: "https://gemini.google.com/app"
  - scriptFile: "gemini_automation.js"
  - storageKey: "gemini_content"
  ↓
Stores content in chrome.storage.local
  ↓
Opens new tab with AI service URL
  ↓
Injects automation script when page loads
  ↓
Automation script:
  - Retrieves content from storage
  - Finds input field
  - Pastes content
  - Clicks submit button
  - Cleans up storage
```

## Storage Schema

Chrome storage now contains:
```javascript
{
  // Existing settings
  removeShorts: boolean,
  removeShortsButton: boolean,
  removeHomepageVideos: boolean,
  removeWatchPageSuggestions: boolean,
  showTranscript: boolean,

  // New AI settings
  aiService: 'chatgpt' | 'gemini' | 'claude' | 'grok',
  aiPrompts: {
    translate: string,
    summarize: string,
    vocabulary: string
  },

  // Temporary content storage (cleared after use)
  chatgpt_content?: { content: string, timestamp: number },
  gemini_content?: { content: string, timestamp: number },
  claude_content?: { content: string, timestamp: number },
  grok_content?: { content: string, timestamp: number }
}
```

## Default Prompts

### Translation Prompt
```
Translate the following transcript in urdu. Keep the timestamps and the same format in translated content
```

### Summary Prompt
```
# YouTube Video Summary Generator

## Instructions
You will be provided with the Title, URL, and Transcript of a YouTube video.
Create a comprehensive yet accessible summary with the following structure:

### Video:
Create a clickable hyperlink using the video Title as the link text and the URL as the destination.

### TL;DR:
Provide a concise summary (1-3 sentences) capturing the essential message or purpose of the video.

### Key Points:
List 3-7 core ideas, arguments, or insights presented in the video. Each point should be:
- One to three sentences in length
- Specific enough to convey meaningful information
- Written in clear, straightforward language

### Detailed Summary with Timestamps:
Write a comprehensive summary of the video content in 5-20 bullet points, depending on the video length and complexity.
- Each point should begin with a timestamp (formatted as [mm:ss](URL&t=XXXs)) where XXX is the number of seconds into the video
- Each summary point should:
  - Cover a distinct topic, segment, or idea from the video
  - Be 2-4 sentences long, providing context and specific details
  - Include relevant examples, data points, or quotes when appropriate
  - Avoid vague generalizations; instead, capture the actual substance of what was discussed
  - Use plain language while preserving any essential technical terms

### Additional Context (Optional):
If relevant, include brief sections on:
- Background information needed to understand the topic
- Related resources mentioned in the video
- Key questions addressed or left unanswered

Format all hyperlinks properly to ensure they are clickable and lead to the correct timestamp in the video.
```

### Vocabulary Prompt
```
Find all difficult words and create a table of English to Urdu and English to English meaning
```

## Testing Checklist

- [ ] Build completes successfully (`npm run build`)
- [ ] Extension loads in Chrome without errors
- [ ] AI Settings section expands/collapses correctly
- [ ] AI service dropdown changes are saved
- [ ] Prompt text changes are saved
- [ ] Reset to Defaults button works
- [ ] Translate button opens correct AI service
- [ ] Summary button opens correct AI service
- [ ] Vocabulary button opens correct AI service
- [ ] Custom prompts are used in AI requests
- [ ] Automation scripts work for all AI services:
  - [ ] ChatGPT
  - [ ] Gemini
  - [ ] Claude
  - [ ] Grok

## Future Enhancements

1. Add more AI services (Perplexity, etc.)
2. Add prompt templates/presets
3. Add validation for prompt length
4. Add export/import settings feature
5. Add preview mode to see how prompts will look
6. Add prompt variables (e.g., {videoTitle}, {videoUrl})
