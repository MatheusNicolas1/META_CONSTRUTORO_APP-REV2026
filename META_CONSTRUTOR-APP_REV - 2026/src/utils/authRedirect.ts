const DEFAULT_AUTH_REDIRECT = "/app/dashboard";

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
