//supabase javascript library
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../notes/database.types";

// we will use our custome adapter instead of the default one for session persistence
const chromeStorageAdapter = {

  //retrieve an exisitng session (when supabase restores auth state) in chrome storage
  //happens via supabase library
  getItem: async (key: string) => {
    const result = await chrome.storage.local.get(key);
    return (result[key] as string | undefined) ?? null;
  },
  //to save a session (when persists updated auth state)
  setItem: async (key: string, value: string) => {
    await chrome.storage.local.set({ [key]: value });
  },
  //when removing a persisted session (when user signs out)
  removeItem: async (key: string) => {
    await chrome.storage.local.remove(key);
  },
};


//client created
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: chromeStorageAdapter,
      storageKey: "pyt-auth",      // must not collide with your settings keys
      persistSession: true,
      autoRefreshToken: false,     // service worker sleeps; timers can't be trusted
      detectSessionInUrl: false,   // no URL-based sessions in an extension
    },
  }
);