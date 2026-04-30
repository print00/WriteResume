import { Router } from "express";
import multer from "multer";
import { Type } from "@google/genai";
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

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackResumeReview(resumeText: string): ResumeReviewResponse {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const metricMatches = resumeText.match(/(\d+%|\d+x|\$\d+|\d+[KM]|\d+ms)/gi) ?? [];
  const hasLinkedIn = /linkedin/i.test(resumeText);
  const hasGithub = /github|portfolio/i.test(resumeText);
  const hasEducation = /education|b\.s\.|bachelor|master|university|college/i.test(resumeText);
  const experienceSignals = (
    resumeText.match(/engineer|developer|intern|software|full-stack|backend|frontend/gi) ?? []
  ).length;
  const score =
    (lines.length >= 12 ? 20 : 10) +
    Math.min(metricMatches.length, 4) * 10 +
    (hasLinkedIn ? 10 : 0) +
    (hasGithub ? 10 : 0) +
    (hasEducation ? 10 : 0) +
    Math.min(experienceSignals, 3) * 10;

  return {
    score: clampScore(score),
    overview:
      "Generated a fallback review because the AI returned an unexpected format. The uploaded resume was still parsed successfully.",
    strengths: [
      hasEducation
        ? "Education details are present, which helps ATS parsers classify academic background."
        : "Resume text was uploaded successfully and can now be iterated on inside the builder.",
      metricMatches.length > 0
        ? "Includes quantified achievements, which improves recruiter scanability and ATS strength."
        : "Has room to add quantified impact statements for stronger screening performance.",
      hasLinkedIn || hasGithub
        ? "Contains at least one external profile link that supports recruiter verification."
        : "Could be improved by adding LinkedIn, GitHub, or portfolio links.",
    ],
    improvements: [
      "Add more metrics, scope, or outcome language to experience bullets for stronger impact.",
      "Tailor the summary and keywords to the target role before exporting the next resume version.",
      "Ensure each experience entry starts with a strong action verb and one concrete result.",
    ],
    keywordGaps: [
      "System design",
      "Scalability",
      "APIs",
      "Cloud",
    ],
    sectionFeedback: [
      "Review bullet specificity and replace generic phrasing with technical decisions, ownership, and measurable outcomes.",
      "Use the tailoring flow with a job description to align the resume with role-specific keywords.",
    ],
    parsedText: resumeText,
  };
}

const commonSkillWords = new Set([
  "and",
  "are",
  "for",
  "from",
  "job",
  "the",
  "that",
  "this",
  "with",
  "will",
  "you",
  "your",
]);

function extractRecommendedKeywords(jobDescription: string) {
  const matches = jobDescription
    .match(/\b[A-Za-z][A-Za-z+#.-]{2,}\b/g)
    ?.map((word) => word.trim())
    .filter((word) => !commonSkillWords.has(word.toLowerCase())) ?? [];
  const unique = [...new Map(matches.map((word) => [word.toLowerCase(), word])).values()];

  return unique.slice(0, 12);
}

function fallbackTailoredResume(
  resume: ResumeData,
  jobDescription: string,
): TailorResumeResponse {
  const recommendedKeywords = extractRecommendedKeywords(jobDescription);
  const roleSignals = recommendedKeywords.slice(0, 5).join(", ");
  const currentTitle =
    resume.experience.find((item) => item.title.trim())?.title.trim() ||
    "software engineering";

  return {
    matchScore: recommendedKeywords.length > 0 ? 62 : 50,
    summary:
      resume.summary ||
      `Results-focused ${currentTitle} candidate with experience aligned to the target role${roleSignals ? ` across ${roleSignals}` : ""}.`,
    recommendedKeywords,
    notes: [
      "The AI response could not be parsed as JSON, so this conservative fallback preserved the current resume content.",
      "Review the recommended keywords and weave only the accurate ones into the summary, skills, and achievement bullets.",
      "Add measurable impact to bullets before export so the tailored version reads as specific rather than keyword-only.",
    ],
    experience: resume.experience.map((item) => ({
      id: item.id,
      bullets: item.bullets,
    })),
    projects: resume.projects.map((item) => ({
      id: item.id,
      bullets: item.bullets,
    })),
  };
}

const tailoredBulletSectionSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    bullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["id", "bullets"],
};

const tailorResumeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    recommendedKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    experience: {
      type: Type.ARRAY,
      items: tailoredBulletSectionSchema,
    },
    projects: {
      type: Type.ARRAY,
      items: tailoredBulletSectionSchema,
    },
  },
  required: ["matchScore", "summary", "recommendedKeywords", "notes", "experience", "projects"],
};

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

      let parsed: Omit<ResumeReviewResponse, "parsedText">;

      try {
        parsed = parseJsonFromText<Omit<ResumeReviewResponse, "parsedText">>(
          extractText(response),
        );
      } catch (error) {
        if (error instanceof ApiError) {
          const fallback = fallbackResumeReview(resumeText);
          res.json(fallback);
          return;
        }
        throw error;
      }

      const payload: ResumeReviewResponse = {
        score: clampScore(Number(parsed.score) || 0),
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
        responseMimeType: "application/json",
        responseSchema: tailorResumeResponseSchema,
        systemInstruction:
          'You are an expert resume writer for FAANG-level software engineering roles. Tailor the provided resume to the supplied job description while preserving factual accuracy. Return JSON only. Rewrite summary and bullets to better match the job description, but do not invent technologies, metrics, or accomplishments. Keep bullet counts aligned to the original entries. Every experience and project item must use the same id from the input.',
      },
    });

    let parsed: TailorResumeResponse;

    try {
      parsed = parseJsonFromText<TailorResumeResponse>(extractText(response));
    } catch (error) {
      if (error instanceof ApiError) {
        res.json(fallbackTailoredResume(resume, jobDescription));
        return;
      }

      throw error;
    }

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
