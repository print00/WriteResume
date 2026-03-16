import type { ResumeData } from "@resume-builder/shared";

export interface SkillCategory {
  id: string;
  category: string;
  values: string;
}

export interface ResumeFormData
  extends Omit<ResumeData, "skills" | "certifications"> {
  skills: SkillCategory[];
  certifications: { id: string; value: string }[];
}

export interface AtsChecklistItem {
  label: string;
  passed: boolean;
  points: number;
}

export interface ResumeApiPayload extends ResumeData {}
