import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  convertInchesToTwip,
} from "docx";
import type { Education, Project, ResumeData, WorkExperience } from "@resume-builder/shared";

const COLORS = {
  navy: "1A1A2E",
  charcoal: "253041",
};

const FONT = "Calibri";
const PAGE_WIDTH = 8.5;
const MARGIN_LEFT = 0.75;
const MARGIN_RIGHT = 0.75;
const CONTENT_WIDTH_TWIPS = convertInchesToTwip(PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);

function compactText(value?: string) {
  return value?.trim() ?? "";
}

function createSectionHeader(title: string) {
  return new Paragraph({
    spacing: {
      before: 160,
      after: 60,
    },
    border: {
      bottom: {
        color: COLORS.navy,
        size: 2,
        style: BorderStyle.SINGLE,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: COLORS.navy,
        size: 20,
        font: FONT,
      }),
    ],
  });
}

function tabbedHeader(left: string, right: string, options?: { italic?: boolean }) {
  return new Paragraph({
    spacing: {
      before: 80,
      after: 20,
    },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: CONTENT_WIDTH_TWIPS,
      },
    ],
    children: [
      new TextRun({
        text: left,
        bold: true,
        italics: options?.italic,
        color: COLORS.navy,
        size: 22,
        font: FONT,
      }),
      new TextRun({
        text: `\t${right}`,
        bold: false,
        italics: options?.italic,
        color: options?.italic ? COLORS.charcoal : COLORS.navy,
        size: 20,
        font: FONT,
      }),
    ],
  });
}

function subHeader(left: string, right: string) {
  return new Paragraph({
    spacing: {
      after: 20,
    },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: CONTENT_WIDTH_TWIPS,
      },
    ],
    children: [
      new TextRun({
        text: left,
        bold: true,
        italics: true,
        color: COLORS.charcoal,
        size: 20,
        font: FONT,
      }),
      new TextRun({
        text: `\t${right}`,
        color: COLORS.charcoal,
        size: 20,
        font: FONT,
      }),
    ],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    numbering: {
      reference: "resume-bullets",
      level: 0,
    },
    spacing: {
      after: 40,
    },
    indent: {
      left: 360,
      hanging: 180,
    },
    children: [
      new TextRun({
        text,
        size: 20,
        font: FONT,
      }),
    ],
  });
}

function renderExperienceItem(item: WorkExperience) {
  const lines = [
    tabbedHeader(compactText(item.company), compactText(item.dates)),
    subHeader(compactText(item.title), compactText(item.location)),
  ];

  for (const bullet of item.bullets.filter((entry: string) => entry.trim())) {
    lines.push(bulletParagraph(bullet.trim()));
  }

  return lines;
}

function renderEducationItem(item: Education) {
  const detailParts = [`${compactText(item.degree)} in ${compactText(item.major)}`.trim()];

  if (compactText(item.gpa)) {
    detailParts.push(`GPA: ${compactText(item.gpa)}`);
  }

  if (compactText(item.honors)) {
    detailParts.push(compactText(item.honors));
  }

  return [
    tabbedHeader(compactText(item.school), compactText(item.dates)),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: detailParts.filter(Boolean).join(" | "),
          size: 20,
          font: FONT,
          color: COLORS.charcoal,
        }),
      ],
    }),
  ];
}

function renderProjectItem(item: Project) {
  const lines = [tabbedHeader(compactText(item.name), compactText(item.tech))];

  for (const bullet of item.bullets.filter((entry: string) => entry.trim())) {
    lines.push(bulletParagraph(bullet.trim()));
  }

  return lines;
}

function renderSkills(data: ResumeData) {
  const lines: Paragraph[] = [];

  for (const [category, values] of Object.entries(data.skills) as [string, string][]) {
    if (!category.trim() || !values.trim()) {
      continue;
    }

    lines.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `${category.trim()}: `,
            bold: true,
            size: 20,
            font: FONT,
          }),
          new TextRun({
            text: values.trim(),
            size: 20,
            font: FONT,
          }),
        ],
      }),
    );
  }

  if (data.certifications.filter((item: string) => item.trim()).length > 0) {
    lines.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: "Certifications: ",
            bold: true,
            size: 20,
            font: FONT,
          }),
          new TextRun({
            text: data.certifications.filter((item: string) => item.trim()).join(", "),
            size: 20,
            font: FONT,
          }),
        ],
      }),
    );
  }

  return lines;
}

function createDocument(data: ResumeData) {
  const contactParts = [
    compactText(data.contact.email),
    compactText(data.contact.phone),
    compactText(data.contact.location),
    compactText(data.contact.linkedin),
    compactText(data.contact.github),
    compactText(data.contact.portfolio),
  ].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: compactText(data.contact.name),
          bold: true,
          size: 36,
          font: FONT,
          color: COLORS.navy,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: contactParts.join(" | "),
          size: 20,
          font: FONT,
        }),
      ],
    }),
  ];

  if (compactText(data.summary)) {
    children.push(createSectionHeader("Summary"));
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: compactText(data.summary),
            size: 20,
            font: FONT,
          }),
        ],
      }),
    );
  }

  if (data.experience.some((item: WorkExperience) => item.company.trim() || item.title.trim())) {
    children.push(createSectionHeader("Experience"));
    data.experience.forEach((item) => {
      children.push(...renderExperienceItem(item));
    });
  }

  if (data.projects.some((item: Project) => item.name.trim())) {
    children.push(createSectionHeader("Projects"));
    data.projects.forEach((item) => {
      children.push(...renderProjectItem(item));
    });
  }

  if (data.education.some((item: Education) => item.school.trim())) {
    children.push(createSectionHeader("Education"));
    data.education.forEach((item) => {
      children.push(...renderEducationItem(item));
    });
  }

  if (
    Object.values(data.skills).some((value: string) => value.trim()) ||
    data.certifications.some((item: string) => item.trim())
  ) {
    children.push(createSectionHeader("Skills"));
    children.push(...renderSkills(data));
  }

  return new Document({
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(MARGIN_LEFT),
              right: convertInchesToTwip(MARGIN_RIGHT),
            },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: 20,
          },
          paragraph: {
            spacing: {
              line: 240,
            },
          },
        },
      },
    },
  });
}

export async function buildResumeDocxBuffer(data: ResumeData) {
  const document = createDocument(data);
  return Packer.toBuffer(document);
}
