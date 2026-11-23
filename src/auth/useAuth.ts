import { useCallback, useEffect, useState } from "react";
import * as authApi from "../auth/authApi";
import type { AuthResponse, AuthUser } from "../auth/types";

const hasExtensionContext = () =>
  typeof chrome !== "undefined" && !!chrome.runtime?.id;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // initial status check
  const [busy, setBusy] = useState(false);       // a sign-in/up/out is in flight
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lets the popup render under `vite dev`, where chrome.* doesn't exist
    if (!hasExtensionContext()) {
      setLoading(false);
      return;
    }

    let active = true;

    authApi.getStatus().then((res) => {
      if (!active) return;
      if (res.success) setUser(res.user);
      setLoading(false);
    });

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