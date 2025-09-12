# Responsive Design Implementation Guide

## 6. Responsive Design Strategy

### Mobile-First Breakpoint System

```typescript
// constants/breakpoints.ts
export const BREAKPOINTS = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablets
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  '2xl': 1536 // Extra large
} as const;

// Tailwind CSS configuration
export const RESPONSIVE_CLASSES = {
  // Layout containers
  gameContainer: 'w-full min-h-screen px-4 sm:px-6 lg:px-8',
  gameLayout: 'grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6',
  
  // Component sizing
  card: 'w-full rounded-lg shadow-sm border',
  button: 'w-full sm:w-auto px-4 py-2 rounded-lg font-medium',
  input: 'w-full px-3 py-2 rounded-md border',
  
  // Typography
  heading: 'text-xl sm:text-2xl lg:text-3xl font-bold',
  body: 'text-sm sm:text-base leading-relaxed',
  caption: 'text-xs sm:text-sm text-gray-600'
};
```

### Responsive Game Layout Component

```typescript
// components/layout/ResponsiveGameLayout.tsx
interface ResponsiveGameLayoutProps {
  moderatorCommentary: React.ReactNode;
  phaseIndicator: React.ReactNode;
  playerPanel: React.ReactNode;
  gameAction: React.ReactNode;
  activityFeed: React.ReactNode;
  chat: React.ReactNode;
}

export const ResponsiveGameLayout: React.FC<ResponsiveGameLayoutProps> = ({
  moderatorCommentary,
  phaseIndicator,
  playerPanel,
  gameAction,
  activityFeed,
  chat
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState<'players' | 'activity' | 'chat'>('players');
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMobile) {
    return (
      <MobileGameLayout
        moderatorCommentary={moderatorCommentary}
        phaseIndicator={phaseIndicator}
        playerPanel={playerPanel}
        gameAction={gameAction}
        activityFeed={activityFeed}
        chat={chat}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />
    );
  }
  
  return (
    <DesktopGameLayout
      moderatorCommentary={moderatorCommentary}
      phaseIndicator={phaseIndicator}
      playerPanel={playerPanel}
      gameAction={gameAction}
      activityFeed={activityFeed}
      chat={chat}
    />
  );
};

// Mobile-specific layout
const MobileGameLayout: React.FC<MobileLayoutProps> = ({
  moderatorCommentary,
  phaseIndicator,
  playerPanel,
  gameAction,
  activityFeed,
  chat,
  activePanel,
  setActivePanel
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        {moderatorCommentary}
        {phaseIndicator}
      </div>
      
      {/* Main content area */}
      <div className="pb-20">
        {gameAction}
      </div>
      
      {/* Bottom navigation tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <MobileTabNavigation
          activePanel={activePanel}
          setActivePanel={setActivePanel}
        />
        
        {/* Sliding panel */}
        <MobileSlidingPanel
          isOpen={true}
          maxHeight="50vh"
        >
          {activePanel === 'players' && playerPanel}
          {activePanel === 'activity' && activityFeed}
          {activePanel === 'chat' && chat}
        </MobileSlidingPanel>
      </div>
    </div>
  );
};

// Desktop layout
const DesktopGameLayout: React.FC<DesktopLayoutProps> = ({
  moderatorCommentary,
  phaseIndicator,
  playerPanel,
  gameAction,
  activityFeed,
  chat
}) => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Top section */}
        <div className="space-y-4">
          {moderatorCommentary}
          {phaseIndicator}
        </div>
        
        {/* Main game grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            {playerPanel}
          </div>
          
          {/* Center content */}
          <div className="lg:col-span-2 xl:col-span-3">
            {gameAction}
          </div>
          
          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {activityFeed}
            {chat}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Mobile-Optimized Components

```typescript
// components/mobile/MobileSlidingPanel.tsx
interface MobileSlidingPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  maxHeight?: string;
  onClose?: () => void;
}

export const MobileSlidingPanel: React.FC<MobileSlidingPanelProps> = ({
  children,
  isOpen,
  maxHeight = '60vh',
  onClose
}) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || !isDragging) return;
    
    setCurrentY(e.touches[0].clientY);
    
    // Prevent scrolling when dragging
    e.preventDefault();
  };
  
  const handleTouchEnd = () => {
    if (!startY || !currentY) return;
    
    const deltaY = currentY - startY;
    
    // If dragged down significantly, close panel
    if (deltaY > 100 && onClose) {
      onClose();
    }
    
    setStartY(null);
    setCurrentY(null);
    setIsDragging(false);
  };
  
  const translateY = isDragging && startY && currentY
    ? Math.max(0, currentY - startY)
    : 0;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={{ 
              transform: `translateY(${translateY}px)`,
              maxHeight 
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center p-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 40px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Mobile tab navigation
export const MobileTabNavigation: React.FC<{
  activePanel: string;
  setActivePanel: (panel: 'players' | 'activity' | 'chat') => void;
}> = ({ activePanel, setActivePanel }) => {
  return (
    <div className="bg-white border-t flex">
      {[
        { key: 'players', label: 'Players', icon: Users },
        { key: 'activity', label: 'Activity', icon: Activity },
        { key: 'chat', label: 'Chat', icon: MessageCircle }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActivePanel(key as any)}
          className={cn(
            'flex-1 py-3 px-4 flex flex-col items-center space-y-1 transition-colors',
            activePanel === key
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};
```

### Touch-Optimized Game Actions

```typescript
// components/game/TouchOptimizedActions.tsx
interface TouchOptimizedActionsProps {
  gamePhase: GamePhase;
  onSubmitHint?: (hint: string) => void;
  onVotePlayer?: (playerId: string) => void;
  onSubmitDefense?: (defense: string) => void;
}

export const TouchOptimizedActions: React.FC<TouchOptimizedActionsProps> = ({
  gamePhase,
  onSubmitHint,
  onVotePlayer,
  onSubmitDefense
}) => {
  const [textInput, setTextInput] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Auto-expand textarea on mobile
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [textInput]);
  
  if (gamePhase === 'SPEECH' || gamePhase === 'DEFENDING') {
    return (
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hint-input" className="text-sm font-medium">
            {gamePhase === 'SPEECH' ? 'Your Hint' : 'Your Defense'}
          </Label>
          <textarea
            ref={textareaRef}
            id="hint-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={gamePhase === 'SPEECH' 
              ? 'Enter your hint here...' 
              : 'Defend yourself...'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            style={{ minHeight: '100px' }}
            maxLength={200}
          />
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{textInput.length}/200 characters</span>
          </div>
        </div>
        
        <Button
          onClick={() => {
            if (gamePhase === 'SPEECH') {
              onSubmitHint?.(textInput);
            } else {
              onSubmitDefense?.(textInput);
            }
            setTextInput('');
          }}
          disabled={!textInput.trim()}
          className="w-full h-12 text-base font-medium"
        >
          {gamePhase === 'SPEECH' ? 'Submit Hint' : 'Submit Defense'}
        </Button>
      </Card>
    );
  }
  
  if (gamePhase === 'VOTING_FOR_LIAR' || gamePhase === 'VOTING_FOR_SURVIVAL') {
    return (
      <Card className="p-4 space-y-4">
        <h3 className="font-medium text-lg">
          {gamePhase === 'VOTING_FOR_LIAR' ? 'Vote for the Liar' : 'Final Vote'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map(player => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all duration-200',
                'flex items-center space-x-3',
                'min-h-[64px]', // Touch-friendly height
                selectedPlayer === player.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 active:border-blue-300'
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback>{player.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium">{player.nickname}</div>
                {player.id === selectedPlayer && (
                  <div className="text-sm text-blue-600">Selected</div>
                )}
              </div>
              {selectedPlayer === player.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
        
        <Button
          onClick={() => onVotePlayer?.(selectedPlayer!)}
          disabled={!selectedPlayer}
          className="w-full h-12 text-base font-medium"
        >
          Cast Vote
        </Button>
      </Card>
    );
  }
  
  return null;
};
```

## 7. Error Handling & Performance

### Comprehensive Error Boundary System

```typescript
// components/error/GameErrorBoundary.tsx
interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class GameErrorBoundary extends Component<
  PropsWithChildren<{}>, 
  GameErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to monitoring service
    this.logError(error, errorInfo);
    
    // Report to analytics
    analytics.track('Game Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });
  }
  
  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      gameState: this.getGameStateSnapshot(),
      errorId: this.state.errorId
    };
    
    // Send to error monitoring service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorDetails)
    }).catch(() => {
      // Fallback: store locally
      localStorage.setItem(`error-${this.state.errorId}`, JSON.stringify(errorDetails));
    });
  }
  
  private getGameStateSnapshot() {
    try {
      const gameStore = useEnhancedGameStore.getState();
      return {
        gameNumber: gameStore.gameNumber,
        gamePhase: gameStore.gamePhase,
        playerCount: gameStore.players?.length,
        isConnected: gameStore.isConnected
      };
    } catch {
      return null;
    }
  }
  
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  
  private handleReportIssue = () => {
    const subject = encodeURIComponent(`Game Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error: ${this.state.error?.message}
Error ID: ${this.state.errorId}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `);
    
    window.open(`mailto:support@liargame.com?subject=${subject}&body=${body}`);
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold">Something went wrong</h2>
                <p className="text-gray-600">
                  We encountered an unexpected error. Don't worry - your game progress should be saved.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-left bg-gray-100 p-3 rounded text-sm">
                    <summary className="cursor-pointer font-mono">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error?.message}
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleReportIssue} className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/lobby'}
                  className="w-full text-sm"
                >
                  Return to Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Performance Monitoring Hook

```typescript
// hooks/usePerformanceMonitoring.ts
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    wsLatency: 0,
    memoryUsage: 0,
    bundleSize: 0
  });
  
  // Monitor component render times
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    return () => observer.disconnect();
  }, []);
  
  // Monitor WebSocket latency
  const measureWebSocketLatency = useCallback(() => {
    const start = performance.now();
    
    return (responseReceived: boolean) => {
      if (responseReceived) {
        const latency = performance.now() - start;
        setMetrics(prev => ({
          ...prev,
          wsLatency: latency
        }));
      }
    };
  }, []);
  
  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };
    
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Report critical performance issues
  useEffect(() => {
    if (metrics.renderTime > 100) {
      console.warn('Slow render detected:', metrics.renderTime + 'ms');
    }
    
    if (metrics.wsLatency > 1000) {
      console.warn('High WebSocket latency:', metrics.wsLatency + 'ms');
    }
    
    if (metrics.memoryUsage > 50) {
      console.warn('High memory usage:', metrics.memoryUsage + 'MB');
    }
  }, [metrics]);
  
  return {
    metrics,
    measureWebSocketLatency
  };
};

interface PerformanceMetrics {
  renderTime: number;
  wsLatency: number;
  memoryUsage: number;
  bundleSize: number;
}
```

This comprehensive guide covers responsive design implementation, touch optimization, error handling, and performance monitoring for the Liar Game frontend, ensuring a smooth experience across all devices and scenarios.