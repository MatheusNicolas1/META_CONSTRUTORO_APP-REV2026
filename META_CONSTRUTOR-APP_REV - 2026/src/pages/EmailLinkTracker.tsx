import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Página de tracking de cliques de email.
 * 
 * Formato da URL: /l/dia-01?c=CONTACT_ID&d=https%3A%2F%2Fwww.metaconstrutor.app.br%2Fhome&ct=cta-principal
 * 
 * Parâmetros:
 *   - path param: campaign_day (dia-01, dia-02, etc)
 *   - c: contact_id (obrigatório — identifica quem clicou)
 *   - d: destino URL encoded (obrigatório — pra onde redirecionar)
 *   - ct: content type (opcional — ex: 'rdo-tecnico', 'cta-principal')
 *   - ca: campaign override (opcional — default = path param)
 *   - utm_s, utm_m, utm_ca, utm_co: override UTM params
 */
export default function EmailLinkTracker() {
  const { campaignDay } = useParams<{ campaignDay: string }>();
  const [searchParams] = useSearchParams();
  const logged = useRef(false);
  const [status, setStatus] = useState<'logging' | 'redirecting' | 'error'>('logging');

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;

    const contactId = searchParams.get('c');
    const destinoRaw = searchParams.get('d');
    const contentType = searchParams.get('ct') || 'link-generico';
    const campaignOverride = searchParams.get('ca');

    if (!contactId || !destinoRaw) {
      setStatus('error');
      // Se faltar params, redireciona pra home mesmo
      window.location.replace('https://www.metaconstrutor.app.br/');
      return;
    }

    const destino = decodeURIComponent(destinoRaw);
    const utmSource = searchParams.get('utm_s') || 'email';
    const utmMedium = searchParams.get('utm_m') || 'campanha26';
    const utmCampaign = campaignOverride || campaignDay || 'desconhecido';

    // Adiciona UTM params ao destino se não tiver
    const url = new URL(destino, 'https://www.metaconstrutor.app.br');
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', utmSource);
      url.searchParams.set('utm_medium', utmMedium);
      url.searchParams.set('utm_campaign', utmCampaign);
      url.searchParams.set('utm_content', contentType);
    }

    const destinoFinal = url.toString();

    // Detecta device info básico via user-agent
    const ua = navigator.userAgent;
    const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
    const browser = ua.includes('Chrome') ? 'Chrome'
      : ua.includes('Firefox') ? 'Firefox'
      : ua.includes('Safari') ? 'Safari'
      : ua.includes('Edge') ? 'Edge'
      : 'Outros';
    const os = ua.includes('Windows') ? 'Windows'
      : ua.includes('Mac') ? 'macOS'
      : ua.includes('Linux') ? 'Linux'
      : ua.includes('Android') ? 'Android'
      : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
      : 'Outros';

    // Loga o clique no Supabase
    supabase
      .from('email_click_log')
      .insert({
        contact_id: contactId,
        campaign_day: utmCampaign,
        link_destino: destinoFinal,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: contentType,
        device_type: deviceType,
        browser,
        os,
        user_agent: ua.slice(0, 500),
      })
      .then(({ error }: { error: Error | null }) => {
        if (error) {
          console.warn('Erro ao logar clique (não crítico):', error);
        }
        setStatus('redirecting');
        window.location.replace(destinoFinal);
      }, (err: unknown) => {
        console.warn('Erro ao logar clique (não crítico):', err);
        setStatus('redirecting');
        window.location.replace(destinoFinal);
      });
  }, [campaignDay, searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#64748b',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Redirecionando...</p>
      </div>
    </div>
  );
}
