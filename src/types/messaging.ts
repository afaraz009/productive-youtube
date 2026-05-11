// Type-safe messaging for the extension
import { AIService } from "./types";

export enum MessageType {
  FETCH_TRANSCRIPT = "FETCH_TRANSCRIPT",
  TRANSLATE_TEXT = "TRANSLATE_TEXT",
  OPEN_CHATGPT = "OPEN_CHATGPT", // Kept for backward compatibility
  OPEN_AI_SERVICE = "OPEN_AI_SERVICE"
}

export interface MessagePayload {
  type: MessageType;
  url?: string;
  text?: string;
  content?: string;
  aiService?: AIService;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
