'use client'

import { useState, useEffect, useRef } from 'react'

export interface LeadInfo {
  nome: string
  email: string
  site: string
  estado: string
  cidade: string
}

interface LeadDetectionResult {
  loading: boolean
  found: boolean
  lead: LeadInfo | null
  error: string | null
}

const SUPABASE_URL = 'https://bgdvlhttyjeuprrfxgun.supabase.co'

/**
 * Hook que detecta se um email digitado pertence a um lead pré-cadastrado.
 * Faz debounce de 600ms e chama a Edge Function lookup-lead.
 */
export function useLeadDetection(email: string): LeadDetectionResult {
  const [result, setResult] = useState<LeadDetectionResult>({
    loading: false,
    found: false,
    lead: null,
    error: null,
  })
  const lastEmailRef = useRef('')

  useEffect(() => {
    const normalized = email.trim().toLowerCase()

    // Se email vazio ou inválido, reseta
    if (!normalized || !normalized.includes('@') || normalized.length < 5) {
      setResult({ loading: false, found: false, lead: null, error: null })
      lastEmailRef.current = ''
      return
    }

    // Se é o mesmo email já verificado, não repete
    if (normalized === lastEmailRef.current) return

    const timer = setTimeout(async () => {
      lastEmailRef.current = normalized
      setResult(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/lookup-lead`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // A anon key é pública e segura para uso no client
              'Authorization': `Bearer ${(import.meta as any).env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ email: normalized }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.found && data.lead) {
          setResult({
            loading: false,
            found: true,
            lead: data.lead as LeadInfo,
            error: null,
          })
        } else {
          setResult({
            loading: false,
            found: false,
            lead: null,
            error: null,
          })
        }
      } catch (err) {
        console.error('[LeadDetection] Erro ao buscar lead:', err)
        setResult({
          loading: false,
          found: false,
          lead: null,
          error: err instanceof Error ? err.message : 'Erro ao consultar',
        })
      }
    }, 600) // debounce de 600ms

    return () => clearTimeout(timer)
  }, [email])

  return result
}
