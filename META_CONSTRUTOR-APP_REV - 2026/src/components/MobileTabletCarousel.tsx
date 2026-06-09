import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Monitor, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SingleCarousel, type CarouselItem } from '@/components/public/SingleCarousel';

const MARKETING = '/marketing';

// ─── Imagens: Tablet, Mobile e Mockups ──────────────────────
// NENHUMA dessas está nos carrosséis existentes
const images: CarouselItem[] = [
  { src: `${MARKETING}/prd-prints-2026-06-04-22-dashboard-tablet.png`, title: 'Dashboard — Tablet' },
  { src: `${MARKETING}/prd-prints-2026-06-04-23-obras-tablet.png`, title: 'Obras — Tablet' },
  { src: `${MARKETING}/prd-prints-2026-06-04-24-checklist-tablet.png`, title: 'Checklist — Tablet' },
  { src: `${MARKETING}/prd-prints-2026-06-04-25-rdo-mobile.png`, title: 'RDO — Celular' },
  { src: `${MARKETING}/prd-prints-2026-06-04-26-obras-mobile.png`, title: 'Obras — Celular' },
  { src: `${MARKETING}/prd-prints-2026-06-04-27-atividade-mobile.png`, title: 'Atividade — Celular' },
  { src: `${MARKETING}/prd-prints-2026-06-04-22-dashboard-tablet.png`, title: 'Dashboard — Tablet' },
  { src: `${MARKETING}/prd-prints-2026-06-04-23-obras-tablet.png`, title: 'Obras — Tablet' },
];

export function MobileTabletCarousel() {
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
            <Monitor className="w-3.5 h-3.5" /> Tablet & Celular
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            Funciona em{' '}
            <span className="text-brand-orange">qualquer tela</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            Do desktop ao tablet ao celular — a interface se adapta perfeitamente. Use na obra com o tablet, registre RDOs no celular e acompanhe dashboards no escritório.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SingleCarousel items={images} speed={30} isMobile={true} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 md:mt-12"
        >
          <p className="text-neutral-500 text-xs md:text-sm mb-4 px-2">Interface adaptativa — desktop, tablet e celular</p>
          <Button
            className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full px-8 py-6 text-base shadow-lg shadow-brand-orange/25"
            asChild
          >
            <Link to="/criar-conta">
              Testar em qualquer dispositivo <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default MobileTabletCarousel;
