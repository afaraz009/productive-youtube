//handles authentication operations and state

import { useCallback, useEffect, useState } from "react";
import * as authApi from "../auth/authApi";
import type { AuthResponse, AuthUser } from "../auth/types";
//The chrome extension context is the environment in which a Chrome extension runs. It provides access to the Chrome APIs, such as chrome.runtime, chrome.storage, and others, which allow the extension to interact with the browser and perform various tasks. The context is available when the extension is running in a background script, content script, or popup, but not in a regular web page.
//hasExtentionContext checks if the chrome extension context is available
const hasExtensionContext = () =>
  typeof chrome !== "undefined" && !!chrome.runtime?.id;

//this function is a custom React hook that provides authentication state and actions for the extension's popup
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // initial status check
  const [busy, setBusy] = useState(false);       // a sign-in/up/out is in flight
  const [error, setError] = useState<string | null>(null);


  //auth ...
  //useEffect with empty dependency array runs once on mount, checking the authentication status and setting up a listener for changes in chrome storage
  useEffect(() => {
    // Lets the popup render under `vite dev`, where chrome.* doesn't exist
    
    if (!hasExtensionContext()) {
      setLoading(false);
      return;
    }

    let active = true;

    //auth...
    //sends message to background service worke to get the status
    authApi.getStatus().then((res) => {
      if (!active) return;
      if (res.success) setUser(res.user);
      setLoading(false);
    });
    //onStorageChanged listens for changes in the chrome storage and updates the user state accordingly
    const onStorageChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes.auth_status) {
        setUser((changes.auth_status.newValue as AuthUser | null) ?? null);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);

    return () => {
      active = false; // avoids setState after the popup closes
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
  }, []);

  // Shared wrapper: busy flag, error handling, and user update
  const run = useCallback(async (action: () => Promise<AuthResponse>) => {
    setBusy(true);
    setError(null);
    const res = await action();
    setBusy(false);
    if (res.success) {
      setUser(res.user);
    } else {
      setError(res.error);
    }
    return res;
  }, []);
  //signIn calls the run function with the signIn action from authApi
  const signIn = useCallback(
    (email: string, password: string) => run(() => authApi.signIn(email, password)),
    [run]
  );
  const signUp = useCallback(
    (email: string, password: string) => run(() => authApi.signUp(email, password)),
    [run]
  );
  const signOut = useCallback(() => run(() => authApi.signOut()), [run]);
  const clearError = useCallback(() => setError(null), []);

  return { user, loading, busy, error, signIn, signUp, signOut, clearError };
}