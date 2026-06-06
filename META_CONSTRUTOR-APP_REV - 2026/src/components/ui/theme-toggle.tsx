import React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import { useAuth } from "@/components/auth/AuthContext"
import { persistUserThemePreference, resolvePersistedTheme } from "@/utils/themePreference"
import { toast } from "sonner"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme, systemTheme } = useTheme()
  const { user } = useAuth()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = async () => {
    const activeTheme = resolvePersistedTheme(theme, systemTheme)
    const nextTheme = activeTheme === "light" ? "dark" : "light"
    setTheme(nextTheme)

    if (user?.id) {
      try {
        await persistUserThemePreference(user.id, nextTheme)
      } catch (error) {
        console.error("Erro ao salvar tema:", error)
        toast.error("Nao foi possivel salvar o tema. Tente novamente.")
      }
    }
  }

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 px-0"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

