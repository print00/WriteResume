import { Router } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import type { BulletsResponse, ResumeData, SummaryResponse } from "@resume-builder/shared";
import { getAnthropicClient } from "../lib/anthropic.js";
import { ApiError } from "../lib/errors.js";
import { assertBulletRequest, assertResumeData } from "../lib/validation.js";

const router = Router();
const MODEL = "claude-sonnet-4-20250514";

function extractTextBlocks(
  response: Awaited<ReturnType<Anthropic["messages"]["create"]>>,
) {
  if (!("content" in response)) {
    throw new ApiError(502, "The AI service returned an unsupported response.");
  }

  return response.content
    .filter(
      (block): block is Extract<(typeof response.content)[number], { type: "text" }> =>
        block.type === "text",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

router.post("/summary", async (req, res, next) => {
  try {
    assertResumeData(req.body);
    const data = req.body as ResumeData;
    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 250,
      system:
        'You are an expert resume coach. Write a concise 2–3 sentence professional summary for a software engineer resume. Do not use the word "I". Front-load keywords relevant to top tech companies. Make the candidate sound accomplished and specific. Return only the summary paragraph with no extra commentary.',
      messages: [
        {
          role: "user",
          content: `Resume data:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    const summary = extractTextBlocks(message);

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
    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system:
        "You are an expert resume coach for FAANG-level engineering roles. Rewrite resume bullets to be punchy, metric-driven, and ATS-optimized. Each bullet must start with a strong past-tense action verb. Include at least one quantifiable result. Keep each bullet to one or two lines. Return only the rewritten bullets as a numbered list with no extra commentary.",
      messages: [
        {
          role: "user",
          content: `Context: ${context}\nBullets:\n${bullets
            .map((bullet: string, index: number) => `${index + 1}. ${bullet}`)
            .join("\n")}`,
        },
      ],
    });

    const text = extractTextBlocks(message);
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
