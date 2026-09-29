import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

/**
 * Vídeo demonstrativo a partir de prints REAIS do Meta Construtor (public/marketing).
 * Movimento só de câmera (zoom lento na área de interesse) e transições por opacidade:
 * a interface nunca é redesenhada, então o texto da tela continua legível e fiel.
 */

export interface ClipScene {
  image: string; // caminho relativo ao public dir, ex.: 'marketing/prd-prints-...webp'
  caption: string;
  focus: [number, number]; // ponto de zoom (0–1) no print
}

// `type` (e não `interface`): o Remotion exige props compatíveis com Record<string, unknown>.
export type ProductClipProps = {
  scenes: ClipScene[];
  sceneFrames: number;
  intro?: { title: string; subtitle: string };
  outro?: { title: string; subtitle: string };
};

export const CLIP_FADE = 12;
export const INTRO_FRAMES = 45;
export const OUTRO_FRAMES = 60;

const ORANGE = '#F97316';
const ORANGE_TEXT = '#C2410C';
const INK = '#171717';
const MUTED = '#525252';
const FONT = 'Inter, "Plus Jakarta Sans", system-ui, sans-serif';

export const clipDuration = ({ scenes, sceneFrames, intro, outro }: ProductClipProps) =>
  (intro ? INTRO_FRAMES : 0) + scenes.length * sceneFrames - (scenes.length - 1) * CLIP_FADE + (outro ? OUTRO_FRAMES : 0);

function useInterFont() {
  const [handle] = useState(() => delayRender('Carregando Inter'));
  useEffect(() => {
    Promise.all(
      [400, 600, 800].map((weight) =>
        new FontFace('Inter', `url(${staticFile(`fonts/inter-latin-${weight}-normal.woff2`)}) format('woff2')`, {
          weight: String(weight),
        })
          .load()
          .then((face) => document.fonts.add(face))
      )
    )
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [handle]);
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: 0, display: 'flex', gap: size * 0.28 }}>
      <span style={{ color: INK }}>META</span>
      <span style={{ color: ORANGE_TEXT }}>CONSTRUTOR</span>
    </div>
  );
}

function TitleCard({ title, subtitle, duration }: { title: string; subtitle: string; duration: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, duration - 10, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 18], [12, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity }}>
      <div style={{ transform: `translateY(${y}px)`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <Wordmark size={54} />
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: INK }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 26, color: MUTED }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
}

function Scene({ scene, index, total, duration }: { scene: ClipScene; index: number; total: number; duration: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, CLIP_FADE, duration - CLIP_FADE, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, duration], [1.02, 1.14], { extrapolateRight: 'clamp' });
  const captionY = interpolate(frame, [4, 20], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const [fx, fy] = scene.focus;

  return (
    <AbsoluteFill style={{ backgroundColor: '#F5F5F5', opacity }}>
      {/* Moldura de navegador */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 24,
          width: 1200,
          height: 672,
          borderRadius: 18,
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          boxShadow: '0 24px 60px -30px rgba(23,23,23,0.35)',
        }}
      >
        <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
          {['#F87171', '#FBBF24', '#34D399'].map((color) => (
            <span key={color} style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: FONT, fontSize: 13, color: '#737373' }}>Dados de demonstração</span>
        </div>
        <div style={{ position: 'relative', width: 1200, height: 642, overflow: 'hidden' }}>
          <Img
            src={staticFile(scene.image)}
            style={{
              width: 1200,
              height: 750,
              objectFit: 'cover',
              objectPosition: 'top',
              transformOrigin: `${fx * 100}% ${fy * 100}%`,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      </div>

      {/* Legenda (terço inferior) */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 56,
          maxWidth: 1040,
          whiteSpace: 'nowrap',
          padding: '18px 24px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 12px 30px -12px rgba(23,23,23,0.35)',
          transform: `translateY(${captionY}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: ORANGE_TEXT }}>
          {String(index + 1).padStart(2, '0')}
          <span style={{ color: '#A3A3A3', fontWeight: 600 }}>/{String(total).padStart(2, '0')}</span>
        </span>
        <span style={{ width: 1, alignSelf: 'stretch', background: '#E5E5E5' }} />
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: INK, lineHeight: 1.25 }}>{scene.caption}</span>
      </div>
    </AbsoluteFill>
  );
}

export const ProductClip = ({ scenes, sceneFrames, intro, outro }: ProductClipProps) => {
  useInterFont();
  const start = intro ? INTRO_FRAMES : 0;
  const scenesEnd = start + scenes.length * sceneFrames - (scenes.length - 1) * CLIP_FADE;

  return (
    <AbsoluteFill style={{ backgroundColor: '#F5F5F5' }}>
      {intro && (
        <Sequence from={0} durationInFrames={INTRO_FRAMES}>
          <TitleCard title={intro.title} subtitle={intro.subtitle} duration={INTRO_FRAMES} />
        </Sequence>
      )}
      {scenes.map((scene, index) => (
        <Sequence key={scene.image + index} from={start + index * (sceneFrames - CLIP_FADE)} durationInFrames={sceneFrames}>
          <Scene scene={scene} index={index} total={scenes.length} duration={sceneFrames} />
        </Sequence>
      ))}
      {outro && (
        <Sequence from={scenesEnd} durationInFrames={OUTRO_FRAMES}>
          <TitleCard title={outro.title} subtitle={outro.subtitle} duration={OUTRO_FRAMES} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
