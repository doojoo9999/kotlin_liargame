import {Link, useLocation} from 'react-router-dom'
import {Button} from '@/components/ui/button'
import {ThemeToggle} from '@/components/common/ThemeToggle'
import {useGameStore} from '@/store/gameStore'
import {Home, LogOut, User} from 'lucide-react'

export function Header() {
  const location = useLocation()
  const { currentPlayer, sessionCode, resetGame } = useGameStore()
  
  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    resetGame()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/main" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">LG</span>
              </div>
              <span className="font-bold text-lg">Liar Game</span>
            </Link>
            
            {/* Breadcrumb Navigation */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              {location.pathname !== '/main' && (
                <>
                  <Link to="/main" className="hover:text-foreground transition-colors">
                    <Home className="h-4 w-4" />
                  </Link>
                  <span>/</span>
                </>
              )}
              {sessionCode && (
                <span className="font-medium">Room: {sessionCode}</span>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {currentPlayer && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{currentPlayer.nickname}</span>
              </div>
            )}
            
            <ThemeToggle />
            
            {currentPlayer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}