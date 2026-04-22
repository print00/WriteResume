import mammoth from "mammoth";
import pdf from "pdf-parse";
import { ApiError } from "./errors.js";

const TEXT_TYPES = new Set([
  "text/plain",
  "application/json",
]);

const DOCX_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const PDF_TYPES = new Set(["application/pdf"]);

export async function extractTextFromUpload(
  file: Express.Multer.File | undefined,
) {
  if (!file) {
    throw new ApiError(400, "A file upload is required.");
  }

  if (TEXT_TYPES.has(file.mimetype)) {
    return file.buffer.toString("utf8").trim();
  }

  if (DOCX_TYPES.has(file.mimetype)) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  if (PDF_TYPES.has(file.mimetype)) {
    const result = await pdf(file.buffer);
    return result.text.trim();
  }

  throw new ApiError(
    400,
    "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
  );
}
