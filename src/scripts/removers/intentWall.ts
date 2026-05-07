import { getSettings } from "../settings";
import { isHomePage } from "../transcript/utils";

let intentVerified = false;

/**
 * Creates and manages the Intent Wall overlay
 */
export function showIntentWall(): void {
  const settings = getSettings();
  
  // Only show if:
  // 1. Feature is enabled
  // 2. We are on the homepage
  // 3. User hasn't verified intent in this session
  // 4. Mode is NOT 'relax'
  if (!settings.enableIntentWall || !isHomePage() || intentVerified || settings.mode === 'relax') {
    removeIntentWall();
    return;
  }

  // Prevent multiple walls
  if (document.getElementById('productive-intent-wall')) return;

  const wall = document.createElement('div');
  wall.id = 'productive-intent-wall';
  
  // Check for dark mode
  const isDark = document.documentElement.getAttribute('dark') !== null || 
                 window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) wall.classList.add('dark');

  wall.innerHTML = `
    <div class="intent-content">
      <div class="intent-header">What is your goal today?</div>
      <div class="intent-subheader">State your intent to stay focused and avoid distractions.</div>
      <div class="intent-input-container">
        <input type="text" class="intent-input" placeholder="e.g. Learn React Hooks, Master CSS Grid..." autofocus>
      </div>
      <div class="intent-hint">Press Enter to start your productive session</div>
    </div>
  `;

  document.body.appendChild(wall);

  const input = wall.querySelector('.intent-input') as HTMLInputElement;
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim().length > 0) {
      handleIntentSubmit(input.value.trim());
    }
  });

  // Auto-focus input
  setTimeout(() => input?.focus(), 100);
}

function handleIntentSubmit(intent: string): void {
  intentVerified = true;
  
  // Hide the wall
  const wall = document.getElementById('productive-intent-wall');
  if (wall) {
    wall.style.opacity = '0';
    setTimeout(() => wall.remove(), 300);
  }

  // Redirect to search results for that intent
  window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(intent)}`;
}

export function removeIntentWall(): void {
  const wall = document.getElementById('productive-intent-wall');
  if (wall) wall.remove();
}

/**
 * Resets the intent verification (e.g. when navigating back to homepage after a while)
 */
export function resetIntent(): void {
  intentVerified = false;
}
