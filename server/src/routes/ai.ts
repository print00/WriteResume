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

router.post("/summary", async (req, res, next) => {
  try {
    assertResumeData(req.body);
    const data = req.body as ResumeData;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Resume data:\n${JSON.stringify(data, null, 2)}`,
      config: {
        maxOutputTokens: 250,
        temperature: 0.6,
        systemInstruction:
          'You are an expert resume coach. Write a concise 2–3 sentence professional summary for a software engineer resume. Do not use the word "I". Front-load keywords relevant to top tech companies. Make the candidate sound accomplished and specific. Return only the summary paragraph with no extra commentary.',
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
        maxOutputTokens: 500,
        temperature: 0.5,
        systemInstruction:
          "You are an expert resume coach for FAANG-level engineering roles. Rewrite resume bullets to be punchy, metric-driven, and ATS-optimized. Each bullet must start with a strong past-tense action verb. Include at least one quantifiable result. Keep each bullet to one or two lines. Return only the rewritten bullets as a numbered list with no extra commentary.",
      },
    });

    const text = extractText(response);
    const parsed = text
      .split("\n")
      .map((line: string) => line.replace(/^\s*\d+[\).\s-]*/, "").trim())
      .filter(Boolean)
      .slice(0, bullets.length);

    if (parsed.length !== bullets.length) {
      throw new ApiError(
        502,
        "The AI service returned an unexpected number of bullets. Please try again.",
      );
    }

    const payload: BulletsResponse = { bullets: parsed };
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
