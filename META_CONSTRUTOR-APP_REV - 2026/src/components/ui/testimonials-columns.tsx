"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

interface TestimonialData {
  text: string;
  image: string;
  name: string;
  role: string;
}


const TestimonialImage = ({ src, name }: { src: string; name: string }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <img
      width={32}
      height={32}
      src={imageError ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` : src}
      alt={`Foto de perfil de ${name}`}
      className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg object-cover flex-shrink-0 border border-border/30"
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialData[];
  duration?: number;
}) => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className={props.className}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        animate={{
          translateY: isPaused ? undefined : "-50%",
        }}
        transition={{
          duration: props.duration || 5, // Acelerado de 10 para 5 segundos
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
        style={{
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 sm:gap-3 rounded-xl bg-card/60 dark:bg-construction-blue/60 backdrop-blur-xl border border-white/20 p-2 sm:p-3 w-full shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow"
                >
                  <TestimonialImage src={image} name={name} />
                  <div className="text-xs sm:text-sm leading-tight min-w-0 flex-1">
                    <div className="font-medium tracking-tight leading-4 text-foreground truncate text-[10px] sm:text-xs">{name}</div>
                    <div className="leading-4 opacity-60 tracking-tight text-muted-foreground text-[8px] sm:text-[10px] truncate">{role}</div>
                    <div className="mt-1 text-foreground/80 line-clamp-3 text-[9px] sm:text-[11px] leading-relaxed">{text}</div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};