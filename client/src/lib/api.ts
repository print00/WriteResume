import { saveAs } from "file-saver";
import type {
  BulletEnhanceRequest,
  BulletsResponse,
  ExtractedTextResponse,
  ResumeData,
  ResumeReviewResponse,
  SummaryResponse,
  TailorResumeRequest,
  TailorResumeResponse,
} from "../types/shared";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function generateSummary(payload: ResumeData) {
  const response = await fetch(getApiUrl("/api/ai/summary"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<SummaryResponse>(response);
}

export async function enhanceBullets(payload: BulletEnhanceRequest) {
  const response = await fetch(getApiUrl("/api/ai/bullets"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<BulletsResponse>(response);
}

export async function downloadResume(payload: ResumeData, format: "docx" | "pdf", name: string) {
  const response = await fetch(getApiUrl(`/api/generate/${format}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Failed to export ${format.toUpperCase()}.`;
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const fileNameBase =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "resume";
  saveAs(blob, `${fileNameBase}_resume.${format}`);
}

export async function extractTextFromFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(getApiUrl("/api/ai/extract-text"), {
    method: "POST",
    body: formData,
  });

  return parseResponse<ExtractedTextResponse>(response);
}

export async function reviewUploadedResume(file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(getApiUrl("/api/ai/review-upload"), {
    method: "POST",
    body: formData,
  });

  return parseResponse<ResumeReviewResponse>(response);
}

export async function tailorResume(payload: TailorResumeRequest) {
  const response = await fetch(getApiUrl("/api/ai/tailor-resume"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TailorResumeResponse>(response);
}
