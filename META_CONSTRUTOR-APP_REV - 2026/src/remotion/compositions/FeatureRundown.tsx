import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Img } from 'remotion';

const BG = '#FAFAFA';
const ORANGE = '#F97316';
const DARK = '#171717';

const cards = [
  { icon: '📋', title: 'RDO Digital', desc: 'Diários de obra com fotos e aprovação' },
  { icon: '✅', title: 'Checklists', desc: 'Qualidade e segurança documentadas' },
  { icon: '📊', title: 'Relatórios', desc: 'PDFs profissionais em 1 clique' },
  { icon: '👷', title: 'Equipes', desc: 'Gestão completa de colaboradores' },
  { icon: '📁', title: 'Documentos', desc: 'Repositório centralizado da obra' },
  { icon: '💰', title: 'Financeiro', desc: 'Despesas e orçamento integrados' },
];

const CARD_DURATION = 65; // frames per card (with stagger)

export const FeatureRundown = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      {/* Title */}
      <Sequence from={0} durationInFrames={45}>
        <TitleSlide frame={frame} fps={fps} />
      </Sequence>

      {/* Cards cascade */}
      {cards.map((card, i) => (
        <Sequence key={i} from={40 + i * (CARD_DURATION - 8)} durationInFrames={CARD_DURATION}>
          <CardSlide card={card} index={i} frame={0} fps={fps} />
        </Sequence>
      ))}

      {/* Final frame */}
      <Sequence from={40 + cards.length * (CARD_DURATION - 8)} durationInFrames={60}>
        <EndCard frame={0} fps={fps} />
      </Sequence>
    </AbsoluteFill>
  );
};

function TitleSlide({ frame, fps }: { frame: number; fps: number }) {
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const y = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity,
        transform: `translateY(${(1 - y) * 30}px)`,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: ORANGE,
            fontSize: 18,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          Funcionalidades
        </div>
        <h2 style={{ fontSize: 56, fontWeight: 800, color: DARK, margin: 0 }}>
          Tudo que sua obra precisa
        </h2>
      </div>
    </div>
  );
}

function CardSlide({
  card,
  index,
  frame,
  fps,
}: {
  card: (typeof cards)[0];
  index: number;
  frame: number;
  fps: number;
}) {
  const opacity = interpolate(frame, [0, 10, CARD_DURATION - 10, CARD_DURATION], [0, 1, 0.8, 0]);
  const scale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 18, stiffness: 60 } });
  const x = interpolate(frame, [0, 15], [120, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '48px 64px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          transform: `scale(${scale}) translateX(${x}px)`,
          maxWidth: 700,
          width: '100%',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#FFF7ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            flexShrink: 0,
          }}
        >
          {card.icon}
        </div>
        <div>
          <div
            style={{
              color: ORANGE,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: DARK, margin: '0 0 6px' }}>{card.title}</h3>
          <p style={{ fontSize: 18, color: '#737373', margin: 0 }}>{card.desc}</p>
        </div>
      </div>
    </div>
  );
}

function EndCard({ frame, fps }: { frame: number; fps: number }) {
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity,
        background: `linear-gradient(135deg, ${ORANGE}08, ${BG})`,
      }}
    >
      <h2 style={{ fontSize: 48, fontWeight: 800, color: DARK }}>
        E muito <span style={{ color: ORANGE }}>mais</span>
      </h2>
    </div>
  );
}
