import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SingleCarousel, type CarouselItem } from '@/components/public/SingleCarousel';

const MARKETING = '/marketing';

// ─── Imagens: Dashboards, Relatórios e Integrações ──────────
// NENHUMA dessas está no carrossel "Sua obra na palma da mão"
const images: CarouselItem[] = [
  { src: `${MARKETING}/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`, title: 'Dashboard Resumo' },
  { src: `${MARKETING}/prd-prints-2026-06-04-12-relatorios-resumo-desktop.png`, title: 'Relatórios' },
  { src: `${MARKETING}/prd-prints-2026-06-04-13-integracoes-status-desktop.png`, title: 'Integrações' },
  { src: `${MARKETING}/prd-prints-2026-06-04-20-faq-desktop.png`, title: 'FAQ & Ajuda' },
  { src: `${MARKETING}/prd-prints-2026-06-04-21-feedback-desktop.png`, title: 'Feedback' },
  { src: `${MARKETING}/prd-prints-2026-06-04-19-notificacoes-desktop.png`, title: 'Notificações' },
  { src: `${MARKETING}/prd-prints-2026-06-04-17-perfil-conta-desktop.png`, title: 'Perfil da Conta' },
  { src: `${MARKETING}/prd-prints-2026-06-04-18-configuracoes-desktop.png`, title: 'Configurações' },
];

export function DashboardPrintsCarousel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-20 bg-white overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <BarChart3 className="w-3.5 h-3.5" /> Visão Executiva
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            Dashboard e{' '}
            <span className="text-brand-orange">relatórios completos</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            Acompanhe o desempenho de todas as obras em tempo real. Gráficos, indicadores, relatórios exportáveis e integrações nativas — tudo no mesmo lugar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SingleCarousel items={images} speed={40} isMobile={false} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 md:mt-12"
        >
          <Button
            className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full px-8 py-6 text-base shadow-lg shadow-brand-orange/25"
            asChild
          >
            <Link to="/criar-conta">
              Ver dashboard completo <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default DashboardPrintsCarousel;
