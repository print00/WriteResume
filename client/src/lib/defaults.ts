import type { ResumeApiPayload, ResumeFormData } from "../types/form";

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createBullet() {
  return "";
}

export function createExperience() {
  return {
    id: makeId("exp"),
    company: "",
    title: "",
    location: "",
    dates: "",
    bullets: ["", "", ""],
  };
}

export function createEducation() {
  return {
    id: makeId("edu"),
    school: "",
    degree: "",
    major: "",
    dates: "",
    gpa: "",
    honors: "",
  };
}

export function createProject() {
  return {
    id: makeId("project"),
    name: "",
    tech: "",
    bullets: ["", "", ""],
  };
}

export function createSkill(category = "", values = "") {
  return {
    id: makeId("skill"),
    category,
    values,
  };
}

export function createCertification(value = "") {
  return {
    id: makeId("cert"),
    value,
  };
}

export const defaultValues: ResumeFormData = {
  contact: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  experience: [createExperience(), createExperience()],
  education: [createEducation()],
  skills: [
    createSkill("Languages", ""),
    createSkill("Frameworks", ""),
    createSkill("Cloud/DevOps", ""),
    createSkill("Databases", ""),
    createSkill("Tools", ""),
  ],
  projects: [createProject()],
  certifications: [createCertification()],
};

export function toResumePayload(values: ResumeFormData): ResumeApiPayload {
  return {
    contact: {
      ...values.contact,
      linkedin: values.contact.linkedin?.trim() || undefined,
      github: values.contact.github?.trim() || undefined,
      portfolio: values.contact.portfolio?.trim() || undefined,
    },
    summary: values.summary.trim(),
    experience: values.experience.map((item: ResumeFormData["experience"][number]) => ({
      ...item,
      bullets: item.bullets.map((bullet: string) => bullet.trim()).filter(Boolean),
    })),
    education: values.education.map((item: ResumeFormData["education"][number]) => ({
      ...item,
      gpa: item.gpa?.trim() || undefined,
      honors: item.honors?.trim() || undefined,
    })),
    skills: values.skills.reduce<Record<string, string>>(
      (accumulator, item: ResumeFormData["skills"][number]) => {
      if (item.category.trim() && item.values.trim()) {
        accumulator[item.category.trim()] = item.values.trim();
      }
      return accumulator;
      },
      {},
    ),
    projects: values.projects.map((item: ResumeFormData["projects"][number]) => ({
      ...item,
      bullets: item.bullets.map((bullet: string) => bullet.trim()).filter(Boolean),
    })),
    certifications: values.certifications
      .map((item: ResumeFormData["certifications"][number]) => item.value.trim())
      .filter(Boolean),
  };
}
