/**
 * Utilitários para o Programa de Afiliados (PRD06)
 * 
 * Responsabilidades:
 * - Ler o cookie affiliate_ref
 * - Salvar cookie affiliate_ref no cliente
 * - Chamar a Edge Function process-affiliate-referral durante o cadastro
 */

import { supabase } from '@/integrations/supabase/client'

const AFFILIATE_COOKIE_NAME = 'affiliate_ref'
const AFFILIATE_COOKIE_EXPIRY_DAYS = 90

/**
 * Lê o cookie affiliate_ref do navegador
 */
export function getAffiliateCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === AFFILIATE_COOKIE_NAME && value) {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Salva manualmente o cookie affiliate_ref (usado ao carregar
 * a página com ?ref=CODE na URL, para páginas que não passaram
 * pela Edge Function affiliate-tracker)
 */
export function saveAffiliateCookie(affiliateCode: string): void {
  if (typeof document === 'undefined') return

  const expires = new Date(
    Date.now() + AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  )
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(affiliateCode)}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax; Secure`
}

/**
 * Remove o cookie affiliate_ref
 */
export function clearAffiliateCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AFFILIATE_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`
}

/**
 * Verifica se a URL atual contém ?ref=CODE e salva o cookie se necessário
 * Deve ser chamado no carregamento da página (App.tsx ou Layout)
 */
export function checkUrlForAffiliateRef(): string | null {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  const ref = urlParams.get('ref')

  if (ref && /^MC[A-Z0-9]{8}$/.test(ref)) {
    saveAffiliateCookie(ref)
    // Remove ref da URL sem recarregar a página
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('ref')
    window.history.replaceState({}, '', newUrl.toString())
    return ref
  }

  return null
}

/**
 * Processa a indicação de afiliado após o cadastro.
 * Deve ser chamado após o usuário criar a conta com sucesso.
 */
export async function processAffiliateReferral(
  affiliateCode: string,
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      'https://bgdvlhttyjeuprrfxgun.supabase.co'

    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-affiliate-referral`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          affiliate_code: affiliateCode,
          referred_email: email,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.warn('[Affiliate] Referral processing failed:', data.error)
      return { success: false, error: data.error || 'Erro ao processar indicação' }
    }

    // Limpar o cookie após processar
    clearAffiliateCookie()

    return { success: true, message: data.message || 'Indicação registrada!' }
  } catch (error) {
    console.error('[Affiliate] Error processing referral:', error)
    return { success: false, error: 'Erro de conexão ao processar indicação' }
  }
}
