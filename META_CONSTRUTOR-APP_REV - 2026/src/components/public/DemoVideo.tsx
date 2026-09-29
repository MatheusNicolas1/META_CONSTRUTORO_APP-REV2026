import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoVideoProps {
  src: string;
  poster: string;
  label: string;
  className?: string;
}

/**
 * Vídeo demonstrativo (telas reais do produto, renderizado com Remotion).
 * Carrega só quando entra na tela, toca sem som em loop e pausa ao sair; com
 * prefers-reduced-motion não toca sozinho. O botão permite pausar (WCAG 2.2.2).
 */
export default function DemoVideo({ src, poster, label, className }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion || userPaused) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion, userPaused]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <figure className={cn('relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        width={1280}
        height={720}
        aria-label={label}
        className="block aspect-video h-auto w-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}
        className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 text-white transition-colors hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      </button>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
