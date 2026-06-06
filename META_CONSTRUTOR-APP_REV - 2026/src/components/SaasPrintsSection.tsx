import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Monitor, Smartphone, CheckCircle, ArrowRight, Layout, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TripleCarousel, type CarouselItem } from '@/components/public/TripleCarousel';

const MARKETING = '/marketing';

// ─── Desktop prints ────────────────────────────────────────
// Distribuídos em 3 faixas: row1→direita, row2←esquerda, row3→direita

const saasRow1: CarouselItem[] = [
  {
    src: `${MARKETING}/prd-prints-2026-06-04-03-obra-detalhe-desktop.png`,
    title: 'Detalhes da Obra',
    desc: 'Acompanhe cada obra com cronograma, orçamento e documentos em tempo real.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-02-obras-lista-desktop.png`,
    title: 'Lista de Obras',
    desc: 'Visão geral de todas as obras com status e indicadores.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`,
    title: 'Dashboard Executivo',
    desc: 'Painel completo com métricas e gráficos da sua operação.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-01-login-limpo-desktop.png`,
    title: 'Login',
    desc: 'Acesso rápido e seguro à plataforma.',
  },
];

const saasRow2: CarouselItem[] = [
  {
    src: `${MARKETING}/prd-prints-2026-06-04-14-atividade-nova-modal-desktop.png`,
    title: 'Novas Atividades',
    desc: 'Criação rápida de atividades com fotos, prazos e responsáveis.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-04-atividades-lista-desktop.png`,
    title: 'Lista de Atividades',
    desc: 'Acompanhe todas as atividades programadas e em andamento.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-16-checklist-detalhe-desktop.png`,
    title: 'Checklists Inteligentes',
    desc: 'Checklists customizáveis com aprovação digital e evidência fotográfica.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-06-checklist-lista-desktop.png`,
    title: 'Lista de Checklists',
    desc: 'Gerencie todos os checklists por obra e por rotina.',
  },
];

const saasRow3: CarouselItem[] = [
  {
    src: `${MARKETING}/prd-prints-2026-06-04-08-equipes-lista-desktop.png`,
    title: 'Gestão de Equipes',
    desc: 'Cadastre equipes, atribua responsáveis e acompanhe produtividade.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-11-despesas-lista-desktop.png`,
    title: 'Controle de Despesas',
    desc: 'Registre e categorize despesas com relatórios financeiros integrados.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-10-fornecedores-lista-desktop.png`,
    title: 'Fornecedores',
    desc: 'Centralize fornecedores, contratos e histórico de serviços.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-09-equipamentos-lista-desktop.png`,
    title: 'Equipamentos',
    desc: 'Controle de maquinário, manutenção e alocação por obra.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-12-relatorios-resumo-desktop.png`,
    title: 'Relatórios',
    desc: 'Relatórios completos com gráficos e exportação.',
  },
  {
    src: `${MARKETING}/prd-prints-2026-06-04-05-rdo-lista-desktop.png`,
    title: 'RDO Digital',
    desc: 'Registre diários de obra com fotos, clima e equipe.',
  },
];

// ─── Mobile prints ─────────────────────────────────────────
// Mockups de celular com tela do Meta Construtor

const mobileRow1: CarouselItem[] = [
  {
    src: `${MARKETING}/cell-mockup-dashboard.jpg`,
    title: 'Dashboard',
    desc: 'Acompanhe métricas da obra direto do celular.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/dashboard-vertical.jpg`,
    title: 'Dashboard Mobile',
    desc: 'Indicadores em tempo real na palma da mão.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/cell-mockup-checklist.jpg`,
    title: 'Checklist',
    desc: 'Preenchimento de checklists com interface touch otimizada.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/checklist-vertical.jpg`,
    title: 'Checklist Mobile',
    desc: 'Verificações rápidas direto do campo.',
    isMobile: true,
  },
];

const mobileRow2: CarouselItem[] = [
  {
    src: `${MARKETING}/cell-mockup-rdo.jpg`,
    title: 'RDO Digital',
    desc: 'Faça RDOs completos diretamente do smartphone.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/rdo-vertical.jpg`,
    title: 'RDO Mobile',
    desc: 'Registre o dia de obra de onde estiver.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/cell-mockup-documentos.jpg`,
    title: 'Documentos',
    desc: 'Acesse documentos e contratos pelo celular.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/cell-mockup-equipes.jpg`,
    title: 'Equipes',
    desc: 'Gerencie equipes direto do campo.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/equipes-vertical.jpg`,
    title: 'Equipes Mobile',
    desc: 'Controle de equipes na palma da mão.',
    isMobile: true,
  },
];

const mobileRow3: CarouselItem[] = [
  {
    src: `${MARKETING}/obras-vertical.jpg`,
    title: 'Obras',
    desc: 'Navegação simples para consulta rápida de informações.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/relatorios-vertical.jpg`,
    title: 'Relatórios',
    desc: 'Relatórios completos na palma da mão.',
    isMobile: true,
  },
  {
    src: `${MARKETING}/despesas-vertical.jpg`,
    title: 'Despesas',
    desc: 'Registro rápido de despesas do campo.',
    isMobile: true,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Section 1: SaaS Desktop ─────────────────────────────

export function SaaSPrintsSection() {
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
            <Layout className="w-3.5 h-3.5" /> Plataforma completa
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold text-neutral-900 mt-3 mb-4 leading-tight">
            Tudo em um{' '}
            <span className="text-brand-orange">só lugar</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            Do RDO digital ao relatório final — cada módulo foi pensado para simplificar o dia a dia da sua obra.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <TripleCarousel
            row1={saasRow1}
            row2={saasRow2}
            row3={saasRow3}
            speed={35}
          />
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
              Testar de graça <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 2: Mobile ────────────────────────────────────

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
            <Smartphone className="w-3.5 h-3.5" /> Em qualquer dispositivo
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold text-neutral-900 mt-3 mb-4 leading-tight">
            Funciona em{' '}
            <span className="text-brand-orange">qualquer tela</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            Do desktop ao celular — acesse, registre e acompanhe sua obra de onde estiver.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <TripleCarousel
            row1={mobileRow1}
            row2={mobileRow2}
            row3={mobileRow3}
            speed={28}
            isMobileStyle={true}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 md:mt-12"
        >
          <p className="text-neutral-500 text-xs md:text-sm mb-4 px-2">Desktop • Tablet • Smartphone — tudo sincronizado em tempo real</p>
          <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> Responsivo</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> Offline-ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-emerald" /> Touch otimizado</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
