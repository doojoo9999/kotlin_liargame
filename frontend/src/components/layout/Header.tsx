import {Link, useLocation, useNavigate} from 'react-router-dom'
import {Button} from '@/components/ui/button'
import {ThemeToggle} from '@/components/common/ThemeToggle'
import {useAuthStore} from '@/stores/authStore'
import {Home, LogOut, User} from 'lucide-react'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { nickname, logout } = useAuthStore()
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/lobby" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">LG</span>
              </div>
              <span className="font-bold text-lg">Liar Game</span>
            </Link>
            
            {/* Breadcrumb Navigation */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              {location.pathname !== '/lobby' && location.pathname !== '/' && (
                <>
                  <Link to="/lobby" className="hover:text-foreground transition-colors">
                    <Home className="h-4 w-4" />
                  </Link>
                  <span>/</span>
                </>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {nickname && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{nickname}</span>
              </div>
            )}
            
            <ThemeToggle />
            
            {nickname && (
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