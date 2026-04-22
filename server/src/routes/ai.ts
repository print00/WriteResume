import { Router } from "express";
import multer from "multer";
import type {
  BulletsResponse,
  ExtractedTextResponse,
  ResumeData,
  ResumeReviewResponse,
  SummaryResponse,
  TailorResumeResponse,
} from "@resume-builder/shared";
import { extractText, parseBulletArray, parseJsonFromText } from "../lib/aiParsers.js";
import { extractTextFromUpload } from "../lib/fileText.js";
import { getGeminiClient } from "../lib/gemini.js";
import { ApiError } from "../lib/errors.js";
import {
  assertBulletRequest,
  assertResumeData,
  assertTailorResumeRequest,
} from "../lib/validation.js";

const router = Router();
const MODEL = "gemini-2.5-flash";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.post("/summary", async (req, res, next) => {
  try {
    assertResumeData(req.body);
    const data = req.body as ResumeData;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Resume data:\n${JSON.stringify(data, null, 2)}`,
      config: {
        maxOutputTokens: 2000,
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

router.post("/extract-text", upload.single("file"), async (req, res, next) => {
  try {
    const text = await extractTextFromUpload(req.file);
    const payload: ExtractedTextResponse = {
      fileName: req.file?.originalname ?? "upload",
      mimeType: req.file?.mimetype ?? "application/octet-stream",
      text,
    };
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/review-upload",
  upload.single("resume"),
  async (req, res, next) => {
    try {
      const resumeText = await extractTextFromUpload(req.file);
      const client = getGeminiClient();

      const response = await client.models.generateContent({
        model: MODEL,
        contents: `Uploaded resume text:\n${resumeText}`,
        config: {
          maxOutputTokens: 1800,
          temperature: 0.2,
          systemInstruction:
            'You are an ATS and resume reviewer for mid-level software engineers applying to top-tier tech companies. Analyze the uploaded resume text and return only valid JSON with this exact shape: {"score": number, "overview": string, "strengths": string[], "improvements": string[], "keywordGaps": string[], "sectionFeedback": string[]}. Score should be 0-100 and reflect ATS readiness, specificity, metrics, structure, and technical depth. Keep feedback specific and actionable.',
        },
      });

      const parsed = parseJsonFromText<Omit<ResumeReviewResponse, "parsedText">>(
        extractText(response),
      );

      const payload: ResumeReviewResponse = {
        score: Number(parsed.score) || 0,
        overview: parsed.overview || "",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        keywordGaps: Array.isArray(parsed.keywordGaps) ? parsed.keywordGaps : [],
        sectionFeedback: Array.isArray(parsed.sectionFeedback)
          ? parsed.sectionFeedback
          : [],
        parsedText: resumeText,
      };

      res.json(payload);
    } catch (error) {
      next(error);
    }
  },
);

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

router.post("/tailor-resume", async (req, res, next) => {
  try {
    assertTailorResumeRequest(req.body);
    const { resume, jobDescription } = req.body;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Job description:\n${jobDescription}\n\nCurrent resume data:\n${JSON.stringify(
        resume,
        null,
        2,
      )}`,
      config: {
        maxOutputTokens: 2800,
        temperature: 0.35,
        systemInstruction:
          'You are an expert resume writer for FAANG-level software engineering roles. Tailor the provided resume to the supplied job description while preserving factual accuracy. Return only valid JSON with this exact shape: {"matchScore": number, "summary": string, "recommendedKeywords": string[], "notes": string[], "experience": [{"id": string, "bullets": string[]}], "projects": [{"id": string, "bullets": string[]}]} . Rewrite summary and bullets to better match the job description, but do not invent technologies, metrics, or accomplishments. Keep bullet counts aligned to the original entries.',
      },
    });

    const parsed = parseJsonFromText<TailorResumeResponse>(extractText(response));
    const experience = Array.isArray(parsed.experience) ? parsed.experience : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

    const payload: TailorResumeResponse = {
      matchScore: Number(parsed.matchScore) || 0,
      summary: parsed.summary || resume.summary,
      recommendedKeywords: Array.isArray(parsed.recommendedKeywords)
        ? parsed.recommendedKeywords
        : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      experience: resume.experience.map((item) => {
        const match = experience.find((entry) => entry.id === item.id);
        return {
          id: item.id,
          bullets:
            match?.bullets?.slice(0, item.bullets.length).filter(Boolean) ?? item.bullets,
        };
      }),
      projects: resume.projects.map((item) => {
        const match = projects.find((entry) => entry.id === item.id);
        return {
          id: item.id,
          bullets:
            match?.bullets?.slice(0, item.bullets.length).filter(Boolean) ?? item.bullets,
        };
      }),
    };

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
