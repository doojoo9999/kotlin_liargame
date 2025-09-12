import {cn} from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps = {}) {
  return (
    <footer className={cn("border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© 2024 Liar Game</span>
            <span>•</span>
            <span>Built with React & TypeScript</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Version 1.0.0</span>
            <span>•</span>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Source Code
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}