import type { ResumeFormData, AtsChecklistItem } from "../types/form";
import { cleanText } from "./defaults";

const METRIC_PATTERN = /(\d+%|\d+x|\$\d+|\d+[KM]|\d+ms)/i;

export function getAtsChecklist(values: ResumeFormData): AtsChecklistItem[] {
  const totalBullets = values.experience.reduce(
    (count: number, item: ResumeFormData["experience"][number]) =>
      count + item.bullets.filter((bullet: string) => cleanText(bullet)).length,
    0,
  );
  const allBullets = [
    ...values.experience.flatMap((item: ResumeFormData["experience"][number]) => item.bullets),
    ...values.projects.flatMap((item: ResumeFormData["projects"][number]) => item.bullets),
  ];
  const skillCategoriesWithContent = values.skills.filter(
    (item: ResumeFormData["skills"][number]) => cleanText(item.category) && cleanText(item.values),
  ).length;

  return [
    {
      label: "Name + email + phone present",
      passed:
        Boolean(cleanText(values.contact.name)) &&
        Boolean(cleanText(values.contact.email)) &&
        Boolean(cleanText(values.contact.phone)),
      points: 10,
    },
    {
      label: "LinkedIn included",
      passed: Boolean(cleanText(values.contact.linkedin)),
      points: 5,
    },
    {
      label: "Summary is at least 100 characters",
      passed: cleanText(values.summary).length >= 100,
      points: 10,
    },
    {
      label: "At least 2 work experiences",
      passed:
        values.experience.filter(
          (item: ResumeFormData["experience"][number]) =>
            cleanText(item.company) || cleanText(item.title),
        ).length >= 2,
      points: 20,
    },
    {
      label: "At least 6 total work bullets",
      passed: totalBullets >= 6,
      points: 15,
    },
    {
      label: "At least one bullet includes a metric",
      passed: allBullets.some((bullet: string) => METRIC_PATTERN.test(bullet)),
      points: 15,
    },
    {
      label: "Education section included",
      passed: values.education.some(
        (item: ResumeFormData["education"][number]) => cleanText(item.school),
      ),
      points: 10,
    },
    {
      label: "At least 3 skill categories are filled",
      passed: skillCategoriesWithContent >= 3,
      points: 5,
    },
    {
      label: "GitHub or portfolio link included",
      passed: Boolean(cleanText(values.contact.github) || cleanText(values.contact.portfolio)),
      points: 5,
    },
    {
      label: "Projects section included",
      passed: values.projects.some(
        (item: ResumeFormData["projects"][number]) => cleanText(item.name),
      ),
      points: 5,
    },
  ];
}

export function getAtsScore(values: ResumeFormData) {
  const checklist = getAtsChecklist(values);
  const score = checklist.reduce((sum, item) => sum + (item.passed ? item.points : 0), 0);
  return { score, checklist };
}
