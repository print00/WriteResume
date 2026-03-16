import type { ResumeFormData, AtsChecklistItem } from "../types/form";

const METRIC_PATTERN = /(\d+%|\d+x|\$\d+|\d+[KM]|\d+ms)/i;

export function getAtsChecklist(values: ResumeFormData): AtsChecklistItem[] {
  const totalBullets = values.experience.reduce(
    (count: number, item: ResumeFormData["experience"][number]) =>
      count + item.bullets.filter((bullet: string) => bullet.trim()).length,
    0,
  );
  const allBullets = [
    ...values.experience.flatMap((item: ResumeFormData["experience"][number]) => item.bullets),
    ...values.projects.flatMap((item: ResumeFormData["projects"][number]) => item.bullets),
  ];
  const skillCategoriesWithContent = values.skills.filter(
    (item: ResumeFormData["skills"][number]) => item.category.trim() && item.values.trim(),
  ).length;

  return [
    {
      label: "Name + email + phone present",
      passed:
        Boolean(values.contact.name.trim()) &&
        Boolean(values.contact.email.trim()) &&
        Boolean(values.contact.phone.trim()),
      points: 10,
    },
    {
      label: "LinkedIn included",
      passed: Boolean(values.contact.linkedin?.trim()),
      points: 5,
    },
    {
      label: "Summary is at least 100 characters",
      passed: values.summary.trim().length >= 100,
      points: 10,
    },
    {
      label: "At least 2 work experiences",
      passed:
        values.experience.filter(
          (item: ResumeFormData["experience"][number]) => item.company.trim() || item.title.trim(),
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
      passed: values.education.some((item: ResumeFormData["education"][number]) => item.school.trim()),
      points: 10,
    },
    {
      label: "At least 3 skill categories are filled",
      passed: skillCategoriesWithContent >= 3,
      points: 5,
    },
    {
      label: "GitHub or portfolio link included",
      passed: Boolean(values.contact.github?.trim() || values.contact.portfolio?.trim()),
      points: 5,
    },
    {
      label: "Projects section included",
      passed: values.projects.some((item: ResumeFormData["projects"][number]) => item.name.trim()),
      points: 5,
    },
  ];
}

export function getAtsScore(values: ResumeFormData) {
  const checklist = getAtsChecklist(values);
  const score = checklist.reduce((sum, item) => sum + (item.passed ? item.points : 0), 0);
  return { score, checklist };
}
