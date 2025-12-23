// Background service worker for handling API calls (bypasses CORS)

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
});

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
    console.error("Translation error:", error);
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
            console.log("ChatGPT automation script injected");
            // Clean up listener
            chrome.tabs.onUpdated.removeListener(listener);
          })
          .catch((error) => {
            console.error("Failed to inject automation script:", error);
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
    console.error("ChatGPT open error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open ChatGPT",
    };
  }
}
