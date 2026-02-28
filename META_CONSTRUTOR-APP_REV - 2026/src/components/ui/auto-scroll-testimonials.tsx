import React from 'react';
import { motion } from 'framer-motion';
import { TestimonialsColumn } from './testimonials-columns';

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface AutoScrollTestimonialsProps {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}

// Convert testimonials to the format expected by TestimonialsColumn
const convertTestimonials = (testimonials: Testimonial[]) => {
  return testimonials.map(testimonial => ({
    text: testimonial.text,
    image: testimonial.avatarSrc,
    name: testimonial.name,
    role: testimonial.handle
  }));
};

export const AutoScrollTestimonials: React.FC<AutoScrollTestimonialsProps> = ({
  testimonials,
  duration = 21, // Velocidade reduzida em 40% (mais lenta = mais tempo para completar o scroll)
  className = "",
}) => {
  const convertedTestimonials = convertTestimonials(testimonials);

  // Split testimonials into 2 columns
  const firstColumn = convertedTestimonials.slice(0, Math.ceil(convertedTestimonials.length / 2));
  const secondColumn = convertedTestimonials.slice(Math.ceil(convertedTestimonials.length / 2));

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Gradient masks for smooth fade in/out */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/30 via-transparent to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 via-transparent to-transparent z-20 pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent z-20 pointer-events-none" />

      <div className="flex justify-center items-start gap-3 sm:gap-4 md:gap-6 h-full w-full p-2 sm:p-4 pt-4 sm:pt-8 pb-4 sm:pb-8 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
        <TestimonialsColumn
          testimonials={firstColumn}
          duration={duration}
          className="flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-sm"
        />
        <TestimonialsColumn
          testimonials={secondColumn}
          className="flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-sm"
          duration={duration + 2}
        />
      </div>
    </div>
  );
};