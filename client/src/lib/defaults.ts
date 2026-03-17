import type { ResumeApiPayload, ResumeFormData } from "../types/form";

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cleanText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
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

export function normalizeResumeFormData(
  values?: Partial<ResumeFormData>,
): ResumeFormData {
  return {
    contact: {
      ...defaultValues.contact,
      ...(values?.contact ?? {}),
    },
    summary: values?.summary ?? defaultValues.summary,
    experience:
      values?.experience?.map((item, index) => ({
        ...createExperience(),
        ...(defaultValues.experience[index] ?? {}),
        ...item,
        bullets: item?.bullets ?? ["", "", ""],
      })) ?? defaultValues.experience,
    education:
      values?.education?.map((item, index) => ({
        ...createEducation(),
        ...(defaultValues.education[index] ?? {}),
        ...item,
      })) ?? defaultValues.education,
    skills:
      values?.skills?.map((item, index) => ({
        ...createSkill(),
        ...(defaultValues.skills[index] ?? {}),
        ...item,
      })) ?? defaultValues.skills,
    projects:
      values?.projects?.map((item, index) => ({
        ...createProject(),
        ...(defaultValues.projects[index] ?? {}),
        ...item,
        bullets: item?.bullets ?? ["", "", ""],
      })) ?? defaultValues.projects,
    certifications:
      values?.certifications?.map((item, index) => ({
        ...createCertification(),
        ...(defaultValues.certifications[index] ?? {}),
        ...item,
      })) ?? defaultValues.certifications,
  };
}

export function toResumePayload(values: ResumeFormData): ResumeApiPayload {
  return {
    contact: {
      ...values.contact,
      linkedin: cleanText(values.contact.linkedin) || undefined,
      github: cleanText(values.contact.github) || undefined,
      portfolio: cleanText(values.contact.portfolio) || undefined,
    },
    summary: cleanText(values.summary),
    experience: values.experience.map((item: ResumeFormData["experience"][number]) => ({
      ...item,
      bullets: item.bullets.map((bullet: string) => cleanText(bullet)).filter(Boolean),
    })),
    education: values.education.map((item: ResumeFormData["education"][number]) => ({
      ...item,
      gpa: cleanText(item.gpa) || undefined,
      honors: cleanText(item.honors) || undefined,
    })),
    skills: values.skills.reduce<Record<string, string>>(
      (accumulator, item: ResumeFormData["skills"][number]) => {
        const category = cleanText(item.category);
        const skillValues = cleanText(item.values);
        if (category && skillValues) {
          accumulator[category] = skillValues;
        }
        return accumulator;
      },
      {},
    ),
    projects: values.projects.map((item: ResumeFormData["projects"][number]) => ({
      ...item,
      bullets: item.bullets.map((bullet: string) => cleanText(bullet)).filter(Boolean),
    })),
    certifications: values.certifications
      .map((item: ResumeFormData["certifications"][number]) => cleanText(item.value))
      .filter(Boolean),
  };
}
