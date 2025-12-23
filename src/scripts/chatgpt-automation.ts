// ChatGPT automation script - injected into chatgpt.com pages
// Retrieves transcript from storage, pastes into input field, and submits

interface StoredContent {
  content: string;
  timestamp: number;
}

const INPUT_SELECTORS = [
  'textarea#prompt-textarea',
  'div[contenteditable="true"][data-id="root"]',
  'div[contenteditable="true"]',
  'textarea[placeholder*="Message"]',
  'textarea[data-id="root"]',
];

const SUBMIT_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[aria-label*="Send"]',
  'button[type="submit"]',
  'button svg[class*="icon-send"]',
];

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(
  selectors: string[],
  timeout: number = 10000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          resolve(element);
          return;
        }
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Element not found within timeout'));
        return;
      }

      setTimeout(checkElement, 100);
    };

    checkElement();
  });
}

/**
 * Set input value and trigger events
 */
function setInputValue(element: HTMLElement, value: string): void {
  if (element instanceof HTMLTextAreaElement) {
    // For textarea elements
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    // For contenteditable divs
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // Some implementations need this
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value,
    });
    element.dispatchEvent(inputEvent);
  }

  // Focus the element to ensure it's active
  element.focus();
}

/**
 * Find and click the submit button
 */
async function clickSubmitButton(): Promise<void> {
  // Wait a bit for the submit button to become enabled
  await new Promise(resolve => setTimeout(resolve, 500));

  for (const selector of SUBMIT_SELECTORS) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && !button.disabled) {
      button.click();
      return;
    }
  }

  // If no button found directly, try finding by SVG parent
  const sendIcon = document.querySelector('svg[class*="send"]');
  if (sendIcon) {
    const button = sendIcon.closest('button') as HTMLButtonElement;
    if (button && !button.disabled) {
      button.click();
      return;
    }
  }

  throw new Error('Submit button not found or disabled');
}

/**
 * Main automation function
 */
async function automateChatGPT(): Promise<void> {
  try {
    console.log('[ChatGPT Automation] Starting automation...');

    // Retrieve content from storage
    const result = await chrome.storage.local.get('chatgpt_content');
    const storedData = result.chatgpt_content as StoredContent | undefined;

    if (!storedData || !storedData.content) {
      console.error('[ChatGPT Automation] No content found in storage');
      return;
    }

    console.log('[ChatGPT Automation] Content retrieved from storage');

    // Wait for input field to be ready
    console.log('[ChatGPT Automation] Waiting for input field...');
    const inputElement = await waitForElement(INPUT_SELECTORS);
    console.log('[ChatGPT Automation] Input field found:', inputElement.tagName);

    // Set the content
    setInputValue(inputElement, storedData.content);
    console.log('[ChatGPT Automation] Content pasted into input field');

    // Wait a moment for the UI to update
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click submit button
    await clickSubmitButton();
    console.log('[ChatGPT Automation] Submit button clicked');

    // Clean up storage
    await chrome.storage.local.remove('chatgpt_content');
    console.log('[ChatGPT Automation] Storage cleaned up');

  } catch (error) {
    console.error('[ChatGPT Automation] Error:', error);
    // Don't clean up storage on error, user might want to retry
  }
}

// Run automation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(automateChatGPT, 1000);
  });
} else {
  setTimeout(automateChatGPT, 1000);
}
