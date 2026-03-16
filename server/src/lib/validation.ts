import type { BulletEnhanceRequest, ResumeData } from "@resume-builder/shared";
import { ApiError } from "./errors.js";

export function assertResumeData(value: unknown): asserts value is ResumeData {
  if (!value || typeof value !== "object") {
    throw new ApiError(400, "A valid resume payload is required.");
  }

  const data = value as ResumeData;

  if (!data.contact?.name || !data.contact?.email || !data.contact?.phone) {
    throw new ApiError(400, "Contact name, email, and phone are required.");
  }

  if (!Array.isArray(data.experience) || !Array.isArray(data.education) || !Array.isArray(data.projects)) {
    throw new ApiError(400, "Resume sections must be arrays.");
  }

  if (!data.skills || typeof data.skills !== "object") {
    throw new ApiError(400, "Skills must be provided as a category map.");
  }

  if (!Array.isArray(data.certifications)) {
    throw new ApiError(400, "Certifications must be an array.");
  }
}

export function assertBulletRequest(value: unknown): asserts value is BulletEnhanceRequest {
  if (!value || typeof value !== "object") {
    throw new ApiError(400, "A valid bullet enhancement payload is required.");
  }

  const payload = value as BulletEnhanceRequest;

  if (!Array.isArray(payload.bullets) || typeof payload.context !== "string") {
    throw new ApiError(400, "Bullets and context are required.");
  }
}
