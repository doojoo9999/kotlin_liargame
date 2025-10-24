import {createContext, useEffect, useState} from "react"
import {StelliveThemeProvider} from "@stellive/ui"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<Theme, "system">>("light")
  const [prefersMotionReduced, setPrefersMotionReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersMotionReduced(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)

    return () => {
      mediaQuery.removeEventListener("change", update)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const root = window.document.documentElement
    const applyTheme = (nextTheme: Exclude<Theme, "system">) => {
      root.classList.remove("light", "dark")
      root.classList.add(nextTheme)
      setResolvedTheme(nextTheme)
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      applyTheme(systemTheme)
      return
    }

    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") {
      return
    }

    const root = window.document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (event: MediaQueryListEvent) => {
      const nextTheme: Exclude<Theme, "system"> = event.matches ? "dark" : "light"
      root.classList.remove("light", "dark")
      root.classList.add(nextTheme)
      setResolvedTheme(nextTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <StelliveThemeProvider
        theme={resolvedTheme}
        attachToDocument
        reducedMotion={prefersMotionReduced}
      >
        {children}
      </StelliveThemeProvider>
    </ThemeProviderContext.Provider>
  )
}
