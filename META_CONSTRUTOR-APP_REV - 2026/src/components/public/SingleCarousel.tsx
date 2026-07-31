import { useRef, useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────

export interface CarouselItem {
  src: string;
  title: string;
  desc?: string;
  /** Para imagens verticais com mockup de celular */
  isMobile?: boolean;
}

interface SingleCarouselProps {
  items: CarouselItem[];
  speed?: number; // segundos para uma volta completa (default: 35)
  isMobile?: boolean;
  className?: string;
}

// ─── CSS Keyframes (injetado uma vez) ─────────────────────

const KEYFRAMES_ID = 'single-carousel-keyframes';

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
    .single-scroll {
      animation: scroll-right var(--scroll-speed) linear infinite;
      will-change: transform;
    }
    .single-scroll-paused {
      animation-play-state: paused !important;
    }
    .single-track {
      touch-action: pan-y pinch-zoom;
      -webkit-overflow-scrolling: touch;
    }
    @media (max-width: 768px) {
      .single-scroll {
        animation-duration: calc(var(--scroll-speed) * 1.5);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .single-scroll {
        animation: none !important;
        transform: none !important;
      }
    }
    @media (hover: none) and (pointer: coarse) {
      .single-scroll {
        animation-duration: calc(var(--scroll-speed) * 2);
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── Imagem com Mockup de Celular ─────────────────────────

function MobileMockupImage({ src, title }: { src: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Usa src original — Supabase render/image retorna 403 sem imgix configurado
  const optimizedSrc = src;
  return (
    <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] contain-layout">
      <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
        <div className="relative rounded-[1.75rem] sm:rounded-[2rem] border-[3px] sm:border-[4px] border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden"
             style={{ aspectRatio: '9/19' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 sm:h-6 bg-neutral-900 rounded-b-xl z-10 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700" />
          </div>
          <div className="absolute inset-[3px] sm:inset-[4px] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden bg-white">
            {isLoading && (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {imgError ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange/5 to-brand-blue/5 p-4">
                <div className="text-center">
                  <div className="w-8 h-8 text-neutral-300 mx-auto mb-2 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12" y1="18" y2="18"/></svg>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">{title}</p>
                </div>
              </div>
            ) : (
              <img
                src={optimizedSrc}
                alt={title}
                className={`w-full h-full object-cover object-top transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoading(false)}
                onError={() => { setIsLoading(false); setImgError(true); }}
              />
            )}
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-brand-blue dark:text-blue-300 mt-2 truncate px-1 font-semibold">
          {title}
        </p>
      </div>
    </div>
  );
}

// ─── Imagem Desktop/Tablet ────────────────────────────────
function DesktopImage({ src, title }: { src: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const optimizedSrc = src;
  return (
    <div className="flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] contain-layout">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="aspect-[16/10] overflow-hidden">
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50">
              <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange/5 to-brand-blue/5 p-4">
              <div className="text-center">
                <div className="w-8 h-8 text-neutral-300 mx-auto mb-2 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="8" x2="16" y1="20" y2="20"/></svg>
                </div>
                <p className="text-[10px] text-neutral-400 font-medium">{title}</p>
              </div>
            </div>
          ) : (
            <img
              src={optimizedSrc}
              alt={title}
              className={`w-full h-full object-cover object-top transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setImgError(true); }}
            />
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent p-3">
          <h3 className="text-xs sm:text-sm font-bold text-brand-blue truncate">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

// ─── Uma faixa do carrossel ───────────────────────────────

function SingleCarouselRow({ items, speed = 35, isMobile }: { items: CarouselItem[]; speed?: number; isMobile?: boolean }) {
  const [isPaused, setIsPaused] = useState(false);

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className={`flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-max single-scroll ${isPaused ? 'single-scroll-paused' : ''}`}
        style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((item, idx) => (
          <div key={idx} className="flex-shrink-0">
            {/* Desktop/tablet image */}
            {isMobile || item.isMobile ? (
              <MobileMockupImage src={item.src} title={item.title} />
            ) : (
              <DesktopImage src={item.src} title={item.title} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────

export function SingleCarousel({
  items,
  speed = 35,
  isMobile = false,
  className = '',
}: SingleCarouselProps) {
  const injected = useRef(false);
  if (!injected.current) {
    injectKeyframes();
    injected.current = true;
  }

  return (
    <div className={className}>
      <SingleCarouselRow
        items={items}
        speed={speed}
        isMobile={isMobile}
      />
    </div>
  );
}
