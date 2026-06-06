import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Img, Sequence } from 'remotion';

const BG = '#0F172A';
const ORANGE = '#F97316';

export const SocialProof = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      {/* Stats reveal */}
      {[
        { value: '1.500+', label: 'Obras gerenciadas', delay: 0 },
        { value: '300+', label: 'Construtoras ativas', delay: 15 },
        { value: '50k+', label: 'RDOs registrados', delay: 30 },
        { value: '98%', label: 'Satisfação', delay: 45 },
      ].map((stat, i) => (
        <Sequence key={i} from={20 + stat.delay} durationInFrames={80}>
          <StatReveal stat={stat} frame={0} fps={fps} index={i} />
        </Sequence>
      ))}

      {/* Title at start */}
      <Sequence from={0} durationInFrames={40}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <h2 style={{ fontSize: 48, fontWeight: 800, color: '#F8FAFC', textAlign: 'center' }}>
            Confiado por centenas de{' '}
            <span style={{ color: ORANGE }}>construtoras</span>
          </h2>
        </div>
      </Sequence>

      {/* Outro */}
      <Sequence from={250} durationInFrames={50}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: interpolate(frame - 250, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <p style={{ fontSize: 28, color: '#94A3B8' }}>
            Faça parte você também →{' '}
            <span style={{ color: ORANGE, fontWeight: 700 }}>metaconstrutor.app.br</span>
          </p>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

function StatReveal({
  stat,
  frame,
  fps,
  index,
}: {
  stat: { value: string; label: string };
  frame: number;
  fps: number;
  index: number;
}) {
  const opacity = interpolate(frame, [0, 10, 60, 80], [0, 1, 0.8, 0]);
  const scale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12, stiffness: 80 } });
  const y = interpolate(frame, [0, 15], [60, 0], { extrapolateRight: 'clamp' });

  // Position in a grid
  const col = index % 2;
  const row = Math.floor(index / 2);
  const left = 30 + col * 45; // % from left
  const top = 25 + row * 30; // % from top

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(-50%, -50%) scale(${scale}) translateY(${y}px)`,
        opacity,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 800, color: ORANGE, lineHeight: 1, marginBottom: 8 }}>
        {stat.value}
      </div>
      <div style={{ fontSize: 20, color: '#94A3B8', fontWeight: 500 }}>{stat.label}</div>
    </div>
  );
}
