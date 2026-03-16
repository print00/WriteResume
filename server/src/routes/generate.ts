import { Router } from "express";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildResumeDocxBuffer } from "../lib/resumeDocument.js";
import { assertResumeData } from "../lib/validation.js";

const execFileAsync = promisify(execFile);
const router = Router();

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "resume";
}

router.post("/docx", async (req, res, next) => {
  try {
    assertResumeData(req.body);
    const buffer = await buildResumeDocxBuffer(req.body);
    const fileName = `${safeFileName(req.body.contact.name)}_resume.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post("/pdf", async (req, res, next) => {
  let tempDir = "";

  try {
    assertResumeData(req.body);
    const buffer = await buildResumeDocxBuffer(req.body);
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-builder-"));

    const docxPath = path.join(tempDir, "resume.docx");
    const pdfPath = path.join(tempDir, "resume.pdf");

    await fs.writeFile(docxPath, buffer);
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDir,
      docxPath,
    ]);

    const pdfBuffer = await fs.readFile(pdfPath);
    const fileName = `${safeFileName(req.body.contact.name)}_resume.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
});

export default router;
