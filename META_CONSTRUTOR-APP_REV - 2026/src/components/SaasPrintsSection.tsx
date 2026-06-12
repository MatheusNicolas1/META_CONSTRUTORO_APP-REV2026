import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SingleCarousel, type CarouselItem } from '@/components/public/SingleCarousel';

// ─── Prints MOBILE reais + Mockups verticais com moldura ──
// Prioridade: prints de tela de celular. Os verticais têm moldura de celular.

const supabaseBucket = 'https://bgdvlhttyjeuprrfxgun.supabase.co/storage/v1/object/public/community_media/prints/mockup';

const allImages: CarouselItem[] = [
  // ── Layouts reais do app (app mobile) ──
  { src: `${supabaseBucket}/IMG_4502.png`, title: 'Obras no App' },
  { src: `${supabaseBucket}/IMG_4503.png`, title: 'Print Layout' },
  { src: `${supabaseBucket}/IMG_4505.png`, title: 'Tela Inicial' },
  { src: `${supabaseBucket}/IMG_4506.png`, title: 'Checklist' },
  { src: `${supabaseBucket}/IMG_4507.png`, title: 'RDO Digital' },
  { src: `${supabaseBucket}/IMG_4508.png`, title: 'Atividades' },
  { src: `${supabaseBucket}/IMG_4509.png`, title: 'Equipes' },
  { src: `${supabaseBucket}/IMG_4510.png`, title: 'Documentos' },
  { src: `${supabaseBucket}/IMG_4511.png`, title: 'Relatórios' },
  { src: `${supabaseBucket}/IMG_4512.png`, title: 'Dashboard' },
  { src: `${supabaseBucket}/IMG_4513.png`, title: 'Financeiro' },
  { src: `${supabaseBucket}/IMG_4514.png`, title: 'Fornecedores' },
  { src: `${supabaseBucket}/IMG_4515.png`, title: 'Equipamentos' },
  { src: `${supabaseBucket}/IMG_4516.png`, title: 'Configurações' },
  { src: `${supabaseBucket}/IMG_4517.png`, title: 'Notificações' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Seção única ──────────────────────────────────────────

export function MobilePrintsSection() {
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
            <Smartphone className="w-3.5 h-3.5" /> Mobile & Tablet
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            Sua obra na{' '}
            <span className="text-brand-orange">palma da mão</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            O Meta Construtor funciona perfeitamente no celular e tablet — registre RDOs, checklists, atividades e consulte relatórios de qualquer lugar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SingleCarousel
            items={allImages}
            speed={35}
            isMobile={true}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 md:mt-12"
        >
          <p className="text-neutral-500 text-xs md:text-sm mb-4 px-2">Interface responsiva adaptada para celular, tablet e desktop</p>
          <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> 100% responsivo</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> Funciona offline</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> Fotos direto do celular</span>
          </div>
          <Button
            className="mt-6 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full px-8 py-6 text-base shadow-lg shadow-brand-orange/25"
            asChild
          >
            <Link to="/criar-conta">
              Testar de graça <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// SaaSPrintsSection mantido como export vazio para compatibilidade
export function SaaSPrintsSection() {
  return null;
}
