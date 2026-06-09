import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Image } from 'lucide-react';
import { TripleCarousel, type CarouselItem } from '@/components/public/TripleCarousel';

const MARKETING = '/marketing';

const obrasRow1: CarouselItem[] = [
  {
    src: `${MARKETING}/obras-reais/obra-16.jpg`,
    title: 'RDO-2026-01-15',
  },
  {
    src: `${MARKETING}/obras-reais/obra-17.jpg`,
    title: 'RDO-2026-01-22',
  },
  {
    src: `${MARKETING}/obras-reais/obra-18.jpg`,
    title: 'RDO-2026-02-05',
  },
  {
    src: `${MARKETING}/obras-reais/obra-19.jpg`,
    title: 'RDO-2026-02-14',
  },
  {
    src: `${MARKETING}/obras-reais/obra-20.jpg`,
    title: 'RDO-2026-02-28',
  },
];

const obrasRow2: CarouselItem[] = [
  {
    src: `${MARKETING}/obras-reais/obra-21.jpg`,
    title: 'RDO-2026-03-10',
  },
  {
    src: `${MARKETING}/obras-reais/obra-22.jpg`,
    title: 'RDO-2026-03-22',
  },
  {
    src: `${MARKETING}/obras-reais/obra-23.jpg`,
    title: 'RDO-2026-04-03',
  },
  {
    src: `${MARKETING}/obras-reais/obra-24.jpg`,
    title: 'RDO-2026-04-15',
  },
  {
    src: `${MARKETING}/obras-reais/obra-25.jpg`,
    title: 'RDO-2026-04-28',
  },
];

const obrasRow3: CarouselItem[] = [
  {
    src: `${MARKETING}/obras-reais/obra-26.jpg`,
    title: 'RDO-2026-05-06',
  },
  {
    src: `${MARKETING}/obras-reais/obra-01.jpg`,
    title: 'RDO-2026-05-16',
  },
  {
    src: `${MARKETING}/obras-reais/obra-02.jpg`,
    title: 'RDO-2026-05-26',
  },
  {
    src: `${MARKETING}/obras-reais/obra-03.jpg`,
    title: 'RDO-2026-06-05',
  },
  {
    src: `${MARKETING}/obras-reais/obra-04.jpg`,
    title: 'RDO-2026-06-14',
  },
];

export default function ObrasReaisSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-neutral-900 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/15 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Image className="w-3.5 h-3.5" /> Obras reais
          </span>
          <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-extrabold text-white mt-3 mb-4">
            Resultados que{' '}
            <span className="text-brand-orange">falam por si</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Conheça projetos gerenciados com o Meta Construtor — do planejamento à entrega final.
          </p>
        </motion.div>

        {/* Carrossel triplo com imagens de obras */}
        <motion.div
          initial={{ opacity: 0 }}

          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <TripleCarousel
            row1={obrasRow1}
            row2={obrasRow2}
            row3={obrasRow3}
            speed={35}
          />
        </motion.div>
      </div>
    </section>
  );
}
