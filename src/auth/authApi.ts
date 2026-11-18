import type { AuthRequest, AuthResponse } from "./types";

function send(request: AuthRequest): Promise<AuthResponse> {
  return new Promise((resolve) => {
    //this callback will run when background.ts sends a response
    chrome.runtime.sendMessage(request, (response?: AuthResponse) => {
      // Reading lastError is required, or Chrome logs an "unchecked" error
      if (chrome.runtime.lastError || !response) {
        resolve({
          success: false,
          error: "Could not reach the extension. Please try again.",
        });
        return;
      }
      //resolves the promise with the response from background.ts
      //this promise will reach the code in useAuth.ts
      resolve(response);
    });
  });
}
// these go to background script, which handles the actual auth logic
export const signUp = (email: string, password: string) =>
  send({ type: "AUTH_SIGN_UP", email, password });

export const signIn = (email: string, password: string) =>
  send({ type: "AUTH_SIGN_IN", email, password });

export const signOut = () => send({ type: "AUTH_SIGN_OUT" });


//auth ... background.ts
//check the send function above
export const getStatus = () => send({ type: "AUTH_GET_STATUS" });