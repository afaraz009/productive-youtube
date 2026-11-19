// Background service worker for handling API calls (bypasses CORS)

import { handleAuthMessage, registerAuthBroadcast } from "./auth/authService";
import type { AuthRequest } from "./auth/types";
//immediately initializes when background.ts loads and registers a listener with supabase
registerAuthBroadcast();
// this listener waits for messages from other parts of my extention
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {

  //auth..
  if (typeof request.type === "string" && request.type.startsWith("AUTH_")) {
  if (_sender.id !== chrome.runtime.id) return false; // own extension only

  //helps decide which authentication operation to execute
  //the response goes to chrome.runtime.sendMessage in authApi.ts
  handleAuthMessage(request as AuthRequest).then(sendResponse);
  return true; // keep the channel open for the async response
}
  if (request.type === "FETCH_TRANSCRIPT") {
    handleTranscriptFetch(request.url)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.type === "TRANSLATE_TEXT") {
    handleTranslation(request.text)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.type === "OPEN_CHATGPT") {
    handleChatGPTOpen(request.content)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.type === "OPEN_AI_SERVICE") {
    handleAIServiceOpen(request.aiService, request.content)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  // This msg is sent from popup to background when user clicks on a saved note in the popup
    if (request.type === "OPEN_SAVED_NOTE") {
    handleSavedNoteOpen(
  request.videoId,
  request.startTime,
  request.endTime,
  request.startSegmentStart,
  request.endSegmentStart,
  request.startOffset,
  request.endOffset,
)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // this is sent from the content script to the background when the new tab is opened and we want to get the saved note range from storage
    if (request.type === "GET_SAVED_NOTE_RANGE") {
    handleGetSavedNoteRange(_sender)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === "CHECK_PENDING_SAVED_NOTE") {
  checkPendingSavedNote(_sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

  return true;
}
});
async function checkPendingSavedNote(
  sender: chrome.runtime.MessageSender
) {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    return { success: false, isPending: false };
  }

  const storageKey = `pendingNoteNavigation_${tabId}`;

  const result = await chrome.storage.local.get(storageKey);

  return {
    success: true,
    isPending: !!result[storageKey],
  };
}

// this function is called when the content script sends a message to the background to get the saved note range for the newly opened tab
async function handleGetSavedNoteRange(
  sender: chrome.runtime.MessageSender
) {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    return { success: false, error: "Could not identify requesting tab" };
  }

  const storageKey = `pendingNoteNavigation_${tabId}`;

  const result = await chrome.storage.local.get(storageKey);

  const savedRange = result[storageKey];

  if (!savedRange) {
    return { success: true, data: null };
  }

  // Remove the temporary range after it has been retrieved
  await chrome.storage.local.remove(storageKey);

  return { success: true, data: savedRange };
}
async function handleSavedNoteOpen(
  videoId: string,
  startTime: number,
  endTime: number,
  startSegmentStart: number,
  endSegmentStart: number,
  startOffset: number,
  endOffset: number,
) {
  const tab = await chrome.tabs.create({
    url: "about:blank",
    active: true,
  });

  if (tab.id === undefined) {
    throw new Error("Failed to create saved note tab");
  }

  const tabId = tab.id;
  const storageKey = `pendingNoteNavigation_${tabId}`;

  await new Promise<void>((resolve, reject) => {
    chrome.storage.local.set(
      {
        [storageKey]: {
          startTime,
          endTime,
          startSegmentStart,
          endSegmentStart,
          startOffset,
          endOffset,
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      },
    );
  });

  const url =
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` +
    `&t=${Math.floor(startTime)}s`;

  await chrome.tabs.update(tabId, { url });

  return { success: true, tabId };
}
async function handleTranslation(text: string) {
  try {
    // Using MyMemory Translation API (completely free, no key required)
    const translateResponse = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|ur`
    );

    if (!translateResponse.ok) {
      throw new Error(`Translation API Error (${translateResponse.status})`);
    }

    const translateData = await translateResponse.json();
    const urduTranslation =
      translateData.responseData?.translatedText || "ترجمہ دستیاب نہیں";

    // Generate vocabulary and context using synonyms
    const words = text.split(/\s+/).filter((w) => w.length > 3);
    const vocabulary = words.slice(0, 3).map((w) => w.toLowerCase());

    // Create a simple but useful response
    const result = {
      urduTranslation: urduTranslation,
      bestWord:
        text.length > 30
          ? text.split(/\s+/).slice(0, 5).join(" ") + "..."
          : text,
      vocabulary: vocabulary.length > 0 ? vocabulary : [text, text, text],
      context: `English: "${text}" | This phrase is commonly used in conversational English.`,
    };

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}

async function handleChatGPTOpen(content: string) {
  try {
    // Store content in chrome.storage for the automation script to retrieve
    await chrome.storage.local.set({
      chatgpt_content: {
        content: content,
        timestamp: Date.now(),
      },
    });

    // Open ChatGPT in a new tab
    const tab = await chrome.tabs.create({
      url: "https://chatgpt.com/",
      active: true,
    });

    if (!tab.id) {
      throw new Error("Failed to create tab");
    }

    // Set up listener for when the tab finishes loading
    const tabId = tab.id;
    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        // Inject the automation script
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["chatgpt_automation.js"],
          })
          .then(() => {
            // Clean up listener
            chrome.tabs.onUpdated.removeListener(listener);
          })
          .catch(() => {
            chrome.tabs.onUpdated.removeListener(listener);
          });
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Clean up listener after 30 seconds if it hasn't fired
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
    }, 30000);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open ChatGPT",
    };
  }
}

type AIService = 'chatgpt' | 'gemini' | 'claude' | 'grok';

interface AIServiceConfig {
  url: string;
  scriptFile: string;
  storageKey: string;
}

const AI_SERVICE_CONFIGS: Record<AIService, AIServiceConfig> = {
  chatgpt: {
    url: "https://chatgpt.com/",
    scriptFile: "chatgpt_automation.js",
    storageKey: "chatgpt_content"
  },
  gemini: {
    url: "https://gemini.google.com/app",
    scriptFile: "gemini_automation.js",
    storageKey: "gemini_content"
  },
  claude: {
    url: "https://claude.ai/",
    scriptFile: "claude_automation.js",
    storageKey: "claude_content"
  },
  grok: {
    url: "https://grok.com/",
    scriptFile: "grok_automation.js",
    storageKey: "grok_content"
  }
};

async function handleAIServiceOpen(aiService: AIService, content: string) {
  try {
    const config = AI_SERVICE_CONFIGS[aiService];

    if (!config) {
      throw new Error(`Unknown AI service: ${aiService}`);
    }

    // Store content in chrome.storage for the automation script to retrieve
    await chrome.storage.local.set({
      [config.storageKey]: {
        content: content,
        timestamp: Date.now(),
      },
    });

    // Open AI service in a new tab 
    // chrome.tabs.create() returns a Promise. 
    // When Chrome creates the new tab, that Promise resolves 
    // with a Tab object containing information about the tab, including its numeric id.
    const tab = await chrome.tabs.create({
      url: config.url,
      active: true,
    });

    if (!tab.id) {
      throw new Error("Failed to create tab");
    }

    // Set up listener for when the tab finishes loading
    const tabId = tab.id; // stores the tab ID for the newly created tab 
    // so we can check if the updated tab is the one we just opened
    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        // Inject the automation script 
        // it is injected into the newly opened tab to automate the AI service 
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: [config.scriptFile],
          })
          .then(() => {
            // Clean up listener
            chrome.tabs.onUpdated.removeListener(listener);
          })
          .catch(() => {
            chrome.tabs.onUpdated.removeListener(listener);
          });
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Clean up listener after 30 seconds if it hasn't fired
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
    }, 30000);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to open ${aiService}`,
    };
  }
}

async function handleTranscriptFetch(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error("Empty transcript response from YouTube");
    }

    return { success: true, data: text };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcript fetch failed",
    };
  }
}
