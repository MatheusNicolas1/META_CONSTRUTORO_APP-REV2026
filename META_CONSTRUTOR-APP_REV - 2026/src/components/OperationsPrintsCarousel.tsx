import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SingleCarousel, type CarouselItem } from '@/components/public/SingleCarousel';

const MARKETING = '/marketing';

// ─── Imagens: Gestão diária — RDOs, Checklists, Atividades, Equipes ──
// NENHUMA dessas está no carrossel "Sua obra na palma da mão"
const images: CarouselItem[] = [
  { src: `${MARKETING}/prd-prints-2026-06-04-05-rdo-lista-desktop.png`, title: 'RDO — Lista' },
  { src: `${MARKETING}/prd-prints-2026-06-04-03-obra-detalhe-desktop.png`, title: 'Detalhe da Obra' },
  { src: `${MARKETING}/prd-prints-2026-06-04-04-atividades-lista-desktop.png`, title: 'Atividades' },
  { src: `${MARKETING}/prd-prints-2026-06-04-14-atividade-nova-modal-desktop.png`, title: 'Nova Atividade' },
  { src: `${MARKETING}/prd-prints-2026-06-04-08-equipes-lista-desktop.png`, title: 'Equipes' },
  { src: `${MARKETING}/prd-prints-2026-06-04-09-equipamentos-lista-desktop.png`, title: 'Equipamentos' },
  { src: `${MARKETING}/prd-prints-2026-06-04-10-fornecedores-lista-desktop.png`, title: 'Fornecedores' },
  { src: `${MARKETING}/prd-prints-2026-06-04-11-despesas-lista-desktop.png`, title: 'Despesas' },
  { src: `${MARKETING}/prd-prints-2026-06-04-01-login-limpo-desktop.png`, title: 'Login' },
  { src: `${MARKETING}/prd-prints-2026-06-04-16-checklist-detalhe-desktop.png`, title: 'Checklist Detalhado' },
];

export function OperationsPrintsCarousel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-20 bg-neutral-50 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <ClipboardList className="w-3.5 h-3.5" /> Gestão Diária
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            RDO, equipes e{' '}
            <span className="text-brand-orange">checklists</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            Do diário de obra ao controle de equipes — registre tudo que acontece no canteiro com poucos cliques. Checklists inteligentes, fotos, clima e assinatura digital.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SingleCarousel items={images} speed={35} isMobile={false} />
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
              Ver gestão completa <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default OperationsPrintsCarousel;
