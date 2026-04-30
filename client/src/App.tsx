import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import type { ResumeFormData } from "./types/form";
import type { ResumeReviewResponse, TailorResumeResponse } from "./types/shared";
import {
  defaultValues,
  normalizeResumeFormData,
  createBullet,
  createCertification,
  createEducation,
  createExperience,
  createProject,
  createSkill,
  toResumePayload,
  cleanText,
} from "./lib/defaults";
import { getAtsScore } from "./lib/ats";
import {
  downloadResume,
  enhanceBullets,
  extractTextFromFile,
  generateSummary,
  reviewUploadedResume,
  tailorResume,
} from "./lib/api";
import Button from "./components/Button";
import FormField from "./components/FormField";
import InlineErrorBanner from "./components/InlineErrorBanner";
import SectionCard from "./components/SectionCard";
import StepHeader from "./components/StepHeader";
import BrandLogo from "./components/BrandLogo";

const steps = [
  "Contact",
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Export",
];

type ExportState = "idle" | "docx" | "pdf";

export default function App() {
  const {
    control,
    register,
    getValues,
    setValue,
  } = useForm<ResumeFormData>({
    defaultValues,
    shouldUnregister: false,
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control,
    name: "experience",
  });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: "education",
  });
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: "skills",
  });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: "projects",
  });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } =
    useFieldArray({
      control,
      name: "certifications",
    });

  const values = useWatch({ control, defaultValue: defaultValues });
  const [currentStep, setCurrentStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bulletLoadingKey, setBulletLoadingKey] = useState<string | null>(null);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobFileName, setJobFileName] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [jobExtractLoading, setJobExtractLoading] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [resumeReview, setResumeReview] = useState<ResumeReviewResponse | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailorResumeResponse | null>(null);

  const safeValues = useMemo(
    () => normalizeResumeFormData(values as Partial<ResumeFormData> | undefined),
    [values],
  );
  const { score, checklist } = useMemo(
    () => (currentStep === 6 ? getAtsScore(safeValues) : { score: 0, checklist: [] }),
    [currentStep, safeValues],
  );
  const scoreTone =
    score >= 80 ? "text-success" : score >= 60 ? "text-warn" : "text-danger";

  async function handleGenerateSummary() {
    setErrorMessage(null);
    setSummaryLoading(true);

    try {
      const payload = toResumePayload(getValues());
      const response = await generateSummary(payload);
      setValue("summary", response.summary, { shouldDirty: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleEnhanceBullets(
    type: "experience" | "projects",
    index: number,
    context: string,
    bullets: string[],
  ) {
    setErrorMessage(null);
    setBulletLoadingKey(`${type}-${index}`);

    try {
      const response = await enhanceBullets({ bullets, context });
      setValue(`${type}.${index}.bullets`, response.bullets, { shouldDirty: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to enhance bullets.");
    } finally {
      setBulletLoadingKey(null);
    }
  }

  async function handleExport(format: "docx" | "pdf") {
    setErrorMessage(null);
    setExportState(format);

    try {
      const payload = toResumePayload(getValues());
      await downloadResume(payload, format, payload.contact.name || "resume");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Unable to export ${format}.`);
    } finally {
      setExportState("idle");
    }
  }

  async function handleReviewResume() {
    if (!resumeFile) {
      setErrorMessage("Upload a resume file first.");
      return;
    }

    setErrorMessage(null);
    setReviewLoading(true);

    try {
      const response = await reviewUploadedResume(resumeFile);
      setResumeReview(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to review resume.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleExtractJobFile(file: File) {
    setErrorMessage(null);
    setJobExtractLoading(true);

    try {
      const response = await extractTextFromFile(file);
      setJobDescription(response.text);
      setJobFileName(response.fileName);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to extract the job description.",
      );
    } finally {
      setJobExtractLoading(false);
    }
  }

  async function handleTailorResume() {
    if (!cleanText(jobDescription)) {
      setErrorMessage("Add or upload a job description before tailoring the resume.");
      return;
    }

    setErrorMessage(null);
    setTailorLoading(true);

    try {
      const response = await tailorResume({
        jobDescription,
        resume: toResumePayload(getValues()),
      });
      setTailoredResume(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to tailor resume.");
    } finally {
      setTailorLoading(false);
    }
  }

  function applyTailoredSuggestions() {
    if (!tailoredResume) {
      return;
    }

    setValue("summary", tailoredResume.summary, { shouldDirty: true });
    tailoredResume.experience.forEach((entry) => {
      const index = safeValues.experience.findIndex((item) => item.id === entry.id);
      if (index >= 0) {
        setValue(`experience.${index}.bullets`, entry.bullets, { shouldDirty: true });
      }
    });
    tailoredResume.projects.forEach((entry) => {
      const index = safeValues.projects.findIndex((item) => item.id === entry.id);
      if (index >= 0) {
        setValue(`projects.${index}.bullets`, entry.bullets, { shouldDirty: true });
      }
    });
    setCurrentStep(1);
    setMaxVisitedStep((current) => Math.max(current, 5));
  }

  function goNext() {
    setCurrentStep((step) => {
      const next = Math.min(step + 1, steps.length - 1);
      setMaxVisitedStep((current) => Math.max(current, next));
      return next;
    });
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  const currentSummaryLength = safeValues.summary?.length ?? 0;
  const watchedExperience = safeValues.experience ?? [];
  const watchedProjects = safeValues.projects ?? [];
  const completedSteps = maxVisitedStep + 1;
  const resumeSections =
    safeValues.experience.length +
    safeValues.education.length +
    safeValues.skills.length +
    safeValues.projects.length +
    safeValues.certifications.length;

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 md:px-8 md:py-8">
      <form
        className="mx-auto max-w-7xl space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <header className="surface overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px] lg:p-7">
            <div className="flex min-w-0 flex-col justify-between gap-8">
              <BrandLogo />
              <div>
                <div className="mb-3 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accentSoft">
                  Resume intelligence workspace
                </div>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Build a sharper, recruiter-ready resume.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                  Draft structured sections, tune bullets with AI, match a job description, and export an ATS-friendly resume from one focused workspace.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="surface-muted rounded-lg p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Step</div>
                <div className="mt-2 text-2xl font-semibold text-white">{steps[currentStep]}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {currentStep + 1} of {steps.length}
                </div>
              </div>
              <div className="surface-muted rounded-lg p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Unlocked</div>
                <div className="mt-2 text-2xl font-semibold text-accentSoft">{completedSteps}</div>
                <div className="mt-1 text-sm text-slate-400">Sections in progress</div>
              </div>
              <div className="surface-muted rounded-lg p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Entries</div>
                <div className="mt-2 text-2xl font-semibold text-gold">{resumeSections}</div>
                <div className="mt-1 text-sm text-slate-400">Resume data blocks</div>
              </div>
            </div>
          </div>
        </header>

        <StepHeader
          steps={steps}
          currentStep={currentStep}
          maxVisitedStep={maxVisitedStep}
          onSelect={setCurrentStep}
        />

        <InlineErrorBanner message={errorMessage} />

        <SectionCard
          title="Resume Review Lab"
          subtitle="Upload an existing resume to score it, then add a job description to tailor the current builder output."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="surface-muted rounded-lg p-4">
                <div className="text-sm font-semibold text-white">1. Upload Resume</div>
                <p className="mt-1 text-sm text-slate-400">
                  Supports PDF, DOCX, or TXT for AI review and ATS scoring.
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-ink"
                  onChange={(event) => {
                    setResumeReview(null);
                    setResumeFile(event.target.files?.[0] ?? null);
                  }}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" loading={reviewLoading} onClick={handleReviewResume}>
                    Analyze Uploaded Resume
                  </Button>
                  {resumeFile ? (
                    <span className="self-center text-sm text-slate-400">{resumeFile.name}</span>
                  ) : null}
                </div>
              </div>

              <div className="surface-muted rounded-lg p-4">
                <div className="text-sm font-semibold text-white">2. Add Job Description</div>
                <p className="mt-1 text-sm text-slate-400">
                  Paste the role description or upload a PDF, DOCX, or TXT file.
                </p>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className="field-shell mt-4 w-full rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="Paste the target software engineer job description here..."
                />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="block text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-semibold file:text-slate-100"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleExtractJobFile(file);
                      }
                    }}
                  />
                  {jobExtractLoading ? <span className="text-sm text-slate-400">Reading file...</span> : null}
                  {jobFileName ? <span className="text-sm text-slate-400">{jobFileName}</span> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" loading={tailorLoading} onClick={handleTailorResume}>
                    Tailor Current Resume To Job
                  </Button>
                  {tailoredResume ? (
                    <Button type="button" onClick={applyTailoredSuggestions}>
                      Apply Tailored Suggestions
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {resumeReview ? (
                <div className="surface-muted rounded-lg p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Uploaded Resume Score</div>
                      <p className="mt-1 text-sm text-slate-400">{resumeReview.overview}</p>
                    </div>
                    <div className="text-4xl font-semibold text-accent">{resumeReview.score}</div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-white">Strengths</div>
                      <ul className="mt-2 space-y-2 text-sm text-slate-300">
                        {resumeReview.strengths.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Improvements</div>
                      <ul className="mt-2 space-y-2 text-sm text-slate-300">
                        {resumeReview.improvements.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="text-sm font-semibold text-white">Keyword Gaps</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resumeReview.keywordGaps.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-xs text-warn"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-400">
                  Upload a resume to get an AI score, strengths, improvement areas, and keyword gaps.
                </div>
              )}

              {tailoredResume ? (
                <div className="surface-muted rounded-lg p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Job Match Analysis</div>
                      <p className="mt-1 text-sm text-slate-400">
                        Tailored summary and bullet suggestions are ready to apply.
                      </p>
                    </div>
                    <div className="text-4xl font-semibold text-success">{tailoredResume.matchScore}</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white">Suggested Summary</div>
                    <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
                      {tailoredResume.summary}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white">Recommended Keywords</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tailoredResume.recommendedKeywords.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white">Tailoring Notes</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      {tailoredResume.notes.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <div className="animate-fade-slide">
          {currentStep === 0 ? (
            <SectionCard title="Contact Information" subtitle="Start with the essentials recruiters look for first.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField label="Full Name" placeholder="Jane Doe" {...register("contact.name")} />
                </div>
                <FormField label="Email" placeholder="jane@company.com" type="email" {...register("contact.email")} />
                <FormField label="Phone" placeholder="(555) 555-5555" {...register("contact.phone")} />
                <div className="md:col-span-2">
                  <FormField label="Location" placeholder="New York, NY" {...register("contact.location")} />
                </div>
                <FormField label="LinkedIn URL" placeholder="https://linkedin.com/in/janedoe" {...register("contact.linkedin")} />
                <FormField label="GitHub URL" placeholder="https://github.com/janedoe" {...register("contact.github")} />
                <div className="md:col-span-2">
                  <FormField label="Portfolio / Website" placeholder="https://janedoe.dev" {...register("contact.portfolio")} />
                </div>
              </div>
            </SectionCard>
          ) : null}

          {currentStep === 1 ? (
            <SectionCard
              title="Professional Summary"
              subtitle="Aim for 2-3 punchy sentences with technical keywords and quantified impact."
            >
              <div className="space-y-4">
                <FormField
                  as="textarea"
                  label="Summary"
                  rows={6}
                  placeholder="Staff-level backend engineer with 8+ years..."
                  {...register("summary")}
                />
                <div className="flex flex-col justify-between gap-3 text-sm text-slate-400 md:flex-row md:items-center">
                  <span>{currentSummaryLength} characters. Target 300-500 for best results.</span>
                  <Button type="button" variant="secondary" loading={summaryLoading} onClick={handleGenerateSummary}>
                    AI Generate
                  </Button>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-4">
              {experienceFields.map((field, index) => (
                <SectionCard
                  key={field.id}
                  title={`Experience ${index + 1}`}
                  subtitle="Keep the strongest, most recent work first."
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Company" {...register(`experience.${index}.company`)} />
                      <FormField label="Title" {...register(`experience.${index}.title`)} />
                      <FormField label="Location" {...register(`experience.${index}.location`)} />
                      <FormField label="Dates" placeholder="Jan 2021 - Present" {...register(`experience.${index}.dates`)} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Achievement Bullets</h3>
                        <Button
                          type="button"
                          variant="secondary"
                          loading={bulletLoadingKey === `experience-${index}`}
                          onClick={() =>
                            handleEnhanceBullets(
                              "experience",
                              index,
                              `${watchedExperience[index]?.title || "Role"} at ${watchedExperience[index]?.company || "Company"}`,
                              watchedExperience[index]?.bullets.filter((bullet: string) => cleanText(bullet)) || [],
                            )
                          }
                        >
                          AI Enhance Bullets
                        </Button>
                      </div>
                      {watchedExperience[index]?.bullets.map((_: string, bulletIndex: number) => (
                        <div key={`${field.id}-${bulletIndex}`} className="flex gap-3">
                          <div className="flex-1">
                            <FormField
                              as="textarea"
                              label={`Bullet ${bulletIndex + 1}`}
                              rows={3}
                              {...register(`experience.${index}.bullets.${bulletIndex}`)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="self-center"
                            onClick={() => {
                              const nextBullets = [...(watchedExperience[index]?.bullets || [])];
                              nextBullets.splice(bulletIndex, 1);
                              setValue(`experience.${index}.bullets`, nextBullets.length ? nextBullets : [createBullet()]);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setValue(`experience.${index}.bullets`, [...(watchedExperience[index]?.bullets || []), createBullet()])
                        }
                      >
                        Add Bullet
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      {experienceFields.length > 1 ? (
                        <Button type="button" variant="ghost" onClick={() => removeExperience(index)}>
                          Remove Experience
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>
              ))}
              <Button type="button" variant="secondary" onClick={() => appendExperience(createExperience())}>
                Add Experience
              </Button>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              {educationFields.map((field, index) => (
                <SectionCard key={field.id} title={`Education ${index + 1}`} subtitle="List degrees in reverse chronological order.">
                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="md:col-span-7">
                      <FormField label="School" {...register(`education.${index}.school`)} />
                    </div>
                    <div className="md:col-span-5">
                      <FormField label="Dates" {...register(`education.${index}.dates`)} />
                    </div>
                    <div className="md:col-span-4">
                      <FormField label="Degree" {...register(`education.${index}.degree`)} />
                    </div>
                    <div className="md:col-span-5">
                      <FormField label="Major" {...register(`education.${index}.major`)} />
                    </div>
                    <div className="md:col-span-3">
                      <FormField label="GPA" {...register(`education.${index}.gpa`)} />
                    </div>
                    <div className="md:col-span-12">
                      <FormField label="Honors / Awards" {...register(`education.${index}.honors`)} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    {educationFields.length > 1 ? (
                      <Button type="button" variant="ghost" onClick={() => removeEducation(index)}>
                        Remove Education
                      </Button>
                    ) : null}
                  </div>
                </SectionCard>
              ))}
              <Button type="button" variant="secondary" onClick={() => appendEducation(createEducation())}>
                Add Education
              </Button>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-4">
              <SectionCard title="Technical Skills" subtitle="Use categories recruiters expect and keep values comma-separated.">
                <div className="space-y-4">
                  {skillFields.map((field, index) => (
                    <div key={field.id} className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto]">
                      <FormField label="Category" {...register(`skills.${index}.category`)} />
                      <FormField label="Values" placeholder="React, TypeScript, GraphQL" {...register(`skills.${index}.values`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        className="self-end"
                        onClick={() => removeSkill(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => appendSkill(createSkill())}>
                    Add Category
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Certifications" subtitle="Optional, but useful for cloud, security, or specialized credentials.">
                <div className="space-y-4">
                  {certificationFields.map((field, index) => (
                    <div key={field.id} className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <FormField label={`Certification ${index + 1}`} {...register(`certifications.${index}.value`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        className="self-end"
                        onClick={() => removeCertification(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => appendCertification(createCertification())}>
                    Add Certification
                  </Button>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4">
              {projectFields.map((field, index) => (
                <SectionCard key={field.id} title={`Project ${index + 1}`} subtitle="Highlight technical depth, ownership, and measurable outcomes.">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Project Name" {...register(`projects.${index}.name`)} />
                      <FormField label="Tech Stack" placeholder="React, Node.js, PostgreSQL" {...register(`projects.${index}.tech`)} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Project Bullets</h3>
                        <Button
                          type="button"
                          variant="secondary"
                          loading={bulletLoadingKey === `projects-${index}`}
                          onClick={() =>
                            handleEnhanceBullets(
                              "projects",
                              index,
                              `Project: ${watchedProjects[index]?.name || "Untitled"}`,
                              watchedProjects[index]?.bullets.filter((bullet: string) => cleanText(bullet)) || [],
                            )
                          }
                        >
                          AI Enhance Bullets
                        </Button>
                      </div>
                      {watchedProjects[index]?.bullets.map((_: string, bulletIndex: number) => (
                        <div key={`${field.id}-${bulletIndex}`} className="flex gap-3">
                          <div className="flex-1">
                            <FormField
                              as="textarea"
                              label={`Bullet ${bulletIndex + 1}`}
                              rows={3}
                              {...register(`projects.${index}.bullets.${bulletIndex}`)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="self-center"
                            onClick={() => {
                              const nextBullets = [...(watchedProjects[index]?.bullets || [])];
                              nextBullets.splice(bulletIndex, 1);
                              setValue(`projects.${index}.bullets`, nextBullets.length ? nextBullets : [createBullet()]);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setValue(`projects.${index}.bullets`, [...(watchedProjects[index]?.bullets || []), createBullet()])
                        }
                      >
                        Add Bullet
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      {projectFields.length > 1 ? (
                        <Button type="button" variant="ghost" onClick={() => removeProject(index)}>
                          Remove Project
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>
              ))}
              <Button type="button" variant="secondary" onClick={() => appendProject(createProject())}>
                Add Project
              </Button>
            </div>
          ) : null}

          {currentStep === 6 ? (
            <SectionCard title="Export & ATS Score" subtitle="Use the checklist below to tighten the resume before exporting.">
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="surface-muted rounded-lg p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">ATS Score</div>
                  <div className={`mt-3 text-6xl font-semibold ${scoreTone}`}>{score}</div>
                  <div className={`mt-2 text-sm ${scoreTone}`}>
                    {score >= 80 ? "Strong" : score >= 60 ? "Needs polish" : "Needs work"}
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full rounded-full ${
                        score >= 80 ? "bg-success" : score >= 60 ? "bg-warn" : "bg-danger"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button type="button" loading={exportState === "docx"} onClick={() => handleExport("docx")}>
                      Download .docx
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={exportState === "pdf"}
                      onClick={() => handleExport("pdf")}
                    >
                      Download .pdf
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-100">{item.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.points} points</div>
                      </div>
                      <div className={item.passed ? "text-success" : "text-danger"}>
                        {item.passed ? "Pass" : "Fail"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <footer className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            {currentStep === steps.length - 1
              ? "Ready to export your resume."
              : "Move step by step, or jump back to any completed section above."}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={goBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button
              type="button"
              onClick={goNext}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </footer>
      </form>
    </main>
  );
}
