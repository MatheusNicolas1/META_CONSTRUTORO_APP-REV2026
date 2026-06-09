import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
  texts: string[];
  className?: string;
  speed?: number;
  delayBetween?: number;
  deleteSpeed?: number;
}

export function TypewriterEffect({
  texts,
  className = '',
  speed = 50,
  delayBetween = 2000,
  deleteSpeed = 30,
}: TypewriterEffectProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Refs para evitar dependências mutáveis no useEffect
  const textsRef = useRef(texts);
  const speedRef = useRef(speed);
  const deleteSpeedRef = useRef(deleteSpeed);
  const delayBetweenRef = useRef(delayBetween);

  // Manter refs atualizadas
  useEffect(() => { textsRef.current = texts; }, [texts]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { deleteSpeedRef.current = deleteSpeed; }, [deleteSpeed]);
  useEffect(() => { delayBetweenRef.current = delayBetween; }, [delayBetween]);

  // Callback estável para processar caracteres
  const tick = useCallback(() => {
    const currentText = textsRef.current[textIndex];

    if (!isDeleting) {
      if (charIndex < currentText.length) {
        setDisplayText(currentText.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      } else {
        // Pausa antes de começar a deletar
        setTimeout(() => setIsDeleting(true), delayBetweenRef.current);
      }
    } else {
      if (charIndex > 0) {
        setDisplayText(currentText.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % textsRef.current.length);
      }
    }
  }, [charIndex, isDeleting, textIndex]);

  useEffect(() => {
    // Só inicia um novo ciclo quando não está em pausa
    if (charIndex === texts[textIndex]?.length && !isDeleting) return;

    const timeout = setTimeout(
      tick,
      isDeleting ? deleteSpeedRef.current : speedRef.current
    );

    return () => clearTimeout(timeout);
  }, [tick, charIndex, isDeleting, textIndex, texts]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-[1em] bg-brand-orange ml-0.5 align-middle"
        aria-hidden="true"
      />
    </motion.span>
  );
}
