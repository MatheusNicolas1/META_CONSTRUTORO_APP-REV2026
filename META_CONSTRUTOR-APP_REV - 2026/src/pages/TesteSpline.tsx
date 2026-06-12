'use client'

import { SplineScene } from "@/components/ui/splite"
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { motion } from "framer-motion"

export default function TesteSplinePage() {
  return (
    <div className="min-h-screen flex">
      {/* Background gradient - estilo Nubank/laranja */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 z-0" />
      
      {/* Left side - Personagem 3D */}
      <div className="w-[45%] relative z-10 flex items-center justify-center overflow-hidden">
        <Card className="w-[90%] h-[85vh] bg-black/[0.96] relative overflow-hidden rounded-3xl border-0 shadow-2xl">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full relative">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full" 
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right side - Login Form */}
      <div className="w-[55%] relative z-10 flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-12 py-6">
          <div className="text-white text-xl font-bold">
            META <span className="font-black">CONSTRUTOR</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
              Funcionalidades
            </a>
            <a href="#" className="text-white/80 hover:text-white text-sm transition-colors">
              Planos
            </a>
            <button className="bg-white text-orange-600 px-6 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-all">
              Criar uma conta
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Que bom que<br />você voltou!
            </motion.h1>
            <motion.p 
              className="text-white/70 text-lg mt-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Acesse sua conta
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border-0">
              {/* Avatar preview */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">MC</span>
                </div>
                
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                
                <div className="w-full relative">
                  <input
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <button className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 text-sm">
                Continuar
              </button>

              <div className="mt-6 text-center">
                <button className="w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2">
                  <span className="text-lg leading-none">+</span>
                  Continuar com outra conta
                </button>
              </div>

              <div className="mt-4 text-center">
                <button className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
                  Remover conta
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Lead detection indicator */}
          <motion.div 
            id="lead-status"
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-white/50 text-xs">
              Digite seu email para verificar se sua conta está pré-cadastrada
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
