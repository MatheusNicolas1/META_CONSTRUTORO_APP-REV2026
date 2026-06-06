const DEFAULT_AUTH_REDIRECT = "/app/dashboard";
const PRODUCTION_APP_URL = "https://www.metaconstrutor.app.br";
const PRODUCTION_AUTH_REDIRECT = `${PRODUCTION_APP_URL}${DEFAULT_AUTH_REDIRECT}`;

export const getGoogleOAuthRedirectUrl = () => PRODUCTION_AUTH_REDIRECT;

export const getAuthCallbackUrl = (next = DEFAULT_AUTH_REDIRECT) => {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", next.startsWith("/") ? next : DEFAULT_AUTH_REDIRECT);
  return callbackUrl.toString();
};

export const getSafeAuthNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
};
