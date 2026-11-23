import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { AuthRequest, AuthResponse, AuthUser } from "./types";

function toUser(session: Session | null): AuthUser | null {
  return session
    ? { id: session.user.id, email: session.user.email ?? null }
    : null;
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password.";
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("email not confirmed")) return "Please confirm your email first, then log in.";
  if (m.includes("password should be")) return "Password is too short or too weak.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("fetch") || m.includes("network")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}

const fail = (message: string): AuthResponse => {
  console.error("[AUTH ERROR]", message);

  return {
    success: false,
    error: friendlyError(message),
  };
};


//this signUp is implemented by the supabase lib which sends reqs to my supabase project
async function signUp(email: string, password: string): Promise<AuthResponse> {
  //this is where the supabase request happens and we made the supabase client in supabaseClient.ts
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return fail(error.message);

  // With email confirmation ON, a duplicate email returns a fake user
  // with an empty identities array instead of an error.
  if (data.user && data.user.identities?.length === 0) {
    return fail("already registered");
  }
  return {
    success: true,
    user: toUser(data.session),
    needsEmailConfirmation: data.session === null,
  };
}

async function signIn(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message);
  return { success: true, user: toUser(data.session) };
}

async function signOut(): Promise<AuthResponse> {
  // "local" signs out this browser only, not every device
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return fail(error.message);
  return { success: true, user: null };
}

//the background recieves the result from here 
async function getStatus(): Promise<AuthResponse> {
  // getSession() refreshes an expired token on demand
  const { data, error } = await supabase.auth.getSession();
  if (error) return fail(error.message);
  return { success: true, user: toUser(data.session) };
}

//function to handle the type of request (signup, login, status, logout)

//auth ... actually checks from supabase
export async function handleAuthMessage(request: AuthRequest): Promise<AuthResponse> {
  try {
    switch (request.type) {
      case "AUTH_SIGN_UP":
        return await signUp(request.email, request.password);
      case "AUTH_SIGN_IN":
        return await signIn(request.email, request.password);
      case "AUTH_SIGN_OUT":
        return await signOut();
      case "AUTH_GET_STATUS":
        return await getStatus();
    }
    } catch (e) {
    console.error("[AUTH EXCEPTION]", e);

    return fail(e instanceof Error ? e.message : "unknown");
    }
}

// Writes login state to chrome.storage so the popup and YouTube tabs
// can react via chrome.storage.onChanged.
// Call once, synchronously, at the top level of background.ts.
export function registerAuthBroadcast(): void {
  let last: string | undefined;
  supabase.auth.onAuthStateChange((_event, session) => {
    // Do NOT await other supabase calls in here (deadlock risk)
    //after user is logged in we will extract the user id and email
    const status = toUser(session);

    const serialized = JSON.stringify(status);
    if (serialized === last) return; // skip redundant writes
    last = serialized;
    //updates the status
    void chrome.storage.local.set({ auth_status: status });
  });
}