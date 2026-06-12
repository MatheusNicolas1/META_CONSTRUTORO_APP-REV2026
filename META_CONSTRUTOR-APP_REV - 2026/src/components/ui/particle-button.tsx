"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"
import { MousePointerClick } from "lucide-react"

interface ParticleButtonProps extends ButtonProps {
  onSuccess?: () => void
  successDuration?: number
}

function SuccessParticles({
  buttonRef,
}: {
  buttonRef: React.RefObject<HTMLButtonElement>
}) {
  const rect = buttonRef.current?.getBoundingClientRect()
  if (!rect) return null

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  // Cores do branding: laranja, verde esmeralda, azul escuro
  const colors = [
    "#F97316", // brand-orange
    "#059669", // brand-emerald
    "#0a1e2e", // construction-blue
    "#EA580C", // brand-orange-hover
    "#34D399", // emerald light
    "#F59E0B", // amber accent
  ]

  return (
    <AnimatePresence>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-1.5 h-1.5 rounded-full"
          style={{
            left: centerX,
            top: centerY,
            backgroundColor: colors[i % colors.length],
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1.2, 0],
            x: [
              0,
              (i % 2 ? 1 : -1) * (Math.random() * 60 + 30),
            ],
            y: [0, -Math.random() * 60 - 30],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.08,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Partículas secundárias que vão para os lados */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`side-${i}`}
          className="fixed w-1 h-1 rounded-full"
          style={{
            left: centerX,
            top: centerY,
            backgroundColor: colors[(i + 2) % colors.length],
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [
              0,
              (i % 2 ? 1 : -1) * (Math.random() * 40 + 15),
            ],
            y: [0, Math.random() * 30 - 15],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.1 + 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>
  )
}

const ParticleButton = React.forwardRef<HTMLButtonElement, ParticleButtonProps>(
  (
    {
      children,
      onClick,
      onSuccess,
      successDuration = 1000,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const [showParticles, setShowParticles] = useState(false)
    const internalRef = useRef<HTMLButtonElement>(null)

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      setShowParticles(true)
      onSuccess?.()
      setTimeout(() => {
        setShowParticles(false)
      }, successDuration)
      onClick?.(e)
    }

    return (
      <>
        {showParticles && <SuccessParticles buttonRef={internalRef} />}
        <Button
          ref={(node) => {
            internalRef.current = node
            if (typeof forwardedRef === "function") forwardedRef(node)
            else if (forwardedRef)
              (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }}
          onClick={handleClick}
          className={cn(
            "relative overflow-visible",
            showParticles && "scale-95",
            "transition-transform duration-100",
            className
          )}
          {...props}
        >
          {children}
          <MousePointerClick className="h-4 w-4" />
        </Button>
      </>
    )
  }
)
ParticleButton.displayName = "ParticleButton"

export { ParticleButton }
