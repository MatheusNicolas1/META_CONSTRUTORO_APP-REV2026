import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AutoScrollTestimonials, type Testimonial as AutoScrollTestimonial } from './auto-scroll-testimonials';
import { SignUpSteps } from './sign-up-steps';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignUp?: (data: SignUpFormData) => void;
  onGoogleSignIn?: () => void;
  onSignIn?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-colors focus-within:border-construction-orange/70 focus-within:bg-construction-orange/5">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-fade-in ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-construction-blue/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-foreground">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Criar conta</span>,
  description = "Cadastre-se no Meta Construtor e gerencie suas obras",
  heroImageSrc,
  testimonials = [],
  onSignUp,
  onGoogleSignIn,
  onSignIn,
}) => {

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-background">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-fade-in text-4xl md:text-5xl font-semibold leading-tight text-foreground">{title}</h1>
            <p className="animate-fade-in text-muted-foreground">{description}</p>

            <SignUpSteps onComplete={onSignUp} />

            <div className="animate-fade-in relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Ou continue com</span>
            </div>

            <button
              onClick={onGoogleSignIn}
              className="animate-fade-in w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-muted transition-colors text-foreground"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <p className="animate-fade-in text-center text-sm text-muted-foreground">
              Já tem uma conta? <Link to="/login" onClick={onSignIn} className="text-construction-orange hover:underline transition-colors">Fazer login</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-in-right absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute inset-4 rounded-3xl overflow-hidden">
              <AutoScrollTestimonials testimonials={testimonials} duration={100} className="w-full h-full" />
            </div>
          )}
        </section>
      )}
    </div>
  );
};