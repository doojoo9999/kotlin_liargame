# Phase 4: 고급 기능 및 완성도 단계

> **목표**: 고급 사용자 경험 기능을 구현하고 접근성, 성능 최적화를 통해 전체적인 완성도를 극대화합니다.

**예상 소요시간**: 3-4일  
**선행 조건**: [Phase 3: 통합 및 버전 관리](./phase-3-integration.md) 완료  
**다음 단계**: [Phase 5: 테스트 및 배포](./phase-5-deployment.md)

---

## ✨ Step 4.1: 고급 사용자 경험 구현

### 📋 프롬프트

```markdown
# 고급 사용자 경험 구현

## 목표
마이크로 인터랙션, 고급 애니메이션, 적응형 UI를 통해 몰입도 높은 사용자 경험을 구현합니다.

## 마이크로 인터랙션 시스템

### A. 인터랙션 매니저
```typescript
// shared/interactions/manager.ts
export type InteractionType = 
  | 'hover' | 'click' | 'focus' | 'drag' 
  | 'vote_cast' | 'hint_submit' | 'turn_change'
  | 'player_join' | 'player_leave' | 'game_start';

export interface InteractionConfig {
  type: InteractionType;
  trigger: string;
  animation: any;
  sound?: string;
  haptic?: boolean;
  cooldown?: number;
}

export class InteractionManager {
  private activeInteractions = new Map<string, number>();
  private soundEnabled = true;
  private hapticsEnabled = true;

  async executeInteraction(
    element: HTMLElement, 
    config: InteractionConfig
  ): Promise<void> {
    // 쿨다운 체크
    if (this.isOnCooldown(config.type)) return;
    
    // 멀티모달 피드백 실행
    await Promise.all([
      this.playAnimation(element, config.animation),
      this.playSound(config.sound),
      this.playHaptic(config.haptic)
    ]);
    
    // 쿨다운 설정
    if (config.cooldown) {
      this.setCooldown(config.type, config.cooldown);
    }
  }

  private async playAnimation(element: HTMLElement, animation: any) {
    return new Promise<void>((resolve) => {
      element.animate(animation.keyframes, {
        duration: animation.duration || 300,
        easing: animation.easing || 'ease-out'
      }).addEventListener('finish', () => resolve());
    });
  }

  private async playSound(soundKey?: string) {
    if (!this.soundEnabled || !soundKey) return;
    
    const audio = new Audio(`/sounds/${soundKey}.mp3`);
    audio.volume = 0.3;
    return audio.play().catch(() => {}); // 무시
  }

  private async playHaptic(enabled?: boolean) {
    if (!this.hapticsEnabled || !enabled) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }
}
```

### B. 게임 특화 애니메이션
```typescript
// versions/main/animations/game-specific.ts
export const gameAnimations = {
  // 플레이어 턴 전환 애니메이션
  turnTransition: {
    current: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.6)',
        '0 0 10px rgba(59, 130, 246, 0.3)'
      ],
      transition: { 
        duration: 0.8, 
        ease: "easeInOut"
      }
    },
    previous: {
      scale: [1.05, 1],
      boxShadow: [
        '0 0 10px rgba(59, 130, 246, 0.3)',
        '0 0 0 rgba(59, 130, 246, 0)'
      ],
      transition: { duration: 0.4 }
    }
  },

  // 투표 시 파티클 효과
  voteParticles: {
    container: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 200,
      height: 200,
      pointerEvents: 'none'
    },
    particle: {
      initial: { 
        scale: 0, 
        opacity: 1, 
        x: 0, 
        y: 0 
      },
      animate: (i: number) => ({
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: Math.cos(i * (360 / 12) * Math.PI / 180) * 80,
        y: Math.sin(i * (360 / 12) * Math.PI / 180) * 80,
        transition: {
          duration: 1.2,
          delay: i * 0.1,
          ease: "easeOut"
        }
      })
    }
  },

  // 게임 종료 축하 효과
  victory: {
    confetti: {
      initial: { y: -100, rotate: 0, opacity: 1 },
      animate: {
        y: window.innerHeight + 100,
        rotate: 720,
        opacity: [1, 1, 0],
        transition: {
          duration: 3,
          ease: "easeIn"
        }
      }
    },
    celebration: {
      scale: [1, 1.2, 1.1],
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 1.5,
        ease: "backOut"
      }
    }
  }
};
```

### C. 적응형 UI 시스템
```typescript
// versions/main/adaptive/ui-system.ts
export interface AdaptiveUIConfig {
  screenSize: 'mobile' | 'tablet' | 'desktop';
  deviceCapability: 'low' | 'medium' | 'high';
  networkSpeed: 'slow' | 'fast';
  userPreferences: {
    animationLevel: 'minimal' | 'reduced' | 'full';
    colorScheme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    contrast: 'normal' | 'high';
  };
}

export class AdaptiveUIManager {
  private config: AdaptiveUIConfig;

  constructor() {
    this.config = this.detectConfiguration();
  }

  getLayoutConfig() {
    const { screenSize } = this.config;
    
    return {
      playerCard: {
        size: screenSize === 'mobile' ? 'compact' : 'full',
        columns: screenSize === 'mobile' ? 2 : screenSize === 'tablet' ? 3 : 4,
        spacing: screenSize === 'mobile' ? 'tight' : 'comfortable'
      },
      gameBoard: {
        layout: screenSize === 'mobile' ? 'stack' : 'grid',
        orientation: screenSize === 'mobile' ? 'portrait' : 'landscape'
      },
      chat: {
        position: screenSize === 'mobile' ? 'bottom' : 'side',
        height: screenSize === 'mobile' ? '40%' : '100%'
      }
    };
  }

  getAnimationLevel() {
    const { deviceCapability, userPreferences } = this.config;
    
    if (userPreferences.animationLevel === 'minimal') return 'none';
    if (userPreferences.animationLevel === 'reduced') return 'essential';
    if (deviceCapability === 'low') return 'reduced';
    
    return 'full';
  }

  getDynamicStyles() {
    const { userPreferences } = this.config;
    
    return {
      fontSize: {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[userPreferences.fontSize],
      
      contrast: userPreferences.contrast === 'high' ? {
        backgroundColor: '#000000',
        color: '#ffffff',
        borderWidth: '2px'
      } : {},
      
      colorScheme: userPreferences.colorScheme
    };
  }
}
```

### D. 고급 제스처 인식
```typescript
// versions/main/gestures/recognizer.ts
import { useState, useEffect } from 'react';

export interface GestureConfig {
  swipe?: {
    threshold: number;
    direction: 'horizontal' | 'vertical' | 'both';
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  };
  pinch?: {
    threshold: number;
    onPinchIn?: () => void;
    onPinchOut?: () => void;
  };
  longPress?: {
    duration: number;
    onLongPress?: () => void;
  };
}

export const useAdvancedGestures = (
  element: React.RefObject<HTMLElement>,
  config: GestureConfig
) => {
  const [gestureState, setGestureState] = useState({
    isPressed: false,
    startTime: 0,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 }
  });

  useEffect(() => {
    const el = element.current;
    if (!el) return;

    // 터치 이벤트 처리
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setGestureState({
        isPressed: true,
        startTime: Date.now(),
        startPos: { x: touch.clientX, y: touch.clientY },
        currentPos: { x: touch.clientX, y: touch.clientY }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gestureState.isPressed) return;
      
      const touch = e.touches[0];
      setGestureState(prev => ({
        ...prev,
        currentPos: { x: touch.clientX, y: touch.clientY }
      }));
    };

    const handleTouchEnd = () => {
      if (!gestureState.isPressed) return;
      
      const duration = Date.now() - gestureState.startTime;
      const deltaX = gestureState.currentPos.x - gestureState.startPos.x;
      const deltaY = gestureState.currentPos.y - gestureState.startPos.y;
      
      // 스와이프 감지
      if (config.swipe && (Math.abs(deltaX) > config.swipe.threshold || Math.abs(deltaY) > config.swipe.threshold)) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) config.swipe.onSwipeRight?.();
          else config.swipe.onSwipeLeft?.();
        } else {
          if (deltaY > 0) config.swipe.onSwipeDown?.();
          else config.swipe.onSwipeUp?.();
        }
      }
      
      // 롱프레스 감지
      if (config.longPress && duration > config.longPress.duration) {
        config.longPress.onLongPress?.();
      }
      
      setGestureState(prev => ({ ...prev, isPressed: false }));
    };

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchmove', handleTouchMove);
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, config, gestureState]);

  return gestureState;
};
```

## 출력 요구사항
1. 완성된 마이크로 인터랙션 시스템
2. 게임 특화 고급 애니메이션 라이브러리
3. 적응형 UI 관리 시스템
4. 고급 제스처 인식 시스템
5. 종합적인 사용자 경험 테스트
```

### ✅ 완료 기준
- [ ] 마이크로 인터랙션 시스템 완성
- [ ] 고급 애니메이션 구현 완료
- [ ] 적응형 UI 시스템 완성
- [ ] 제스처 인식 구현 완료

---

## 🎯 Step 4.2: 접근성 및 성능 최적화

### 📋 프롬프트

```markdown
# 접근성 및 성능 최적화

## 목표
WCAG 2.1 AA 수준의 웹 접근성을 준수하고, 모든 디바이스에서 최적의 성능을 보장합니다.

## 웹 접근성 구현

### A. 접근성 컴포넌트 시스템
```typescript
// versions/main/accessibility/components.tsx
import { forwardRef, ReactNode } from 'react';
import { cn } from '../lib/utils';

// 접근 가능한 버튼 컴포넌트
export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
>(({ children, ariaLabel, ariaDescribedBy, variant = 'primary', size = 'md', ...props }, ref) => {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        // 기본 스타일
        'font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // 크기별 스타일
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        // 변형별 스타일
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
        },
        // 비활성화 상태
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      {...props}
    >
      {children}
    </button>
  );
});

// 접근 가능한 플레이어 카드
export const AccessiblePlayerCard = ({
  player,
  onSelect,
  isSelected,
  isCurrentTurn
}: {
  player: Player;
  onSelect?: () => void;
  isSelected?: boolean;
  isCurrentTurn?: boolean;
}) => {
  const ariaLabel = [
    `플레이어 ${player.nickname}`,
    player.isAlive ? '생존' : '탈락',
    isCurrentTurn ? '현재 턴' : '',
    player.hasVoted ? '투표 완료' : '투표 대기',
    player.hint ? `힌트: ${player.hint}` : ''
  ].filter(Boolean).join(', ');

  return (
    <div
      role={onSelect ? "button" : "img"}
      tabIndex={onSelect ? 0 : -1}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-current={isCurrentTurn ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'player-card border-2 rounded-lg p-4 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        {
          'border-blue-500 bg-blue-50': isSelected,
          'border-yellow-400 bg-yellow-50': isCurrentTurn,
          'border-gray-300 bg-white': !isSelected && !isCurrentTurn,
          'opacity-60 grayscale': !player.isAlive,
          'cursor-pointer hover:bg-gray-50': onSelect
        }
      )}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold" aria-hidden="true">
            {player.nickname.charAt(0)}
          </span>
        </div>
        <span className="text-sm font-medium">{player.nickname}</span>
        
        {/* 상태 정보 */}
        <div className="flex space-x-2 text-xs">
          <span className={cn(
            'px-2 py-1 rounded',
            player.isAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          )}>
            {player.isAlive ? '생존' : '탈락'}
          </span>
          
          {player.hasVoted && (
            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
              투표완료
            </span>
          )}
        </div>
        
        {/* 힌트 정보 */}
        {player.hint && (
          <div className="text-xs text-gray-600 text-center">
            <span className="sr-only">힌트: </span>
            "{player.hint}"
          </div>
        )}
      </div>
    </div>
  );
};
```

### B. 스크린 리더 지원
```typescript
// versions/main/accessibility/screen-reader.ts
export class ScreenReaderManager {
  private announceQueue: string[] = [];
  private isAnnouncing = false;

  announceGameEvent(event: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    const announcement = this.formatAnnouncement(event);
    
    if (priority === 'high') {
      // 즉시 공지
      this.announceImmediate(announcement);
    } else {
      // 큐에 추가
      this.announceQueue.push(announcement);
      this.processQueue();
    }
  }

  private announceImmediate(message: string) {
    const ariaLive = document.getElementById('aria-live-assertive');
    if (ariaLive) {
      ariaLive.textContent = message;
      setTimeout(() => {
        ariaLive.textContent = '';
      }, 1000);
    }
  }

  private async processQueue() {
    if (this.isAnnouncing || this.announceQueue.length === 0) return;
    
    this.isAnnouncing = true;
    
    while (this.announceQueue.length > 0) {
      const message = this.announceQueue.shift()!;
      await this.announcePolite(message);
      await new Promise(resolve => setTimeout(resolve, 500)); // 간격 두기
    }
    
    this.isAnnouncing = false;
  }

  private announcePolite(message: string): Promise<void> {
    return new Promise((resolve) => {
      const ariaLive = document.getElementById('aria-live-polite');
      if (ariaLive) {
        ariaLive.textContent = message;
        setTimeout(() => {
          ariaLive.textContent = '';
          resolve();
        }, 2000);
      } else {
        resolve();
      }
    });
  }

  private formatAnnouncement(event: string): string {
    // 게임 이벤트를 자연스러운 문장으로 변환
    const formats = {
      'player_joined': (data: any) => `${data.nickname}님이 게임에 참가했습니다.`,
      'player_left': (data: any) => `${data.nickname}님이 게임을 떠났습니다.`,
      'turn_changed': (data: any) => `${data.nickname}님의 차례입니다.`,
      'vote_cast': (data: any) => `투표가 접수되었습니다.`,
      'phase_changed': (data: any) => `게임 단계가 ${data.phase}로 변경되었습니다.`,
      'game_ended': (data: any) => `게임이 종료되었습니다. ${data.result}`,
    };

    // 이벤트 형식에 따라 적절한 메시지 생성
    return typeof event === 'string' ? event : formats[event.type]?.(event.data) || '게임 이벤트가 발생했습니다.';
  }
}

// React 컴포넌트로 aria-live 영역 제공
export const AriaLiveRegion = () => (
  <>
    <div
      id="aria-live-polite"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
    <div
      id="aria-live-assertive"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    />
  </>
);
```

### C. 키보드 네비게이션
```typescript
// versions/main/accessibility/keyboard-navigation.ts
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;
  private keyMap: Map<string, () => void> = new Map();

  constructor(container: HTMLElement) {
    this.updateFocusableElements(container);
    this.setupKeyboardListeners(container);
  }

  private updateFocusableElements(container: HTMLElement) {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])'
    ].join(', ');

    this.focusableElements = Array.from(container.querySelectorAll(selector));
    this.currentFocusIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);
  }

  private setupKeyboardListeners(container: HTMLElement) {
    // 기본 키보드 단축키 설정
    this.keyMap.set('Tab', () => this.handleTabNavigation(1));
    this.keyMap.set('Shift+Tab', () => this.handleTabNavigation(-1));
    this.keyMap.set('ArrowRight', () => this.handleArrowNavigation(1));
    this.keyMap.set('ArrowLeft', () => this.handleArrowNavigation(-1));
    this.keyMap.set('ArrowDown', () => this.handleArrowNavigation(1));
    this.keyMap.set('ArrowUp', () => this.handleArrowNavigation(-1));
    this.keyMap.set('Home', () => this.focusFirst());
    this.keyMap.set('End', () => this.focusLast());
    this.keyMap.set('Escape', () => this.handleEscape());

    container.addEventListener('keydown', (e) => {
      const key = this.getKeyString(e);
      const handler = this.keyMap.get(key);
      
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  private getKeyString(e: KeyboardEvent): string {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key);
    return parts.join('+');
  }

  private handleTabNavigation(direction: number) {
    if (this.focusableElements.length === 0) return;
    
    this.currentFocusIndex += direction;
    
    if (this.currentFocusIndex >= this.focusableElements.length) {
      this.currentFocusIndex = 0;
    } else if (this.currentFocusIndex < 0) {
      this.currentFocusIndex = this.focusableElements.length - 1;
    }
    
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private handleArrowNavigation(direction: number) {
    // 그리드나 리스트 내에서의 방향키 네비게이션
    const activeElement = document.activeElement as HTMLElement;
    const role = activeElement?.getAttribute('role');
    
    if (role === 'gridcell' || role === 'option' || role === 'tab') {
      this.handleTabNavigation(direction);
    }
  }

  private focusFirst() {
    if (this.focusableElements.length > 0) {
      this.currentFocusIndex = 0;
      this.focusableElements[0].focus();
    }
  }

  private focusLast() {
    if (this.focusableElements.length > 0) {
      this.currentFocusIndex = this.focusableElements.length - 1;
      this.focusableElements[this.currentFocusIndex].focus();
    }
  }

  private handleEscape() {
    // 모달 닫기, 메뉴 닫기 등
    const activeModal = document.querySelector('[role="dialog"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[data-dismiss]') as HTMLElement;
      closeButton?.click();
    }
  }
}
```

## 성능 최적화

### A. 번들 최적화
```typescript
// config/optimization.ts
export const bundleOptimization = {
  // Code splitting 설정
  codesplitting: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        enforce: true,
      },
      animations: {
        test: /[\\/](framer-motion|lottie-web)[\\/]/,
        name: 'animations',
        chunks: 'all',
      }
    }
  },

  // Tree shaking 최적화
  treeShaking: {
    usedExports: true,
    sideEffects: false,
    optimization: {
      providedExports: true,
      usedExports: true,
      sideEffects: false,
    }
  },

  // 압축 설정
  compression: {
    gzip: true,
    brotli: true,
    threshold: 10240,
  }
};
```

### B. 렌더링 최적화
```typescript
// versions/main/optimization/rendering.tsx
import { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

// 가상화된 플레이어 리스트
export const VirtualizedPlayerList = memo(({ 
  players, 
  onPlayerSelect 
}: {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
}) => {
  const itemRenderer = useCallback(({ index, style }: any) => {
    const player = players[index];
    return (
      <div style={style}>
        <AccessiblePlayerCard
          player={player}
          onSelect={() => onPlayerSelect(player)}
        />
      </div>
    );
  }, [players, onPlayerSelect]);

  return (
    <List
      height={400}
      itemCount={players.length}
      itemSize={120}
      width="100%"
    >
      {itemRenderer}
    </List>
  );
});

// 최적화된 게임 보드
export const OptimizedGameBoard = memo(({ 
  players, 
  gameState,
  onPlayerAction 
}: GameBoardProps) => {
  // 플레이어 상태 변화만 감지하는 메모이제이션
  const memoizedPlayers = useMemo(() => 
    players.map(player => ({
      ...player,
      // 필요한 계산만 미리 수행
      isCurrentTurn: player.id === gameState.currentPlayerId,
      canBeVoted: player.isAlive && player.id !== gameState.currentPlayerId
    })), 
    [players, gameState.currentPlayerId]
  );

  const handlePlayerAction = useCallback((action: PlayerAction) => {
    // 액션 최적화 - 불필요한 리렌더링 방지
    onPlayerAction?.(action);
  }, [onPlayerAction]);

  return (
    <div className="game-board">
      {memoizedPlayers.map(player => (
        <MemoizedPlayerCard
          key={player.id}
          player={player}
          onAction={handlePlayerAction}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // 얕은 비교로 불필요한 리렌더링 방지
  return (
    prevProps.gameState.currentPlayerId === nextProps.gameState.currentPlayerId &&
    prevProps.players.length === nextProps.players.length &&
    prevProps.players.every((player, index) => 
      player.state === nextProps.players[index]?.state
    )
  );
});
```

### C. 메모리 최적화
```typescript
// versions/main/optimization/memory.ts
export class MemoryManager {
  private observers = new Map<string, IntersectionObserver>();
  private timers = new Set<number>();
  private eventListeners = new Map<string, { element: Element; handler: Function }>();

  // Intersection Observer 풀링
  getIntersectionObserver(threshold = 0.1): IntersectionObserver {
    const key = `threshold-${threshold}`;
    
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // 보이는 요소만 활성화
              entry.target.classList.add('active');
            } else {
              // 보이지 않는 요소는 비활성화
              entry.target.classList.remove('active');
            }
          });
        },
        { threshold }
      );
      
      this.observers.set(key, observer);
    }
    
    return this.observers.get(key)!;
  }

  // 타이머 관리
  setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);
    
    this.timers.add(id);
    return id;
  }

  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.timers.add(id);
    return id;
  }

  // 정리 메서드
  cleanup() {
    // 모든 옵저버 정리
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // 모든 타이머 정리
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();
    
    // 이벤트 리스너 정리
    this.eventListeners.forEach(({ element, handler }, event) => {
      element.removeEventListener(event, handler as EventListener);
    });
    this.eventListeners.clear();
  }
}

// React 훅으로 메모리 관리
export const useMemoryOptimization = () => {
  const managerRef = useRef<MemoryManager>();

  useEffect(() => {
    managerRef.current = new MemoryManager();
    
    return () => {
      managerRef.current?.cleanup();
    };
  }, []);

  return managerRef.current;
};
```

## 출력 요구사항
1. WCAG 2.1 AA 수준 웹 접근성 구현
2. 완전한 키보드 네비게이션 지원
3. 스크린 리더 최적화된 게임 경험
4. 번들 크기 최적화 (30% 이상 감소)
5. 렌더링 성능 최적화 (60fps 유지)
6. 메모리 사용량 최적화
```

### ✅ 완료 기준
- [ ] 웹 접근성 WCAG 2.1 AA 준수
- [ ] 키보드 네비게이션 완성
- [ ] 성능 최적화 목표 달성
- [ ] 접근성 테스트 완료

---

## 🎯 Phase 4 완료 체크리스트

### 필수 완료사항
- [ ] **고급 UX**: 마이크로 인터랙션 및 고급 애니메이션 완성
- [ ] **접근성**: WCAG 2.1 AA 수준 웹 접근성 달성
- [ ] **성능 최적화**: 번들 및 렌더링 최적화 완료
- [ ] **반응형**: 모든 디바이스에서 최적화된 경험
- [ ] **사용자 경험**: 적응형 UI 및 제스처 지원

### 산출물
1. **고급 인터랙션**: 마이크로 인터랙션 및 애니메이션 시스템
2. **접근성 시스템**: 완전한 웹 접근성 구현
3. **성능 최적화**: 번들 및 렌더링 최적화 결과
4. **UX 가이드**: 사용자 경험 가이드라인
5. **성능 리포트**: 최적화 전후 성능 비교

---

## 🔄 다음 단계

Phase 4 완료 후 [Phase 5: 테스트 및 배포](./phase-5-deployment.md)로 진행합니다.

**Phase 5 미리보기:**
- 종합 테스트 (단위, 통합, E2E)
- 성능 벤치마크 및 최적화
- 배포 파이프라인 구성