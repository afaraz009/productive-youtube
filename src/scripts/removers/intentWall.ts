import { getSettings } from "../settings";
import { isHomePage } from "../transcript/utils";

let intentVerified = false;

/**
 * Creates and manages the Intent Wall overlay
 * Now simplified to prompt use of the native YouTube search bar
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
      <div class="intent-icon">🎯</div>
      <div class="intent-header">What is your goal today?</div>
      <div class="intent-subheader">Use the search bar at the top to start your focused session.</div>
      <div class="intent-arrow">↑</div>
    </div>
  `;

  document.body.appendChild(wall);
  
  // Add a listener to the native YouTube search form to hide the wall when user searches
  setupNativeSearchListener();
}

/**
 * Detects when a user submits a search in the native YouTube search bar
 */
function setupNativeSearchListener(): void {
  const searchForm = document.querySelector('form#search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', () => {
      intentVerified = true;
      removeIntentWall();
    }, { once: true });
  }
}

export function removeIntentWall(): void {
  const wall = document.getElementById('productive-intent-wall');
  if (wall) {
    wall.style.opacity = '0';
    setTimeout(() => wall.remove(), 300);
  }
}

export function resetIntent(): void {
  intentVerified = false;
}
