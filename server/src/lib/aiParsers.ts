import { ApiError } from "./errors.js";

export function extractText(response: { text?: string | undefined }) {
  return response.text?.trim() ?? "";
}

export function stripCodeFences(text: string) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseJsonFromText<T>(text: string): T {
  const normalized = stripCodeFences(text);
  const firstBrace = normalized.indexOf("{");
  const firstBracket = normalized.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  if (start === -1) {
    throw new ApiError(502, "The AI service returned an unreadable response.");
  }

  const candidate = normalized.slice(start);

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const objectMatch = normalized.match(/\{[\s\S]*\}$/);
    const arrayMatch = normalized.match(/\[[\s\S]*\]$/);
    const fallback = objectMatch?.[0] ?? arrayMatch?.[0];
    if (!fallback) {
      throw new ApiError(502, "The AI service returned invalid JSON.");
    }

    try {
      return JSON.parse(fallback) as T;
    } catch {
      throw new ApiError(502, "The AI service returned invalid JSON.");
    }
  }
}

export function parseBulletArray(text: string, originals: string[]) {
  const normalized = stripCodeFences(text);
  const jsonMatch = normalized.match(/\[[\s\S]*\]/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .slice(0, originals.length);
      }
    } catch {
      // Fall through to the line-based parser below.
    }
  }

  return normalized
    .split("\n")
    .map((line: string) =>
      line
        .replace(/^```(?:json)?$/i, "")
        .replace(/^[\s,\[]+/, "")
        .replace(/[\s,\]]+$/, "")
        .replace(/^\s*(?:[-*•]|\d+[\).\s-])\s*/, "")
        .replace(/^"+/, "")
        .replace(/"+$/, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, originals.length);
}
