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

function extractBalancedJsonSegment(text: string) {
  const start = text.search(/[\[{]/);

  if (start === -1) {
    return null;
  }

  const opening = text[start];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
      continue;
    }

    if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function parseJsonFromText<T>(text: string): T {
  const normalized = stripCodeFences(text);
  const candidate = extractBalancedJsonSegment(normalized);

  if (!candidate) {
    throw new ApiError(502, "The AI service returned an unreadable response.");
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const fallback = extractBalancedJsonSegment(
      normalized.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
    );
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
