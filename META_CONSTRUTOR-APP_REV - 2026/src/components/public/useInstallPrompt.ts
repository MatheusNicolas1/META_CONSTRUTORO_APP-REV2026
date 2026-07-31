'use client';

import { useState, useEffect, useCallback } from 'react';
import { Smartphone, Monitor, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Platform = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UseInstallPromptReturn {
  /** Se o PWA já está instalado (display-mode: standalone/m minimal-ui) */
  isInstalled: boolean;
  /** Se o dispositivo suporta beforeinstallprompt (Chrome/Edge/Android) */
  canInstall: boolean;
  /** Se o navegador/plataforma suporta instalação PWA (true para Chromium desktop e todos mobile) */
  browserSupported: boolean;
  /** Tipo de dispositivo detectado */
  deviceType: DeviceType;
  /** Plataforma específica */
  platform: Platform;
  /** Exibe o prompt nativo de instalação (Android/Chrome) */
  install: () => Promise<void>;
  /** Controla exibição do modal de instruções */
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  /** Texto contextual para o botão */
  buttonText: string;
  /** Ícone para o botão */
  buttonIcon: LucideIcon;
  /** URL do app para compartilhar/QR code */
  appUrl: string;
}

// ─── Helpers ────────────────────────────────────────────────────
function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua);
  const isTablet = /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua) && !isMobile;
  // iPadOS 13+ se parece com desktop, mas tem touch
  if (!isMobile && !isTablet && 'ontouchstart' in window && navigator.maxTouchPoints > 1) {
    return 'tablet';
  }
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/windows/.test(ua)) return 'windows';
  if (/mac/.test(ua)) return 'mac';
  if (/linux/.test(ua)) return 'linux';
  return 'other';
}

function getButtonText(deviceType: DeviceType, platform: Platform): string {
  if (platform === 'android') return 'Instalar app Android';
  if (platform === 'ios') return 'Instalar no iPhone';
  if (deviceType === 'tablet') return 'Instalar no Tablet';
  if (deviceType === 'desktop') return 'Baixar para PC';
  return 'Instalar App';
}

function getButtonIcon(platform: Platform, deviceType: DeviceType): LucideIcon {
  if (deviceType === 'desktop' && platform !== 'android' && platform !== 'ios') return Monitor;
  if (platform === 'android' || platform === 'ios') return Smartphone;
  return Download;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

// ─── Hook ───────────────────────────────────────────────────────
function isPwaSupportedBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  // Chrome, Edge, Opera, Samsung, Brave (Chromium) — suportam beforeinstallprompt
  const isChromium = /chrome|crios|edg|opr|samsungbrowser|brave/i.test(ua);
  // Safari desktop NÃO suporta; Firefox NÃO suporta
  const isSafari = /safari/i.test(ua) && !/chrome|crios/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  // Em mobile, mesmo Firefox pode ser instruído
  const isMobile = /mobile|android|iphone|ipod|blackberry/i.test(ua);
  if (isMobile) return true; // Mobile sempre pode instalar manualmente
  if (isSafari || isFirefox) return false; // Desktop sem suporte nativo
  return isChromium; // Chromium-based desktop tem beforeinstallprompt
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const deviceType = detectDevice();
  const platform = detectPlatform();
  const canInstall = deferredPrompt !== null;
  const browserSupported = isPwaSupportedBrowser();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://metaconstrutor.app.br';

  useEffect(() => {
    setIsInstalled(isStandalone());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detecta quando o app foi instalado
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      // Fallback: abre instruções
      setShowInstructions(true);
      return;
    }
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('[InstallPrompt] Erro ao exibir prompt:', err);
      setShowInstructions(true);
    }
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall,
    browserSupported,
    deviceType,
    platform,
    install,
    showInstructions,
    setShowInstructions,
    buttonText: getButtonText(deviceType, platform),
    buttonIcon: getButtonIcon(platform, deviceType),
    appUrl,
  };
}
