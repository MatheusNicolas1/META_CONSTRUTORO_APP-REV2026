import React, { useState } from 'react';
import { Eye, EyeOff, Mail, User, Phone, Check, X } from 'lucide-react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

import { validatePasswordStrength, isPasswordValid } from '@/utils/passwordValidator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- TYPE DEFINITIONS ---

interface SignUpData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SignUpStepsProps {
  onComplete: (data: SignUpData) => void;
}

// --- HELPER COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-colors focus-within:border-construction-orange/70 focus-within:bg-construction-orange/5">
    {children}
  </div>
);

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`h-2 w-8 rounded-full transition-colors ${i < currentStep ? 'bg-construction-orange' : 'bg-border'
          }`}
      />
    ))}
  </div>
);

// --- VALIDATION FUNCTIONS ---

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  // Validar domínio básico
  const domain = email.split('@')[1];
  return domain && domain.includes('.') && domain.split('.')[1].length >= 2;
};

const validatePhone = (phone: string): boolean => {
  try {
    // Remove formatação e tenta validar com libphonenumber
    const cleanPhone = phone.replace(/\D/g, '');

    // Se tem 11 dígitos, assume Brasil
    if (cleanPhone.length === 11) {
      return isValidPhoneNumber('+55' + cleanPhone, 'BR');
    }

    // Se já tem +, valida diretamente
    if (phone.startsWith('+')) {
      return isValidPhoneNumber(phone);
    }

    return false;
  } catch {
    return false;
  }
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return numbers.replace(/(\d{2})(\d+)/, '($1) $2');
  if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return numbers.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
};

// --- STEP COMPONENTS ---

const NameStep = ({
  name,
  setName,
  onNext,
  isValidating
}: {
  name: string;
  setName: (value: string) => void;
  onNext: () => void;
  isValidating: boolean;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in">
        <label className="text-sm font-medium text-muted-foreground">Nome completo</label>
        <GlassInputWrapper>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full bg-transparent text-sm p-4 pl-10 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
              minLength={2}
            />
          </div>
        </GlassInputWrapper>
      </div>

      <button
        type="submit"
        disabled={name.trim().length < 2 || isValidating}
        className="animate-fade-in w-full rounded-2xl bg-construction-orange py-4 font-medium text-white hover:bg-construction-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isValidating ? 'Validando...' : 'Continuar'}
      </button>
    </form>
  );
};

const EmailPhoneStep = ({
  email,
  setEmail,
  phone,
  setPhone,
  onNext,
  onBack,
  isValidating
}: {
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValidating: boolean;
}) => {
  const isEmailValid = validateEmail(email);
  const isPhoneValid = validatePhone(phone);

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailValid && isPhoneValid) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in">
        <label className="text-sm font-medium text-muted-foreground">Endereço de email</label>
        <GlassInputWrapper>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-transparent text-sm p-4 pl-10 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
            />
            {email.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isEmailValid ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </GlassInputWrapper>
      </div>

      <div className="animate-fade-in">
        <label className="text-sm font-medium text-muted-foreground">Telefone com DDD</label>
        <GlassInputWrapper>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-transparent text-sm p-4 pl-10 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
            />
            {phone.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isPhoneValid ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </GlassInputWrapper>
        {phone.length > 0 && !isPhoneValid && (
          <p className="text-xs text-red-500 mt-1">Informe um telefone válido com DDD</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="animate-fade-in flex-1 rounded-2xl border border-border py-4 font-medium text-foreground hover:bg-muted transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={!isEmailValid || !isPhoneValid || isValidating}
          className="animate-fade-in flex-1 rounded-2xl bg-construction-orange py-4 font-medium text-white hover:bg-construction-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validando...' : 'Continuar'}
        </button>
      </div>
    </form>
  );
};


// DocumentStep removed


const PasswordStep = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onComplete,
  onBack
}: {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onComplete: () => void;
  onBack: () => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = validatePasswordStrength(password);
  const isPasswordStrong = isPasswordValid(password);
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-red-500';
    if (passwordStrength.score === 1) return 'bg-orange-500';
    if (passwordStrength.score === 2) return 'bg-yellow-500';
    if (passwordStrength.score === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordStrong && doPasswordsMatch) {
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-muted-foreground">Senha</label>
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-6 rounded ${i < passwordStrength.score ? getStrengthColor() : 'bg-border'
                      }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <GlassInputWrapper>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
              minLength={10}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showPassword ?
                <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> :
                <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              }
            </button>
          </div>
        </GlassInputWrapper>
      </div>

      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-muted-foreground">Confirmar senha</label>
          {confirmPassword.length > 0 && (
            <div className={`text-xs ${doPasswordsMatch ? 'text-green-500' : 'text-red-500'}`}>
              {doPasswordsMatch ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
            </div>
          )}
        </div>
        <GlassInputWrapper>
          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground placeholder:text-muted-foreground"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showConfirmPassword ?
                <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> :
                <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              }
            </button>
          </div>
        </GlassInputWrapper>
      </div>

      {password.length > 0 && (
        <div className="animate-fade-in bg-card/30 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Requisitos da senha:</p>
          <div className="space-y-1">
            {Object.entries(passwordStrength.checks).map(([key, value]) => {
              const labels = {
                minLength: 'Mínimo 10 caracteres',
                hasUpperCase: 'Pelo menos 1 letra maiúscula',
                hasLowerCase: 'Pelo menos 1 letra minúscula',
                hasNumber: 'Pelo menos 1 número',
                hasSpecialChar: 'Pelo menos 1 caractere especial (!@#$%^&*)',
              };
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  {value ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span className={value ? 'text-green-500' : 'text-muted-foreground'}>
                    {labels[key as keyof typeof labels]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="animate-fade-in">
        <label className="flex items-start gap-3 cursor-pointer text-sm">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 rounded border border-border bg-transparent text-construction-orange focus:ring-2 focus:ring-construction-orange/20"
          />
          <span className="text-foreground/90">
            Concordo com os <a href="/legal/termos" target="_blank" rel="noopener noreferrer" className="text-construction-orange hover:underline">Termos de Uso</a> e <a href="/legal/privacidade" target="_blank" rel="noopener noreferrer" className="text-construction-orange hover:underline">Política de Privacidade</a>
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="animate-fade-in flex-1 rounded-2xl border border-border py-4 font-medium text-foreground hover:bg-muted transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={!isPasswordStrong || !doPasswordsMatch}
          className="animate-fade-in flex-1 rounded-2xl bg-construction-orange py-4 font-medium text-white hover:bg-construction-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar conta
        </button>
      </div>
    </form>
  );
};

// --- MAIN COMPONENT ---

export const SignUpSteps: React.FC<SignUpStepsProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [formData, setFormData] = useState<SignUpData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleNameNext = async () => {
    setIsValidating(true);
    // Simulate name validation
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsValidating(false);
    setCurrentStep(2);
  };

  const handleEmailNext = async () => {
    setIsValidating(true);
    try {
      // V1: Verificação de duplicidade removida daqui.
      // O anon role não tem mais acesso à RPC check_user_duplicates.
      // O Supabase Auth trata duplicidade de email nativamente.
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(3);
    } catch (_error) {
      toast.error('Erro ao validar dados. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  // handleDocumentNext removed

  const handleComplete = () => {
    onComplete(formData);
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={3} />

      {currentStep === 1 && (
        <NameStep
          name={formData.name}
          setName={(name) => setFormData(prev => ({ ...prev, name }))}
          onNext={handleNameNext}
          isValidating={isValidating}
        />
      )}

      {currentStep === 2 && (
        <EmailPhoneStep
          email={formData.email}
          setEmail={(email) => setFormData(prev => ({ ...prev, email }))}
          phone={formData.phone}
          setPhone={(phone) => setFormData(prev => ({ ...prev, phone }))}
          onNext={handleEmailNext}
          onBack={() => setCurrentStep(1)}
          isValidating={isValidating}
        />
      )}

      {currentStep === 3 && (
        <PasswordStep
          password={formData.password}
          setPassword={(password) => setFormData(prev => ({ ...prev, password }))}
          confirmPassword={formData.confirmPassword}
          setConfirmPassword={(confirmPassword) => setFormData(prev => ({ ...prev, confirmPassword }))}
          onComplete={handleComplete}
          onBack={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
};