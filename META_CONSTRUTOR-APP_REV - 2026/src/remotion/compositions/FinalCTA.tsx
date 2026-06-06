import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';

const BG = '#0F172A';
const ORANGE = '#F97316';

export const FinalCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  const subOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });

  const btnScale = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 10, stiffness: 120 } });
  const btnOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  // Background pulse
  const glowOpacity = interpolate(frame, [0, 30, 60, 90], [0.3, 0.6, 0.3, 0.6]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 80px',
      }}
    >
      {/* Glow behind CTA */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ORANGE}30, transparent 70%)`,
          opacity: glowOpacity,
          filter: 'blur(40px)',
        }}
      />

      <h2
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${(1 - headlineY) * 30}px)`,
          fontSize: 64,
          fontWeight: 800,
          color: '#F8FAFC',
          lineHeight: 1.15,
          marginBottom: 20,
          maxWidth: 900,
          letterSpacing: '-0.02em',
        }}
      >
        Pronto para organizar{' '}
        <span style={{ color: ORANGE }}>suas obras?</span>
      </h2>

      <p
        style={{
          opacity: subOpacity,
          fontSize: 24,
          color: '#94A3B8',
          marginBottom: 48,
          maxWidth: 600,
          lineHeight: 1.5,
        }}
      >
        metaconstrutor.app.br — Comece de graça agora
      </p>

      <button
        style={{
          opacity: btnOpacity,
          transform: `scale(${btnScale})`,
          background: ORANGE,
          color: 'white',
          border: 'none',
          borderRadius: 999,
          padding: '22px 56px',
          fontSize: 24,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: `0 12px 40px ${ORANGE}50`,
          letterSpacing: '-0.01em',
        }}
      >
        Criar conta grátis →
      </button>
    </AbsoluteFill>
  );
};
