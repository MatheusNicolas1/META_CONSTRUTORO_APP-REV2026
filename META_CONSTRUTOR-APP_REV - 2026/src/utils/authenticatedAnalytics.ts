import { containsAnalyticsPii } from "./analyticsPrivacy";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const numericIdPattern = /^\d+$/;

const routeNames: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /^\/app\/dashboard$/, name: "dashboard" },
  { pattern: /^\/app\/obras(\/|$)/, name: "obras" },
  { pattern: /^\/app\/rdo(\/|$)/, name: "rdos" },
  { pattern: /^\/app\/checklist(\/|$)/, name: "checklists" },
  { pattern: /^\/app\/documentos(\/|$)/, name: "documentos" },
  { pattern: /^\/app\/relatorios(\/|$)/, name: "relatorios" },
  { pattern: /^\/app\/configuracoes(\/|$)/, name: "configuracoes" },
  { pattern: /^\/app\/perfil(\/|$)/, name: "perfil" },
  { pattern: /^\/app\/admin(\/|$)/, name: "admin" },
];

const normalizeSegment = (segment: string) => {
  if (uuidPattern.test(segment) || numericIdPattern.test(segment)) return ":id";
  return segment;
};

export const canonicalizeAuthenticatedRoute = (pathname: string) => {
  const cleanPath = pathname.split("?")[0].split("#")[0] || "/";
  const canonicalPath = cleanPath
    .split("/")
    .map((segment) => normalizeSegment(segment))
    .join("/")
    .replace(/\/{2,}/g, "/");

  const routeName = routeNames.find((route) => route.pattern.test(canonicalPath))?.name || "authenticated_other";
  return { routeName, canonicalPath };
};

export const sanitizeInteractionLabel = (value: string | null | undefined) => {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  if (!normalized || containsAnalyticsPii(normalized)) return "redacted";
  return normalized;
};

export const getInteractionTargetId = (element: Element, pathname: string) => {
  const explicit = element.getAttribute("data-analytics-id");
  if (explicit) return sanitizeInteractionLabel(explicit);

  const ariaLabel = element.getAttribute("aria-label") || element.getAttribute("title");
  if (ariaLabel) return sanitizeInteractionLabel(ariaLabel);

  if (element instanceof HTMLAnchorElement) {
    try {
      const url = new URL(element.href, window.location.origin);
      return sanitizeInteractionLabel(`link:${url.pathname}`);
    } catch {
      return "link";
    }
  }

  return sanitizeInteractionLabel(element.textContent || pathname);
};
