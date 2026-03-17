import { Router } from "express";
import type { BulletsResponse, ResumeData, SummaryResponse } from "@resume-builder/shared";
import { getGeminiClient } from "../lib/gemini.js";
import { ApiError } from "../lib/errors.js";
import { assertBulletRequest, assertResumeData } from "../lib/validation.js";

const router = Router();
const MODEL = "gemini-2.5-flash";

function extractText(response: { text?: string | undefined }) {
  return response.text?.trim() ?? "";
}

function stripCodeFences(text: string) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseBulletArray(text: string, originals: string[]) {
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
        .replace(/^[[\],"]+$/, "")
        .replace(/^\s*(?:[-*•]|\d+[\).\s-])\s*/, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, originals.length);
}

router.post("/summary", async (req, res, next) => {
  try {
    assertResumeData(req.body);
    const data = req.body as ResumeData;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Resume data:\n${JSON.stringify(data, null, 2)}`,
      config: {
        maxOutputTokens: 400,
        temperature: 0.8,
        systemInstruction:
          'You are an expert executive resume writer for high-caliber software engineers. Write a polished, confident professional summary in 3-5 sentences. Use a professional tone that sounds specific, credible, and senior, not generic or overly brief. Highlight technical depth, business impact, and leadership signals when supported by the resume data. Naturally include relevant keywords for competitive software engineering roles, but avoid keyword stuffing. Do not use first-person pronouns. Avoid vague claims like "hardworking" or "team player" unless supported by evidence. Return only the summary paragraph with no heading or extra commentary.',
      },
    });

    const summary = extractText(response);

    if (!summary) {
      throw new ApiError(502, "The AI service did not return a summary.");
    }

    const payload: SummaryResponse = { summary };
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/bullets", async (req, res, next) => {
  try {
    assertBulletRequest(req.body);
    const { bullets, context } = req.body;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Context: ${context}\nBullets:\n${bullets
        .map((bullet: string, index: number) => `${index + 1}. ${bullet}`)
        .join("\n")}`,
      config: {
        maxOutputTokens: 700,
        temperature: 0.6,
        systemInstruction:
          "You are an expert resume writer for top-tier software engineering roles. Rewrite each resume bullet so it sounds polished, specific, and professionally credible. Start each bullet with a strong past-tense action verb. Emphasize ownership, technical complexity, scale, and measurable business or product impact whenever the source supports it. Preserve factual accuracy; do not invent tools, metrics, or achievements. If an exact metric is missing, strengthen the bullet with concrete scope or outcome language instead of making up numbers. Keep each bullet concise but substantial, usually one sentence and up to two lines in a resume. Remove filler language, weak adjectives, and repeated phrasing. Return only a valid JSON array of strings with exactly the same number of bullets as the input and no extra commentary.",
      },
    });

    const text = extractText(response);
    const parsed = parseBulletArray(text, bullets);

    if (parsed.length === 0) {
      throw new ApiError(502, "The AI service did not return any usable bullets. Please try again.");
    }

    const payload: BulletsResponse = {
      bullets: bullets.map((bullet, index) => parsed[index] || bullet),
    };
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
