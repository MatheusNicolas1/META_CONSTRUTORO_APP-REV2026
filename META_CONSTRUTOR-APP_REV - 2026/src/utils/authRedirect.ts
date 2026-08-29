const DEFAULT_AUTH_REDIRECT = "/app/dashboard";

export const getAuthCallbackUrl = (next = DEFAULT_AUTH_REDIRECT) => {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", next.startsWith("/") ? next : DEFAULT_AUTH_REDIRECT);
  return callbackUrl.toString();
};

// OAuth (Google) deve redirecionar para o callback PKCE (/auth/callback),
// onde o AuthCallback troca o `code` pela sessão (exchangeCodeForSession).
// Usa a origem atual para funcionar em localhost, preview e produção.
export const getGoogleOAuthRedirectUrl = () => getAuthCallbackUrl();

export const getSafeAuthNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
};
