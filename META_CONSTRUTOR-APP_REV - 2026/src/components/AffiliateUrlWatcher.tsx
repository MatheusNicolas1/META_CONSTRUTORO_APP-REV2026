import { useEffect } from 'react'
import { checkUrlForAffiliateRef } from '@/utils/affiliateTracker'

/**
 * Componente invisível que verifica a URL em busca de ?ref=CODE
 * no carregamento da página e processa o clique de afiliado.
 * 
 * Deve ser renderizado dentro do BrowserRouter, antes do AuthWrapper.
 */
export function AffiliateUrlWatcher() {
  useEffect(() => {
    checkUrlForAffiliateRef()
  }, [])

  return null
}
