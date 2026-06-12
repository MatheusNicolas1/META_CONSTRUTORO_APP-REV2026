'use client'

import React from 'react'
import type { LeadInfo } from '@/hooks/useLeadDetection'
import { Plus } from 'lucide-react'

// --- USER AVATAR ---

interface UserAvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
}

const UserAvatar = ({ initials, size = 'md' }: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-base',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-[#1a2a4a] flex items-center justify-center mx-auto shadow-lg`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  )
}

// --- LOGIN CARD (branco, estilo Canva) ---

interface LoginCardProps {
  initials: string
  name: string
  email: string
  onContinue: () => void
  onOtherAccount: () => void
  onRemoveAccount: () => void
}

const LoginCard = ({ initials, name, email, onContinue, onOtherAccount, onRemoveAccount }: LoginCardProps) => (
  <div className="bg-white rounded-[32px] p-8 shadow-lg text-center w-full max-w-sm">
    <UserAvatar initials={initials} />
    <h2 className="text-xl font-bold text-[#1a1a2e] mt-4">{name}</h2>
    <p className="text-sm text-gray-400 mt-1">{email}</p>
    <button
      onClick={onContinue}
      className="w-full mt-6 py-3.5 rounded-full bg-[#ff7f2e] text-white font-semibold text-base hover:bg-[#e06e1f] transition-colors"
    >
      Continuar
    </button>
  </div>
)

// --- SECONDARY BUTTONS ---

const OtherAccountButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#1a1a2e] text-sm font-medium hover:bg-white/90 transition-colors shadow-sm"
  >
    <Plus className="w-4 h-4" />
    Continuar com outra conta
  </button>
)

const RemoveAccountLink = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-white/70 text-sm hover:text-white transition-colors"
  >
    Remover conta
  </button>
)

// --- MAIN EXPORTED COMPONENT ---

interface AuthHeroSectionProps {
  lead: LeadInfo | null
  email: string
  mode: 'lead' | 'saved' | 'default'
}

export const AuthHeroSection = ({ lead, email, mode }: AuthHeroSectionProps) => {
  const isActive = mode === 'lead' || mode === 'saved'
  const initials = lead?.nome
    ? lead.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email
      ? email.charAt(0).toUpperCase()
      : 'NU'
  const displayName = lead?.nome || 'Nome do usuário'
  const displayEmail = lead?.email || email || 'email.nomedousu@gmail.com'

  // Não mostra se não tiver lead no modo lead
  if (mode === 'lead' && !lead) return null
  if (!isActive) return null

  return (
    <section className="hidden md:block flex-1 relative overflow-hidden" style={{ backgroundColor: '#b06d46' }}>
      {/* Layout split: esquerda (imagem capacete) + direita (conteúdo) */}
      <div className="flex h-full">
        {/* LEFT: Personagem com capacete futurista (Spline 3D ou imagem) */}
        <div className="w-[40%] relative flex items-end justify-center overflow-hidden">
          {/* Avaliação: a imagem estática da pessoa com capacete será usada como fallback ou referência */}
          {/* A cena Spline animada substituirá quando disponível */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=1000&fit=crop')`,
              backgroundPosition: 'center 20%',
              filter: 'brightness(0.9) saturate(1.2)',
            }}
          />
          {/* Gradiente para suavizar a transição com o fundo */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: 'linear-gradient(to right, transparent 50%, #b06d46 100%)',
            }}
          />
        </div>

        {/* RIGHT: Conteúdo (navbar + welcome + cartão login) */}
        <div className="w-[60%] flex flex-col p-8 relative z-10">
          {/* Navbar */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <span className="text-white text-xl font-bold">META</span>
              <span className="text-[#1a2a4a] text-xl font-bold">CONSTRUTOR</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#funcionalidades" className="text-white/80 text-sm hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#planos" className="text-white/80 text-sm hover:text-white transition-colors">
                Planos
              </a>
              <button className="px-5 py-2 rounded-full bg-white text-[#1a1a2e] text-sm font-medium hover:bg-white/90 transition-colors shadow-sm">
                Criar uma conta
              </button>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Que bom que<br />você voltou!
            </h1>
            <p className="text-white/80 text-lg mt-2">Acesse sua conta</p>
          </div>

          {/* Lead mode: card branco + ações */}
          {mode === 'lead' && lead && (
            <div className="space-y-4">
              <LoginCard
                initials={initials}
                name={displayName}
                email={displayEmail}
                onContinue={() => {}}
                onOtherAccount={() => {}}
                onRemoveAccount={() => {}}
              />
              <div className="flex flex-col items-center gap-3">
                <OtherAccountButton onClick={() => {}} />
                <RemoveAccountLink onClick={() => {}} />
              </div>
            </div>
          )}

          {/* Saved mode: similar mas com info de conta salva */}
          {mode === 'saved' && (
            <div className="space-y-4">
              <LoginCard
                initials={initials}
                name={displayName}
                email={displayEmail}
                onContinue={() => {}}
                onOtherAccount={() => {}}
                onRemoveAccount={() => {}}
              />
              <div className="flex flex-col items-center gap-3">
                <OtherAccountButton onClick={() => {}} />
                <RemoveAccountLink onClick={() => {}} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
