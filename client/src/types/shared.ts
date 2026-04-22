export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  dates: string;
  gpa?: string;
  honors?: string;
}

export interface Project {
  id: string;
  name: string;
  tech: string;
  bullets: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Record<string, string>;
  projects: Project[];
  certifications: string[];
}

export interface BulletEnhanceRequest {
  bullets: string[];
  context: string;
}

export interface SummaryResponse {
  summary: string;
}

export interface BulletsResponse {
  bullets: string[];
}

export interface ExtractedTextResponse {
  fileName: string;
  mimeType: string;
  text: string;
}

export interface ResumeReviewResponse {
  score: number;
  overview: string;
  strengths: string[];
  improvements: string[];
  keywordGaps: string[];
  sectionFeedback: string[];
  parsedText: string;
}

export interface TailorResumeRequest {
  jobDescription: string;
  resume: ResumeData;
}

export interface TailoredSectionBullets {
  id: string;
  bullets: string[];
}

export interface TailorResumeResponse {
  matchScore: number;
  summary: string;
  recommendedKeywords: string[];
  notes: string[];
  experience: TailoredSectionBullets[];
  projects: TailoredSectionBullets[];
}
