// this is so that the background and content script can get login context aswell so that user operations such as notes saving canbe possible
// Type-only import: erased at build time, so no shared chunk is created
// and the content script stays a plain script with no `import` lines.
import type { AuthResponse, AuthUser } from "../auth/types";

let currentUser: AuthUser | null = null;
let initialized = false;

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function initAuthState(onChange?: (user: AuthUser | null) => void): void {
  if (initialized) return; // safe to call more than once
  initialized = true;

  const update = (user: AuthUser | null) => {
    currentUser = user;
    onChange?.(user);
  };

  // 1. Initial status from the background
  try {
    chrome.runtime.sendMessage(
      { type: "AUTH_GET_STATUS" },
      (res?: AuthResponse) => {
        // Read lastError, or Chrome logs an unchecked-error warning
        if (chrome.runtime.lastError || !res) {
          update(null);
          return;
        }
        update(res.success ? res.user : null);
      }
    );
  } catch {
    // Thrown if the extension was reloaded and this script is orphaned
    update(null);
  }

  // 2. Live updates when the user logs in or out anywhere
  chrome.storage.onChanged.addListener(
    (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === "local" && changes.auth_status) {
        update((changes.auth_status.newValue as AuthUser | null) ?? null);
      }
    }
  );
}