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
