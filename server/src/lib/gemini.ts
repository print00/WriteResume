import { GoogleGenAI } from "@google/genai";
import { ApiError } from "./errors.js";

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "GEMINI_API_KEY is not configured. Add it to server/.env and restart the server.");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}
