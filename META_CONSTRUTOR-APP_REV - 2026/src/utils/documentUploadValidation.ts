export const DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 50 * 1024 * 1024;

export const DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "jpg",
  "jpeg",
  "png",
] as const;

export const DOCUMENT_UPLOAD_ACCEPT = DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS
  .map((extension) => `.${extension}`)
  .join(",");

export const DOCUMENT_UPLOAD_HELP_TEXT = "PDF, DOC, XLS, TXT, JPG, PNG (max. 50MB)";

export function getDocumentFileExtension(fileName: string) {
  return (fileName.split(".").pop() || "bin").trim().toLowerCase();
}

export function validateDocumentUploadFile(file: File) {
  const fileExt = getDocumentFileExtension(file.name);

  if (!DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS.includes(fileExt as typeof DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS[number])) {
    throw new Error("Tipo de arquivo nao permitido.");
  }

  if (file.size > DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
    throw new Error("Arquivo excede o tamanho maximo de 50MB.");
  }

  return fileExt;
}
