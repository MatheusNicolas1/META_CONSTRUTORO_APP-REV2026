'use client';

import { X, Share2, Plus, Check, Smartphone, Copy, Monitor, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface InstallInstructionsProps {
  open: boolean;
  onClose: () => void;
  mode: 'ios' | 'desktop' | 'generic';
  appUrl: string;
}

export function InstallInstructions({ open, onClose, mode, appUrl }: InstallInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative overflow-hidden"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* iOS Instructions */}
            {mode === 'ios' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Instalar no iPhone/iPad
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Siga os passos abaixo para adicionar o Meta Construtor à tela inicial
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                    <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-bold shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        Toque em <span className="inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 inline" /> Compartilhar</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        No Safari, toque no ícone de compartilhar na barra inferior
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                    <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        Role até <span className="inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Deslize as opções e encontre "Adicionar à Tela de Início"
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50">
                    <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        Toque em "Adicionar" no canto superior
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Pronto! O app aparecerá na tela inicial como um app nativo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {mode === 'desktop' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Acesse pelo Celular
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Abra este link no navegador do seu celular para instalar o app
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50">
                  <div className="flex items-center gap-2 bg-white rounded-lg border p-3 mb-3">
                    <code className="flex-1 text-sm text-neutral-700 truncate">{appUrl}</code>
                    <button
                      onClick={copyLink}
                      className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-brand-emerald" />
                      ) : (
                        <Copy className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                  </div>
                  <ol className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">1.</span>
                      Copie o link acima
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">2.</span>
                      Abra o Safari ou Chrome no seu celular
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">3.</span>
                      Cole o link na barra de endereço e acesse
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">4.</span>
                      Toque em Compartilhar e "Adicionar à Tela de Início"
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Generic Instructions */}
            {mode === 'generic' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Instalar App
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Abra o site no seu navegador e adicione à tela inicial
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50">
                  <div className="flex items-center gap-2 bg-white rounded-lg border p-3 mb-3">
                    <code className="flex-1 text-sm text-neutral-700 truncate">{appUrl}</code>
                    <button
                      onClick={copyLink}
                      className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-brand-emerald" />
                      ) : (
                        <Copy className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                  </div>
                  <ol className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">1.</span>
                      Copie o link acima
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">2.</span>
                      Abra no navegador do seu dispositivo
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange font-bold">3.</span>
                      No menu, selecione "Adicionar à Tela de Início"
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Bottom action */}
            <div className="mt-6">
              <Button
                onClick={onClose}
                className="w-full rounded-full bg-brand-orange hover:bg-brand-orange-hover text-white"
              >
                Entendi
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
