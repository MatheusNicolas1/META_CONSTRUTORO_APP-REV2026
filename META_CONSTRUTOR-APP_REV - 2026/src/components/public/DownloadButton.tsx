'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Monitor } from 'lucide-react';
import { useInstallPrompt } from './useInstallPrompt';
import { InstallInstructions } from './InstallInstructions';

interface DownloadButtonProps {
  className?: string;
}

export function DownloadButton({ className = '' }: DownloadButtonProps) {
  const {
    isInstalled,
    canInstall,
    browserSupported,
    deviceType,
    platform,
    install,
    showInstructions,
    setShowInstructions,
    buttonText,
    buttonIcon: Icon,
    appUrl,
  } = useInstallPrompt();

  const [showEffect, setShowEffect] = useState(true);

  // Desativa o efeito pulse após 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowEffect(false), 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Se já instalou, não mostra nada
  if (isInstalled) return null;

  // Se o navegador NÃO suporta PWA (Safari/Firefox desktop), mostra link direto
  if (!browserSupported) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <Button
          className="
            relative
            text-sm sm:text-base
            px-6 sm:px-8 py-5 sm:py-6
            rounded-full
            border-2 border-neutral-300
            bg-white text-neutral-600
            hover:border-brand-orange hover:text-brand-orange
            hover:shadow-lg hover:shadow-brand-orange/20
            transition-all duration-300
            w-full sm:w-auto
          "
          onClick={() => {
            navigator.clipboard.writeText(appUrl);
            setShowInstructions(true);
          }}
        >
          <Monitor className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Acesse pelo celular
        </Button>

        <InstallInstructions
          open={showInstructions}
          onClose={() => setShowInstructions(false)}
          mode="desktop"
          appUrl={appUrl}
        />
      </motion.div>
    );
  }

  const handleClick = async () => {
    if (canInstall) {
      // Dispositivo com beforeinstallprompt (Chrome/Edge Android) — prompt nativo
      await install();
    } else {
      // Fallback: abre instruções manuais
      setShowInstructions(true);
    }
  };

  // Determina o modo do modal de instruções
  // iOS -> só instruções de Compartilhar + Adicionar
  // Desktop -> instruções de instalação via navegador (sem QR code / link mobile)
  // Outros -> genérico minimalista
  const instructionsMode: 'ios' | 'desktop' | 'generic' =
    platform === 'ios' ? 'ios'
    : deviceType === 'desktop' ? 'desktop'
    : 'generic';

  return (
    <>
      <motion.div
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <motion.div
          animate={
            showEffect
              ? {
                  scale: [1, 1.03, 1],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative"
        >
          {/* Glow effect */}
          {showEffect && (
            <motion.div
              className="absolute -inset-1 rounded-full bg-brand-orange/20 blur-md"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <Button
            className={`
              relative
              text-sm sm:text-base
              px-6 sm:px-8 py-5 sm:py-6
              rounded-full
              border-2 border-brand-orange
              bg-white text-brand-orange
              hover:bg-brand-orange hover:text-white
              hover:shadow-lg hover:shadow-brand-orange/30
              transition-all duration-300
              w-full sm:w-auto
              ${showEffect ? 'shadow-md shadow-brand-orange/20' : ''}
            `}
            onClick={handleClick}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {buttonText}
          </Button>
        </motion.div>
      </motion.div>

      <InstallInstructions
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        mode={instructionsMode}
        appUrl={appUrl}
      />
    </>
  );
}
