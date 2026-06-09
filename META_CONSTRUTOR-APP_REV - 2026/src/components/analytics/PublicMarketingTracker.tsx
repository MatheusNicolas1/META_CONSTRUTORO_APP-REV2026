import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/integrations/analytics";
import { trackPageView } from "@/integrations/ga4";

const PUBLIC_MARKETING_ROUTES = new Set([
  "/home",
  "/preco",
  "/checkout",
  "/criar-conta",
  "/contato",
]);

const routeEvents: Record<string, string> = {
  "/home": "marketing.home_viewed",
  "/preco": "marketing.pricing_viewed",
  "/checkout": "billing.checkout_viewed",
  "/criar-conta": "auth.signup_viewed",
  "/contato": "marketing.contact_viewed",
};

const sanitizeLabel = (value: string) => {
  return value
    .replace(/\S+@\S+\.\S+/g, "[email]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
};

const getSafeDestination = (element: HTMLElement) => {
  if (!(element instanceof HTMLAnchorElement) || !element.href) {
    return undefined;
  }

  try {
    const url = new URL(element.href);
    if (url.protocol === "mailto:" || url.protocol === "tel:") {
      return url.protocol.replace(":", "");
    }
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.origin;
  } catch {
    return undefined;
  }
};

const PublicMarketingTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // GA4 pageview em toda rota (marketing ou não)
    trackPageView(location.pathname + location.search, document.title);

    if (!PUBLIC_MARKETING_ROUTES.has(location.pathname)) {
      return;
    }

    const params = new URLSearchParams(location.search);

    track("app.public_page_viewed", {
      path: location.pathname,
      route: location.pathname,
      plan: params.get("plan") || undefined,
      billing: params.get("billing") || undefined,
    });

    const routeEvent = routeEvents[location.pathname];
    if (routeEvent) {
      track(routeEvent, {
        path: location.pathname,
        route: location.pathname,
        plan: params.get("plan") || undefined,
        billing: params.get("billing") || undefined,
      });
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!PUBLIC_MARKETING_ROUTES.has(location.pathname)) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest("a,button,[role='button']")
        : null;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const label = sanitizeLabel(
        target.getAttribute("data-analytics-label") ||
        target.getAttribute("aria-label") ||
        target.innerText ||
        target.textContent ||
        target.tagName
      );

      track("marketing.cta_clicked", {
        path: location.pathname,
        route: location.pathname,
        label: label || target.tagName.toLowerCase(),
        element_type: target.tagName.toLowerCase(),
        destination: getSafeDestination(target),
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [location.pathname]);

  return null;
};

export default PublicMarketingTracker;
