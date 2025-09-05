import * as React from "react"
import {motion} from "framer-motion"
import {LogOut, MessageSquare, Settings, Users} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Button} from "@/versions/main/components/ui/button"
import {Badge} from "@/versions/main/components/ui/badge"
import {Sheet, SheetContent, SheetTrigger} from "@/versions/main/components/ui/sheet"
import {useGame} from "@/versions/main/providers/GameProvider"
import {useTheme} from "@/versions/main/providers/ThemeProvider"

interface LobbyLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function LobbyLayout({ children, sidebar, className }: LobbyLayoutProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">라이어 게임</h1>
            <Badge variant="outline">로비</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </Button>

            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>

          {sidebar && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="sticky top-20"
              >
                {sidebar}
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

interface GameScreenLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  chat?: React.ReactNode
  phase?: string
  timeRemaining?: number
  onLeave?: () => void
  className?: string
}

export function GameScreenLayout({
  children,
  sidebar,
  chat,
  phase,
  timeRemaining,
  onLeave,
  className
}: GameScreenLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [chatOpen, setChatOpen] = React.useState(false)
  const { state } = useGame()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn("min-h-screen bg-game-container", className)}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold">라이어 게임</h1>
              {state.gameNumber && (
                <Badge variant="outline">게임 #{state.gameNumber}</Badge>
              )}
            </div>

            {phase && (
              <motion.div
                key={phase}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="phase-indicator bg-primary text-primary-foreground"
              >
                {phase}
              </motion.div>
            )}

            {timeRemaining !== undefined && (
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {sidebar && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Users className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  {sidebar}
                </SheetContent>
              </Sheet>
            )}

            {chat && (
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  {chat}
                </SheetContent>
              </Sheet>
            )}

            {onLeave && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onLeave}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
            {sidebar && (
              <div className="hidden lg:block lg:col-span-3">
                <div className="sticky top-20 h-fit">
                  {sidebar}
                </div>
              </div>
            )}

            <div className={cn(
              sidebar && chat ? "lg:col-span-6" :
              sidebar || chat ? "lg:col-span-9" :
              "lg:col-span-12"
            )}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </div>

            {chat && (
              <div className="hidden lg:block lg:col-span-3">
                <div className="sticky top-20 h-[calc(100vh-8rem)]">
                  {chat}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function ResponsiveContainer({
  children,
  size = 'lg',
  className
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'mx-auto px-4',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}
