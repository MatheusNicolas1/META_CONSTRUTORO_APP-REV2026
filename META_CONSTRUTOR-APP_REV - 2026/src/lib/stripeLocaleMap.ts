/**
 * Mapa de locales do app (BCP 47) para locales do Stripe Checkout.
 *
 * O Stripe Checkout Session aceita o parâmetro `locale` para exibir a página
 * de pagamento no idioma do usuário.
 *
 * Lista completa de 41 locales suportados pelo Stripe Checkout (via API):
 * auto, ar, bg, cs, da, de, el, en, es, es-419, et, fi, fil, fr, fr-CA,
 * gu, he, hi, hr, hu, id, it, ja, kn, ko, lt, lv, ml, mr, ms, mt, nb,
 * nl, pl, pt, pt-BR, ro, ru, sk, sl, sr, sv, ta, te, th, tr, uk, vi,
 * zh, zh-HK, zh-TW, zh
 *
 * ⚠️ Importante: A página de docs listada em docs.stripe.com/js/appendix/supported_locales
 * tem uma lista MAIS RESTRITIVA (34 locais) do que a API aceita. A lista acima
 * vem da API real e inclui pt-BR, fr-CA, es-419, zh-HK, zh-TW diretamente.
 *
 * @see https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-locale
 * @see https://support.stripe.com/questions/supported-languages-for-stripe-checkout-and-payment-links
 */

/**
 * Mapeamento completo: código de idioma do app → código de locale Stripe.
 *
 * Regras:
 * 1. Locais que o app já traduz (11 idiomas) → Stripe code equivalente
 * 2. Locais que Stripe suporta mas app não → incluso para fallback externo
 * 3. Locais que nem app nem Stripe suportam → fallback para 'auto'
 * 4. 'ar-SA' → Stripe NÃO suporta 'ar' no Checkout (só Elements) → fallback para 'en'
 * 5. 'he' → Stripe NÃO suporta 'he' no Checkout (só Elements) → fallback para 'en'
 */
export const STRIPE_LOCALE_MAP: Record<string, string> = {
  // === Locais que o app TEM tradução (11 idiomas) ===
  'pt-BR': 'pt-BR',  // Stripe aceita!
  'pt-PT': 'pt',      // Stripe não tem pt-PT específico, fallback para 'pt'
  'en-US': 'en',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'it-IT': 'it',
  'zh-CN': 'zh',      // Mandarin simplificado → 'zh' (Stripe usa zh para simplified)
  'ja-JP': 'ja',
  'ru-RU': 'ru',
  'ar-SA': 'en',       // ⚠️ Stripe NÃO suporta 'ar' no Checkout. Fallback para 'en'.

  // === Locais adicionais que Stripe suporta (34+ idiomas) ===
  'bg': 'bg',
  'cs': 'cs',
  'da': 'da',
  'nl': 'nl',
  'et': 'et',
  'fi': 'fi',
  'fil': 'fil',
  'el': 'el',
  'gu': 'gu',
  'hi': 'hi',
  'hr': 'hr',
  'hu': 'hu',
  'id': 'id',
  'kn': 'kn',
  'ko': 'ko',
  'lv': 'lv',
  'lt': 'lt',
  'ml': 'ml',
  'mr': 'mr',
  'ms': 'ms',
  'mt': 'mt',
  'nb': 'nb',
  'pl': 'pl',
  'ro': 'ro',
  'sk': 'sk',
  'sl': 'sl',
  'sr': 'sr',
  'sv': 'sv',
  'ta': 'ta',
  'te': 'te',
  'th': 'th',
  'tr': 'tr',
  'uk': 'uk',
  'vi': 'vi',

  // Variantes regionais que Stripe suporta diretamente
  'es-419': 'es-419',   // Spanish (Latin America) — Stripe suporta!
  'fr-CA': 'fr-CA',     // French (Canada) — Stripe suporta!
  'zh-TW': 'zh-TW',     // Traditional Chinese (Taiwan) — Stripe suporta!
  'zh-HK': 'zh-HK',     // Chinese (Hong Kong) — Stripe suporta!
};

/**
 * Retorna o código de locale Stripe apropriado para um dado código de idioma.
 *
 * Estratégia de fallback:
 * 1. Tenta o mapeamento exato no STRIPE_LOCALE_MAP
 * 2. Tenta apenas o código base do idioma (ex: 'pt' de 'pt-BR', 'fr' de 'fr-FR')
 * 3. Fallback para 'auto' (Stripe detecta do navegador)
 *
 * @param appLanguage - Código de idioma do app (ex: 'pt-BR', 'en-US', 'fr-FR')
 * @returns Código de locale Stripe ou 'auto'
 *
 * @example
 * getStripeLocale('pt-BR')  // → 'pt-BR'
 * getStripeLocale('en-US')  // → 'en'
 * getStripeLocale('ar-SA')  // → 'en' (fallback: Stripe não tem ar no Checkout)
 * getStripeLocale('fr-CA')  // → 'fr-CA'
 * getStripeLocale('unknown') // → 'auto'
 */
export function getStripeLocale(appLanguage: string): string {
  if (!appLanguage || typeof appLanguage !== 'string') {
    return 'auto';
  }

  const trimmed = appLanguage.trim();

  // 1. Tenta mapeamento exato
  if (STRIPE_LOCALE_MAP[trimmed]) {
    return STRIPE_LOCALE_MAP[trimmed];
  }

  // 2. Tenta o código base (ex: 'pt' de 'pt-BR', 'fr' de 'fr-FR')
  const baseLang = trimmed.split('-')[0];
  if (baseLang && STRIPE_LOCALE_MAP[baseLang]) {
    return STRIPE_LOCALE_MAP[baseLang];
  }

  // 3. Fallback: Stripe detecta do navegador
  return 'auto';
}
