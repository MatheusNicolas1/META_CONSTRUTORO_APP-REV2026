const sensitiveKeyPattern = /(email|e-mail|phone|telefone|cpf|cnpj|document|documento|name|nome|address|endereco|senha|password)/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const cpfPattern = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
const cnpjPattern = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;

const looksLikePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13 && /[()+\-\s]/.test(value);
};

export const containsAnalyticsPii = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return emailPattern.test(value) || cpfPattern.test(value) || cnpjPattern.test(value) || looksLikePhone(value);
};

export const sanitizeAnalyticsValue = (key: string, value: unknown): unknown => {
  if (sensitiveKeyPattern.test(key)) return "[redacted]";
  if (typeof value === "string" && containsAnalyticsPii(value)) return "[redacted]";
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeAnalyticsValue(`${key}_${index}`, item));
  }
  if (value && typeof value === "object") {
    return sanitizeAnalyticsProperties(value as Record<string, unknown>);
  }
  return value;
};

export const sanitizeAnalyticsProperties = <T extends Record<string, unknown>>(properties: T): T => {
  return Object.entries(properties).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = sanitizeAnalyticsValue(key, value);
    return acc;
  }, {}) as T;
};
