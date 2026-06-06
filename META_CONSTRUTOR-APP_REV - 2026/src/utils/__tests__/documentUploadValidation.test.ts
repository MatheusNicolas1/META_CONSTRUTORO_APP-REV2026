import { describe, expect, it } from "vitest";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  DOCUMENT_UPLOAD_HELP_TEXT,
  DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
  getDocumentFileExtension,
  validateDocumentUploadFile,
} from "@/utils/documentUploadValidation";

describe("documentUploadValidation", () => {
  it("normaliza a extensao e aceita os formatos permitidos", () => {
    const file = new File(["conteudo"], "Relatorio. PDF");

    expect(getDocumentFileExtension(file.name)).toBe("pdf");
    expect(validateDocumentUploadFile(file)).toBe("pdf");
  });

  it("bloqueia tipo de arquivo nao permitido com mensagem clara", () => {
    const file = new File(["bin"], "instalador.exe");

    expect(() => validateDocumentUploadFile(file)).toThrow("Tipo de arquivo nao permitido.");
  });

  it("bloqueia arquivo acima de 50MB com mensagem clara", () => {
    const file = new File([new Uint8Array(DOCUMENT_UPLOAD_MAX_SIZE_BYTES + 1)], "contrato.pdf");

    expect(() => validateDocumentUploadFile(file)).toThrow("Arquivo excede o tamanho maximo de 50MB.");
  });

  it("expoe accept e texto de ajuda consistentes para as telas", () => {
    expect(DOCUMENT_UPLOAD_ACCEPT).toContain(".pdf");
    expect(DOCUMENT_UPLOAD_ACCEPT).toContain(".txt");
    expect(DOCUMENT_UPLOAD_HELP_TEXT).toContain("TXT");
    expect(DOCUMENT_UPLOAD_HELP_TEXT).toContain("50MB");
  });
});
