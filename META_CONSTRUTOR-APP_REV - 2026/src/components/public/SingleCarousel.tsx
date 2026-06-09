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
  return (
    <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] contain-layout">
      <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
        <div className="relative rounded-[1.75rem] sm:rounded-[2rem] border-[3px] sm:border-[4px] border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden"
             style={{ aspectRatio: '9/19' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 sm:h-6 bg-neutral-900 rounded-b-xl z-10 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700" />
          </div>
          <div className="absolute inset-[3px] sm:inset-[4px] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden bg-white">
            <img
              src={src}
              alt={title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-brand-blue dark:text-blue-300 mt-2 truncate px-1 font-semibold">
          {title}
        </p>
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
            {isMobile || item.isMobile ? (
              <MobileMockupImage src={item.src} title={item.title} />
            ) : (
              <div className="flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] contain-layout">
                <div className="relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent p-3">
                    <h3 className="text-xs sm:text-sm font-bold text-brand-blue truncate">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
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
