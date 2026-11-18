//this is the type of the user object that is returned from the background script after authentication
export type AuthUser = { id: string; email: string | null };

export type AuthRequest =
//these are the types of messages that can be sent to the background script for authentication
  | { type: "AUTH_SIGN_UP"; email: string; password: string }
  | { type: "AUTH_SIGN_IN"; email: string; password: string }
  | { type: "AUTH_SIGN_OUT" }
  | { type: "AUTH_GET_STATUS" };



export type AuthResponse =
  | { success: true; user: AuthUser | null; needsEmailConfirmation?: boolean }
  | { success: false; error: string };