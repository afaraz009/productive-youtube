// Claude automation script - injected into claude.ai pages
// Retrieves content from storage, pastes into input field, and submits

interface StoredContent {
  content: string;
  timestamp: number;
}

const INPUT_SELECTORS = [
  'div[contenteditable="true"][data-placeholder]',
  'div[contenteditable="true"][role="textbox"]',
  'textarea[placeholder*="Talk to Claude"]',
  'div[contenteditable="true"]',
  'textarea',
];

const SUBMIT_SELECTORS = [
  'button[aria-label*="Send"]',
  'button[aria-label*="Submit"]',
  'button[type="submit"]',
  'button svg[viewBox*="send"]',
  'button[class*="send"]',
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
    if (button && !button.disabled && !button.hasAttribute('disabled')) {
      button.click();
      return;
    }
  }

  // If no button found directly, try finding by SVG parent
  const sendIcon = document.querySelector('svg[viewBox*="send"]');
  if (sendIcon) {
    const button = sendIcon.closest('button') as HTMLButtonElement;
    if (button && !button.disabled && !button.hasAttribute('disabled')) {
      button.click();
      return;
    }
  }

  throw new Error('Submit button not found or disabled');
}

/**
 * Main automation function
 */
async function automateClaude(): Promise<void> {
  try {
    console.log('[Claude Automation] Starting automation...');

    // Retrieve content from storage
    const result = await chrome.storage.local.get('claude_content');
    const storedData = result.claude_content as StoredContent | undefined;

    if (!storedData || !storedData.content) {
      console.error('[Claude Automation] No content found in storage');
      return;
    }

    console.log('[Claude Automation] Content retrieved from storage');

    // Wait for input field to be ready
    console.log('[Claude Automation] Waiting for input field...');
    const inputElement = await waitForElement(INPUT_SELECTORS);
    console.log('[Claude Automation] Input field found:', inputElement.tagName);

    // Set the content
    setInputValue(inputElement, storedData.content);
    console.log('[Claude Automation] Content pasted into input field');

    // Wait a moment for the UI to update
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click submit button
    await clickSubmitButton();
    console.log('[Claude Automation] Submit button clicked');

    // Clean up storage
    await chrome.storage.local.remove('claude_content');
    console.log('[Claude Automation] Storage cleaned up');

  } catch (error) {
    console.error('[Claude Automation] Error:', error);
    // Don't clean up storage on error, user might want to retry
  }
}

// Run automation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(automateClaude, 1000);
  });
} else {
  setTimeout(automateClaude, 1000);
}
