import { useRef, useState, useEffect, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────

export interface CarouselItem {
  src: string;
  title: string;
  desc: string;
  /** Para imagens verticais com mockup de celular */
  isMobile?: boolean;
}

interface TripleCarouselRowProps {
  items: CarouselItem[];
  direction: 'left' | 'right';
  speed?: number; // segundos para uma volta completa (default: 30)
  isMobile?: boolean;
}

// ─── CSS Keyframes (injetado uma vez) ─────────────────────

const KEYFRAMES_ID = 'triple-carousel-keyframes';

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes scroll-right {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes scroll-left {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
    .triple-scroll-right {
      animation: scroll-right var(--scroll-speed) linear infinite;
    }
    .triple-scroll-left {
      animation: scroll-left var(--scroll-speed) linear infinite;
    }
    .triple-scroll-paused {
      animation-play-state: paused !important;
    }
  `;
  document.head.appendChild(style);
}

// ─── Imagem com Mockup de Celular ─────────────────────────

function MobileMockupImage({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px]">
      {/* Corpo do celular */}
      <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
        {/* Moldura do celular */}
        <div className="relative rounded-[1.75rem] sm:rounded-[2rem] border-[3px] sm:border-[4px] border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden"
             style={{ aspectRatio: '9/19' }}>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 sm:h-6 bg-neutral-900 rounded-b-xl z-10 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700" />
          </div>
          {/* Tela */}
          <div className="absolute inset-[3px] sm:inset-[4px] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden bg-white">
            <img
              src={src}
              alt={title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          </div>
        </div>
        {/* Label */}
        <p className="text-center text-[10px] sm:text-xs text-neutral-400 mt-2 truncate px-1 font-medium">
          {title}
        </p>
      </div>
    </div>
  );
}

// ─── Card de Imagem Desktop ───────────────────────────────

function DesktopImageCard({ item }: { item: CarouselItem }) {
  return (
    <div className="relative flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px]">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent p-3">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
            {item.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-neutral-600 mt-0.5 line-clamp-1 leading-tight">
            {item.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Uma faixa do carrossel ───────────────────────────────

function TripleCarouselRow({ items, direction, speed = 30, isMobile }: TripleCarouselRowProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Duplica os items para efeito de rolagem infinita (50% = clone)
  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-max ${
          direction === 'right' ? 'triple-scroll-right' : 'triple-scroll-left'
        } ${isPaused ? 'triple-scroll-paused' : ''}`}
        style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((item, idx) => (
          <div key={idx} className="flex-shrink-0">
            {isMobile || item.isMobile ? (
              <MobileMockupImage src={item.src} title={item.title} />
            ) : (
              <DesktopImageCard item={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────

interface TripleCarouselProps {
  /** Items da primeira faixa (→ direita) */
  row1: CarouselItem[];
  /** Items da segunda faixa (← esquerda) */
  row2: CarouselItem[];
  /** Items da terceira faixa (→ direita) */
  row3: CarouselItem[];
  /** Velocidade base em segundos (default: 30) */
  speed?: number;
  /** Se true, usa mockups de celular */
  isMobileStyle?: boolean;
  /** Classe adicional */
  className?: string;
}

export function TripleCarousel({
  row1,
  row2,
  row3,
  speed = 30,
  isMobileStyle = false,
  className = '',
}: TripleCarouselProps) {
  const injected = useRef(false);
  if (!injected.current) {
    injectKeyframes();
    injected.current = true;
  }

  return (
    <div className={`space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 ${className}`}>
      {/* Faixa 1 → direita */}
      <TripleCarouselRow
        items={row1}
        direction="right"
        speed={speed}
        isMobile={isMobileStyle}
      />
      {/* Faixa 2 ← esquerda */}
      <TripleCarouselRow
        items={row2}
        direction="left"
        speed={speed * 1.15}
        isMobile={isMobileStyle}
      />
      {/* Faixa 3 → direita */}
      <TripleCarouselRow
        items={row3}
        direction="right"
        speed={speed * 0.9}
        isMobile={isMobileStyle}
      />
    </div>
  );
}
