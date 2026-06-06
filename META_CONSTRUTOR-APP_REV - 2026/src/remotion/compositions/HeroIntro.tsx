import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Img } from 'remotion';

const LOGO_PATH = '/brand/meta-construtor-logo.png';
const BG_COLOR = '#FAFAFA';
const ORANGE = '#F97316';

export const HeroIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo reveal: 0-30 frames
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Headline: 20-60 frames
  const headlineY = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 15, stiffness: 80 } });
  const headlineOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

  // Subtitle: 40-80 frames
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  // CTA: 70-120 frames
  const ctaScale = spring({ frame: Math.max(0, frame - 70), fps, config: { damping: 10, stiffness: 120 } });
  const ctaOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  // Background accent circle
  const circleScale = interpolate(frame, [0, 100], [0.5, 2], { extrapolateRight: 'clamp' });

  // Floor: 20% height
  const floorBottom = interpolate(frame, [0, 40], [-height * 0.2, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      {/* Animated background circle */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ORANGE}15, transparent 70%)`,
          transform: `scale(${circleScale})`,
        }}
      />

      {/* Orange accent bar at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${height * 0.2}px`,
          background: `linear-gradient(to top, ${ORANGE}18, transparent)`,
          transform: `translateY(${floorBottom}px)`,
        }}
      />

      {/* Content centered */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '0 80px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})`, marginBottom: 40 }}>
          <Img src={LOGO_PATH} style={{ height: 60 }} alt="Meta Construtor" />
        </div>

        {/* Headline */}
        <h1
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${(1 - headlineY) * 30}px)`,
            fontSize: 72,
            fontWeight: 800,
            color: '#171717',
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 900,
            letterSpacing: '-0.02em',
          }}
        >
          Gestão de obras{' '}
          <span style={{ color: ORANGE }}>sem complicação</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            opacity: subtitleOpacity,
            fontSize: 24,
            color: '#737373',
            marginBottom: 48,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          RDO digital, checklists, equipes e relatórios — tudo em uma plataforma feita para a construção civil.
        </p>

        {/* CTA Button */}
        <button
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            background: ORANGE,
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '20px 48px',
            fontSize: 22,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${ORANGE}40`,
            letterSpacing: '-0.01em',
          }}
        >
          Comece grátis agora →
        </button>
      </div>
    </AbsoluteFill>
  );
};
