import * as React from "react"
import {motion} from "framer-motion"
import {cn} from "@/versions/main/lib/utils"
import {Button} from "@/versions/main/components/ui/button"
import {LogOut, Moon, Settings, Sun} from "lucide-react"
import {GamePhaseTransition} from "@/versions/main/animations"

interface GameLayoutProps {
  children: React.ReactNode
  phase?: string
  showHeader?: boolean
  showSettings?: boolean
  onThemeToggle?: () => void
  onSettings?: () => void
  onLogout?: () => void
  className?: string
}

export function GameLayout({
  children,
  phase,
  showHeader = true,
  showSettings = true,
  onThemeToggle,
  onSettings,
  onLogout,
  className
}: GameLayoutProps) {
  const [isDark, setIsDark] = React.useState(false)

  const handleThemeToggle = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
    onThemeToggle?.()
  }

  return (
    <div className={cn("game-container", className)}>
      {showHeader && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold">라이어 게임</h1>
              {phase && (
                <motion.div
                  key={phase}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="phase-indicator"
                >
                  {phase}
                </motion.div>
              )}
            </div>

            {showSettings && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {onSettings && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSettings}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}

                {onLogout && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.header>
      )}

      <main className="flex-1 container py-6">
        {phase ? (
          <GamePhaseTransition phase={phase}>
            {children}
          </GamePhaseTransition>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </main>
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    `gap-${gap}`,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

interface CenteredContainerProps {
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}

export function CenteredContainer({
  children,
  maxWidth = "lg",
  className
}: CenteredContainerProps) {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-[60vh]",
      className
    )}>
      <div className={cn(
        "w-full space-y-6",
        {
          "max-w-sm": maxWidth === "sm",
          "max-w-md": maxWidth === "md",
          "max-w-lg": maxWidth === "lg",
          "max-w-xl": maxWidth === "xl",
          "max-w-2xl": maxWidth === "2xl"
        }
      )}>
        {children}
      </div>
    </div>
  )
}
