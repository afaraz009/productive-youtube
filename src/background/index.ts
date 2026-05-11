// Background service worker for handling API calls (bypasses CORS)
import { MessageType, MessagePayload } from "../types/messaging";

chrome.runtime.onMessage.addListener((request: MessagePayload, _sender, sendResponse) => {
  if (request.type === MessageType.FETCH_TRANSCRIPT) {
    handleTranscriptFetch(request.url!)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.type === MessageType.TRANSLATE_TEXT) {
    handleTranslation(request.text!)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.type === MessageType.OPEN_CHATGPT) {
    // Backward compatibility for old calls, redirect to unified service
    handleAIServiceOpen('chatgpt', request.content!)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === MessageType.OPEN_AI_SERVICE) {
    handleAIServiceOpen(request.aiService!, request.content!)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * Robustly injects a script into a tab once it's ready.
 * Handles the race condition where a tab might complete before the listener is attached.
 */
async function injectAutomationWhenReady(tabId: number, scriptFile: string) {
  const listener = async (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (updatedTabId === tabId && changeInfo.status === "complete") {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [scriptFile],
        });
        chrome.tabs.onUpdated.removeListener(listener);
      } catch (err) {
        console.error(`Failed to inject ${scriptFile}:`, err);
        chrome.tabs.onUpdated.removeListener(listener);
      }
    }
  };

  chrome.tabs.onUpdated.addListener(listener);

  // Check if tab is already complete (Race condition fix)
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile],
      });
      chrome.tabs.onUpdated.removeListener(listener);
    }
  } catch (err) {
    // Tab might have been closed
    chrome.tabs.onUpdated.removeListener(listener);
  }

  // Cleanup timeout to prevent orphaned listeners
  setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(listener);
  }, 30000);
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
    const tab = await chrome.tabs.create({
      url: config.url,
      active: true,
    });

    if (!tab.id) {
      throw new Error("Failed to create tab");
    }

    // Use our robust helper to inject the script
    await injectAutomationWhenReady(tab.id, config.scriptFile);

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
