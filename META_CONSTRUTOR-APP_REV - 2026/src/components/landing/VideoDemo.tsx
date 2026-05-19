import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  HardHat,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Play,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const demoSteps = [
  {
    title: 'Busca global inteligente',
    description: 'Localize obras, RDOs, documentos e pendências sem abrir várias telas.',
    shortLabel: 'Busca',
    metric: '12 resultados',
    icon: Search,
  },
  {
    title: 'Atividades em segundos',
    description: 'Crie tarefas, defina responsáveis, prazos e prioridades no mesmo fluxo.',
    shortLabel: 'Atividades',
    metric: '4 novas tarefas',
    icon: PlusCircle,
  },
  {
    title: 'RDO digital completo',
    description: 'Registre equipe, clima, fotos, assinatura e envio automático do relatório.',
    shortLabel: 'RDO',
    metric: 'RDO pronto',
    icon: ClipboardCheck,
  },
  {
    title: 'Indicadores em tempo real',
    description: 'Acompanhe progresso físico, custos, prazos e alertas das obras ativas.',
    shortLabel: 'Indicadores',
    metric: '87% no prazo',
    icon: BarChart3,
  },
];

const cursorPositions = [
  'left-[45%] top-[18%]',
  'left-[64%] top-[70%]',
  'left-[78%] top-[76%]',
  'left-[32%] top-[43%]',
];

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Painel' },
  { icon: Building2, label: 'Obras' },
  { icon: CalendarDays, label: 'Atividades' },
  { icon: FileText, label: 'RDO' },
  { icon: BarChart3, label: 'Relatórios' },
];

const VideoDemo = () => {
  const navigate = useNavigate();
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStep((currentStep) => (currentStep + 1) % demoSteps.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [isInView, prefersReducedMotion]);

  const ActiveStepIcon = demoSteps[activeStep].icon;

  return (
    <section id="demo-section" ref={sectionRef} className="py-16 md:py-24 bg-background">
      <style>
        {`
          @keyframes demo-progress {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }

          @keyframes demo-cursor {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            45% { transform: translate3d(10px, 8px, 0) scale(0.98); }
            55% { transform: translate3d(10px, 8px, 0) scale(0.82); }
          }

          @keyframes demo-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }

          .demo-step-progress {
            animation: demo-progress 4.2s linear forwards;
            transform-origin: left;
          }

          .demo-cursor {
            animation: demo-cursor 2.1s ease-in-out infinite;
          }

          .demo-float {
            animation: demo-float 5s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .demo-step-progress,
            .demo-cursor,
            .demo-float {
              animation: none !important;
            }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            Veja o MetaConstrutor em ação
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Acompanhe um fluxo completo dentro da plataforma: busca global, criação de atividades,
            RDO digital e indicadores de obra em tempo real.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="relative order-1">
            <Card className="overflow-hidden border border-border/70 bg-card shadow-2xl">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-lg bg-[#06111f] text-white">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1726] px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
                      <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
                        <Search className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">app.metaconstrutor.com/{demoSteps[activeStep].shortLabel.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Bell className="h-4 w-4" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#06111f]">
                        <HardHat className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[420px] flex-col sm:min-h-[460px] md:flex-row">
                    <aside className="flex shrink-0 border-b border-white/10 bg-[#0b1726] px-3 py-3 md:w-[76px] md:flex-col md:border-b-0 md:border-r">
                      <div className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 md:flex">
                        <Menu className="h-4 w-4" />
                      </div>
                      <div className="mt-0 flex flex-1 items-center justify-between gap-2 md:mt-5 md:flex-col md:justify-start">
                        {sidebarItems.map((item, index) => {
                          const ItemIcon = item.icon;
                          const isActive =
                            (activeStep === 0 && index === 0) ||
                            (activeStep === 1 && index === 2) ||
                            (activeStep === 2 && index === 3) ||
                            (activeStep === 3 && index === 4);

                          return (
                            <div
                              key={item.label}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ${
                                isActive
                                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                              aria-label={item.label}
                            >
                              <ItemIcon className="h-4 w-4" />
                            </div>
                          );
                        })}
                      </div>
                    </aside>

                    <div className="relative flex-1 overflow-hidden bg-[#06111f] p-4 sm:p-5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,87,34,0.16),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(37,153,213,0.16),transparent_28%)]" />

                      <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                            <Zap className="h-3.5 w-3.5" />
                            Demo interativa
                          </div>
                          <h3 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                            {demoSteps[activeStep].title}
                          </h3>
                          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                            {demoSteps[activeStep].description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                          <ActiveStepIcon className="h-3.5 w-3.5" />
                          {demoSteps[activeStep].metric}
                        </div>
                      </div>

                      <div className="relative z-10 h-[310px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1726]/95 p-3 shadow-2xl sm:h-[330px] sm:p-4">
                        <div
                          key={activeStep}
                          className={`demo-cursor pointer-events-none absolute z-30 hidden h-7 w-7 rounded-full border-2 border-white bg-primary shadow-[0_0_22px_rgba(255,87,34,0.65)] sm:block ${cursorPositions[activeStep]}`}
                        >
                          <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40" />
                        </div>

                        <div key={`screen-${activeStep}`} className="h-full animate-fade-in">
                          <DemoScreen activeStep={activeStep} />
                        </div>
                      </div>

                      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {demoSteps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isActive = index === activeStep;

                          return (
                            <button
                              key={step.title}
                              type="button"
                              onClick={() => setActiveStep(index)}
                              className={`relative overflow-hidden rounded-lg border p-3 text-left transition-all duration-300 ${
                                isActive
                                  ? 'border-primary/50 bg-primary/10 text-white'
                                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <StepIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                                <span className="text-[11px] font-semibold leading-none">{step.shortLabel}</span>
                              </div>
                              {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20">
                                  <div key={`progress-${activeStep}`} className="demo-step-progress h-full bg-primary" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="demo-float absolute -right-4 -top-5 hidden rounded-xl border border-border bg-white p-3 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fluxo seguro</div>
                  <div className="text-sm font-semibold text-foreground">Dados salvos</div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2">
            <div className="space-y-7">
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-foreground">
                  Um tour rápido pelo dia a dia da obra
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  A demonstração mostra as operações principais em sequência. Clique em uma etapa
                  para ver a tela correspondente dentro do mockup.
                </p>
              </div>

              <div className="space-y-3">
                {demoSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === activeStep;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-primary/35 bg-primary/10 shadow-lg shadow-primary/5'
                          : 'border-border bg-card hover:border-primary/25 hover:bg-muted/30'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:text-primary'
                        }`}
                      >
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h4 className="text-base font-semibold leading-snug text-foreground">{step.title}</h4>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'translate-x-1 text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto touch-manipulation text-base font-semibold leading-none"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Começar Gratuitamente
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/preco')}
                  className="border-border hover:bg-muted w-full sm:w-auto touch-manipulation text-base font-semibold leading-none"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DemoScreen = ({ activeStep }: { activeStep: number }) => {
  if (activeStep === 0) {
    return <SearchScreen />;
  }

  if (activeStep === 1) {
    return <ActivitiesScreen />;
  }

  if (activeStep === 2) {
    return <RdoScreen />;
  }

  return <InsightsScreen />;
};

const SearchScreen = () => (
  <div className="grid h-full gap-3 md:grid-cols-[0.9fr_1.1fr]">
    <div className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-white">
        <Search className="h-4 w-4 text-primary" />
        <span className="truncate">buscar: concretagem torre A</span>
      </div>
      <div className="space-y-2 overflow-hidden">
        {[
          ['Obra Vista Norte', 'Cronograma atualizado há 8 min'],
          ['RDO #142', 'Equipe de forma e concretagem'],
          ['Checklist estrutural', '3 itens pendentes de evidência'],
        ].map(([title, subtitle], index) => (
          <div
            key={title}
            className={`rounded-lg border p-3 ${
              index === 1 ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-[#06111f]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white">{title}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">abrir</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="hidden min-h-0 rounded-lg border border-white/10 bg-[#06111f] p-3 md:block">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Resultado aberto</p>
          <h4 className="mt-1 text-sm font-semibold text-white">RDO #142 - Torre A</h4>
        </div>
        <CheckCircle2 className="h-5 w-5 text-green-400" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric label="Equipe" value="18" />
        <MiniMetric label="Fotos" value="24" />
        <MiniMetric label="Avanço" value="72%" />
      </div>
      <div className="mt-4 space-y-2">
        <FakeLine width="w-full" />
        <FakeLine width="w-11/12" />
        <FakeLine width="w-8/12" />
      </div>
      <div className="mt-4 rounded-lg border border-green-400/20 bg-green-400/10 p-3 text-xs text-green-200">
        Evidências encontradas e vinculadas ao relatório da obra.
      </div>
    </div>
  </div>
);

const ActivitiesScreen = () => (
  <div className="grid h-full gap-3 md:grid-cols-3">
    {[
      {
        title: 'A fazer',
        cards: ['Impermeabilização bloco B', 'Pedido de concreto'],
      },
      {
        title: 'Em execução',
        cards: ['Concretagem laje 4', 'Montagem de formas'],
      },
      {
        title: 'Concluído',
        cards: ['Checklist de segurança', 'Liberação de equipe'],
      },
    ].map((column, columnIndex) => (
      <div key={column.title} className="min-h-0 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-white">{column.title}</h4>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{column.cards.length}</span>
        </div>
        <div className="space-y-2">
          {column.cards.map((card, index) => (
            <div
              key={card}
              className={`rounded-lg border p-3 ${
                columnIndex === 1 && index === 0
                  ? 'border-primary/45 bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-white/10 bg-[#06111f]'
              }`}
            >
              <p className="text-xs font-semibold leading-snug text-white">{card}</p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Equipe {columnIndex + 1}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  hoje
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const RdoScreen = () => (
  <div className="grid h-full gap-3 md:grid-cols-[1fr_0.9fr]">
    <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">Novo RDO - Obra Vista Norte</h4>
        <span className="rounded-full bg-green-400/10 px-2 py-1 text-[10px] font-semibold text-green-300">salvo</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniField label="Clima" value="Ensolarado" />
        <MiniField label="Equipe" value="18 colaboradores" />
        <MiniField label="Atividade" value="Concretagem" />
        <MiniField label="Avanço" value="72% físico" />
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-[#06111f] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ocorrências do dia</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Laje 4 concluída com controle de slump registrado e equipe liberada para cura.
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-white">
        <Send className="h-4 w-4 text-primary" />
        Envio automático para cliente e engenharia
      </div>
    </div>

    <div className="hidden min-h-0 flex-col rounded-lg border border-white/10 bg-[#06111f] p-3 md:flex">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-white">Evidências</h4>
        <UploadCloud className="h-4 w-4 text-primary" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['Foto 01', 'Foto 02', 'Assinatura', 'Anexo'].map((item, index) => (
          <div key={item} className="flex aspect-[4/3] items-end rounded-lg border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950 p-2">
            <span className={`rounded px-2 py-0.5 text-[10px] ${index === 2 ? 'bg-green-400/20 text-green-200' : 'bg-white/10 text-slate-300'}`}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InsightsScreen = () => (
  <div className="grid h-full gap-3 md:grid-cols-[0.9fr_1.1fr]">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
      <InsightCard icon={TrendingUp} label="Progresso físico" value="87%" tone="text-green-300" />
      <InsightCard icon={Clock} label="Prazo previsto" value="12 dias" tone="text-blue-300" />
      <InsightCard icon={Users} label="Equipe ativa" value="42" tone="text-orange-300" />
    </div>
    <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Painel executivo</p>
          <h4 className="mt-1 text-sm font-semibold text-white">Obras no prazo</h4>
        </div>
        <MessageSquare className="h-4 w-4 text-primary" />
      </div>
      <div className="flex h-36 items-end gap-2">
        {[46, 62, 54, 76, 68, 87, 81].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-md ${index === 5 ? 'bg-primary' : 'bg-slate-700'}`}
              style={{ height: `${height}%` }}
            />
            <span className="text-[9px] text-slate-500">{index + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-green-400/20 bg-green-400/10 p-3 text-xs text-green-200">
        Alerta: cronograma dentro da margem planejada para esta semana.
      </div>
    </div>
  </div>
);

const MiniMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
    <p className="text-[10px] text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
  </div>
);

const MiniField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-[#06111f] p-2">
    <p className="text-[10px] text-slate-500">{label}</p>
    <p className="mt-1 truncate text-xs font-semibold text-white">{value}</p>
  </div>
);

const FakeLine = ({ width }: { width: string }) => (
  <div className={`h-2 rounded-full bg-slate-700 ${width}`} />
);

const InsightCard = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-[#06111f] p-3">
    <div className="mb-3 flex items-center justify-between">
      <Icon className={`h-4 w-4 ${tone}`} />
      <CheckCircle2 className="h-4 w-4 text-green-400" />
    </div>
    <p className="text-[10px] text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-white">{value}</p>
  </div>
);

export default VideoDemo;
