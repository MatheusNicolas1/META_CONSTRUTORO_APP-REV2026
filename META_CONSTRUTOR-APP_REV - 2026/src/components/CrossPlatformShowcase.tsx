import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Tablet from 'lucide-react/dist/esm/icons/tablet';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';

const MARKETING = '/marketing';

const devices = [
  {
    id: 'mobile',
    icon: Smartphone,
    label: 'Celular',
    src: `${MARKETING}/prd-prints-2026-06-04-26-obras-mobile.png`,
    desc: 'Acompanhe RDOs, atividades e obras direto do celular.',
  },
  {
    id: 'tablet',
    icon: Tablet,
    label: 'Tablet',
    src: `${MARKETING}/prd-prints-2026-06-04-22-dashboard-tablet.webp`,
    desc: 'Gerencie checklists e relatórios em tela maior.',
  },
  {
    id: 'desktop',
    icon: Monitor,
    label: 'Computador',
    src: `${MARKETING}/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp`,
    desc: 'Dashboard completo com indicadores da obra.',
  },
];

/** Altura visual consistente para todos os mockups */
const MOCKUP_HEIGHT = 300;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

function DeviceMockup({ device, index }: { device: typeof devices[0]; index: number }) {
  const Icon = device.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center"
    >
      {/* Mockup — altura consistente para todos os dispositivos */}
      <div className="relative mx-auto w-full max-w-[160px] sm:max-w-[200px] md:max-w-[300px] flex justify-center">
        {device.id === 'mobile' && (
          /* --- CELULAR (proporção real 9:19) --- */
          <div className="relative overflow-hidden rounded-[1.75rem] border-[3px] border-neutral-800 bg-neutral-900 shadow-xl"
            style={{ height: MOCKUP_HEIGHT, width: 'auto', aspectRatio: '9/19.5' }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-neutral-900 rounded-b-xl z-10 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
            </div>
            {/* Tela com print */}
            <div className="absolute inset-[3px] rounded-[1.5rem] overflow-hidden bg-white">
              <img
                src={device.src}
                alt={device.label}
                className="w-full h-full object-cover object-top"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          </div>
        )}

        {device.id === 'tablet' && (
          /* --- TABLET (proporção real 4:3) --- */
          <div className="relative"
            style={{ height: MOCKUP_HEIGHT, width: 'auto', aspectRatio: '4/3' }}
          >
            <div className="relative overflow-hidden rounded-[1.25rem] border-[3px] border-neutral-800 bg-neutral-900 shadow-xl w-full h-full">
              {/* Câmera */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 border-2 border-neutral-700" />
              </div>
              {/* Tela com print */}
              <div className="absolute inset-[3px] rounded-[1rem] overflow-hidden bg-white">
                <img
                  src={device.src}
                  alt={device.label}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {/* Botão Home */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <div className="w-4 h-4 rounded-full border-2 border-neutral-700 bg-neutral-900/50" />
              </div>
            </div>
            {/* Sombra base */}
            <div className="absolute -bottom-2 left-[10%] right-[10%] h-3 bg-neutral-900/20 rounded-full blur-md" />
          </div>
        )}

        {device.id === 'desktop' && (
          /* --- MONITOR (16:10) com suporte compacto --- */
          <div className="relative flex flex-col items-center"
            style={{ height: MOCKUP_HEIGHT + 14 }}
          >
            {/* Tela */}
            <div className="relative overflow-hidden rounded-lg border-2 border-neutral-700 bg-neutral-900 shadow-xl flex-shrink-0"
              style={{ height: MOCKUP_HEIGHT, width: 'auto', aspectRatio: '16/10' }}
            >
              {/* Moldura fina */}
              <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 bg-neutral-800 z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
              </div>
              {/* Tela com print */}
              <div className="absolute inset-[2px] bottom-[6px] sm:bottom-[7px] overflow-hidden bg-white rounded-t-[2px]">
                <img
                  src={device.src}
                  alt={device.label}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            {/* Suporte do monitor */}
            <div className="w-1/2 h-3 sm:h-4 bg-neutral-800 rounded-b-md flex items-center justify-center -mt-px shadow-md flex-shrink-0">
              <div className="w-1/3 h-1 sm:h-1.5 bg-neutral-700 rounded-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Label + Descrição */}
      <div className="mt-3 sm:mt-4 max-w-[200px]">
        <div className="inline-flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange text-xs sm:text-sm font-semibold px-3 py-1 rounded-full mb-1.5">
          <Icon className="w-3.5 h-3.5" />
          {device.label}
        </div>
        <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
          {device.desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function CrossPlatformShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-20 bg-white overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Smartphone className="w-4 h-4" /> Funciona em qualquer tela
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            Use no{' '}
            <span className="text-brand-orange">celular, tablet ou PC</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            O Meta Construtor é 100% web e responsivo — acesse de qualquer dispositivo
            sem instalar nada. Seus dados sincronizam em tempo real.
          </p>
        </motion.div>

        {/* Mockups estáticos */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 lg:gap-14"
        >
          {devices.map((device, i) => (
            <DeviceMockup key={device.id} device={device} index={i} />
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 md:mt-12"
        >
          <p className="text-neutral-500 text-xs md:text-sm mb-4">
            Interface adaptativa — a mesma conta funciona em todos os dispositivos
          </p>
          <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-brand-emerald" /> Responsivo
            </span>
            <span className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-brand-emerald" /> Tablet
            </span>
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-brand-emerald" /> Desktop
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
