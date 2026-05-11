// DOM utilities for waiting and retry logic

/**
 * Wait for a DOM element to exist with timeout
 * @param selector - CSS selector to wait for
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves with the element or null if timeout
 */
export function waitForElement(
  selector: string,
  timeout: number = 10000
): Promise<Element | null> {
  return new Promise((resolve) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Productive YouTube: Element ${selector} found immediately`);
      resolve(element);
      return;
    }

    console.log(`Productive YouTube: Waiting for element ${selector}...`);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      console.warn(
        `Productive YouTube: Timeout waiting for element ${selector}`
      );
      observer.disconnect();
      resolve(null);
    }, timeout);

    // Set up MutationObserver to watch for element
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Productive YouTube: Element ${selector} appeared`);
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Wait for multiple elements to exist
 * @param selectors - Array of CSS selectors
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves when all elements exist or timeout
 */
export async function waitForElements(
  selectors: string[],
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();

  for (const selector of selectors) {
    const remainingTime = timeout - (Date.now() - startTime);
    if (remainingTime <= 0) {
      console.warn(
        `Productive YouTube: Timeout waiting for elements, stopped at ${selector}`
      );
      return false;
    }

    const element = await waitForElement(selector, remainingTime);
    if (!element) {
      return false;
    }
  }

  return true;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 * @returns Result from successful function call
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500
): Promise<T | null> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Productive YouTube: Retry attempt ${attempt + 1}/${maxRetries + 1}`
      );
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(
        `Productive YouTube: Attempt ${attempt + 1} failed:`,
        error
      );

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Productive YouTube: Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    `Productive YouTube: All ${maxRetries + 1} attempts failed:`,
    lastError
  );
  return null;
}

/**
 * Check if the secondary sidebar container is ready
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves with the container or null
 */
export async function waitForSecondarySidebar(
  timeout: number = 10000
): Promise<Element | null> {
  // Try multiple selectors in order of preference
  const selectors = [
    "#secondary",
    "ytd-watch-next-secondary-results-renderer",
    "#secondary-inner",
    "#related",
  ];

  for (const selector of selectors) {
    const element = await waitForElement(selector, timeout / selectors.length);
    if (element) {
      console.log(
        `Productive YouTube: Found secondary sidebar using selector: ${selector}`
      );
      return element;
    }
  }

  console.warn(
    "Productive YouTube: No secondary sidebar found after trying all selectors"
  );
  return null;
}

/**
 * Wait for YouTube's player to be ready
 * @param timeout - Maximum wait time in milliseconds
 * @returns Promise that resolves when player is ready
 */
export async function waitForYouTubePlayerReady(
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();

  console.log("Productive YouTube: Checking for video player...");

  // Alternative approach: wait for video element to be ready
  while (Date.now() - startTime < timeout) {
    // Check multiple indicators that the page is ready
    const videoElement = document.querySelector('video');
    const playerContainer = document.querySelector('#movie_player');
    // @ts-ignore
    const ytResponse = window.ytInitialPlayerResponse;
    // @ts-ignore
    const ytPlayer = window.ytPlayer;

    // Log what we found
    if (Date.now() - startTime < 1000) { // Only log once at start
      console.log("Productive YouTube: Found video element:", !!videoElement);
      console.log("Productive YouTube: Found player container:", !!playerContainer);
      console.log("Productive YouTube: Found ytInitialPlayerResponse:", !!ytResponse);
      console.log("Productive YouTube: Found ytPlayer:", !!ytPlayer);
    }

    // Success if we have video element AND player container
    if (videoElement && playerContainer) {
      console.log("Productive YouTube: Video player is ready (video + container found)");
      return true;
    }

    // Alternative: ytInitialPlayerResponse exists (old method)
    if (ytResponse && ytResponse.videoDetails) {
      console.log("Productive YouTube: Video player is ready (ytInitialPlayerResponse found)");
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.warn("Productive YouTube: Timeout waiting for video player after", timeout, "ms");
  return false;
}
