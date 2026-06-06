import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Img } from 'remotion';

const BG = '#0F172A';
const ORANGE = '#F97316';
const WHITE = '#F8FAFC';

const slides = [
  {
    title: 'Dashboard Inteligente',
    desc: 'Visão completa de todas as suas obras em tempo real.',
    image: '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png',
  },
  {
    title: 'RDO Digital',
    desc: 'Registre o diário de obra com fotos, clima e aprovação.',
    image: '/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.png',
  },
  {
    title: 'Gestão de Obras',
    desc: 'Cronograma, orçamento e equipes — tudo centralizado.',
    image: '/marketing/prd-prints-2026-06-04-02-obras-lista-desktop.png',
  },
  {
    title: 'Relatórios em PDF',
    desc: 'Exporte relatórios profissionais com um clique.',
    image: '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.png',
  },
  {
    title: 'Checklists Inteligentes',
    desc: 'Garanta a qualidade com checklists customizáveis.',
    image: '/marketing/prd-prints-2026-06-04-06-checklist-lista-desktop.png',
  },
];

const SLIDE_DURATION = 160; // ~5.3s per slide

export const ProductDemo = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      {/* Intro sequence: first 60 frames */}
      <Sequence from={0} durationInFrames={60}>
        <IntroOverlay fps={fps} frame={frame} />
      </Sequence>

      {/* Slides */}
      {slides.map((slide, i) => {
        const slideStart = 60 + i * SLIDE_DURATION;
        return (
          <Sequence key={i} from={slideStart} durationInFrames={SLIDE_DURATION}>
            <SlideContent
              slide={slide}
              index={i}
              frame={frame - slideStart}
              fps={fps}
              width={width}
              height={height}
            />
          </Sequence>
        );
      })}

      {/* Outro: last 60 frames */}
      <Sequence from={60 + slides.length * SLIDE_DURATION} durationInFrames={60}>
        <OutroOverlay fps={fps} frame={0} />
      </Sequence>
    </AbsoluteFill>
  );
};

function IntroOverlay({ fps, frame }: { fps: number; frame: number }) {
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <h1 style={{ fontSize: 56, fontWeight: 800, color: WHITE, textAlign: 'center', lineHeight: 1.2 }}>
        Veja o Meta Construtor{' '}
        <span style={{ color: ORANGE }}>em ação</span>
      </h1>
    </div>
  );
}

function SlideContent({
  slide,
  index,
  frame,
  fps,
  width,
  height,
}: {
  slide: (typeof slides)[0];
  index: number;
  frame: number;
  fps: number;
  width: number;
  height: number;
}) {
  const opacity = interpolate(frame, [0, 15, 130, 160], [0, 1, 0.8, 0]);
  const x = interpolate(frame, [0, 15], [60, 0], { extrapolateRight: 'clamp' });
  const imgScale = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const imgOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '0 80px',
        opacity,
        gap: 64,
        transform: `translateX(${x}px)`,
      }}
    >
      {/* Text side */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <div
          style={{
            background: ORANGE,
            color: WHITE,
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 16 }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: 20, color: '#94A3B8', lineHeight: 1.5 }}>{slide.desc}</p>
      </div>

      {/* Image side */}
      <div
        style={{
          flex: 1.3,
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)`,
        }}
      >
        <Img src={slide.image} style={{ width: '100%', display: 'block' }} />
      </div>
    </div>
  );
}

function OutroOverlay({ fps, frame }: { fps: number; frame: number }) {
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity,
        background: `linear-gradient(135deg, ${BG}, ${ORANGE}30)`,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: 52, fontWeight: 800, color: WHITE, marginBottom: 16, lineHeight: 1.2 }}>
        Pronto para organizar{' '}
        <span style={{ color: ORANGE }}>suas obras?</span>
      </h2>
      <p style={{ fontSize: 22, color: '#94A3B8', marginBottom: 32 }}>
        metaconstrutor.app.br — Comece grátis hoje
      </p>
    </div>
  );
}
