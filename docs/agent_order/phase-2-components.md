# Phase 2: 핵심 컴포넌트 개발 및 검증 단계

> **목표**: 라이어 게임에 특화된 고급 컴포넌트와 동적 애니메이션 시스템을 개발합니다.

**예상 소요시간**: 5-7일  
**선행 조건**: [Phase 1: 기반 환경 구축](./phase-1-foundation.md) 완료  
**다음 단계**: [Phase 3: 통합 및 버전 관리](./phase-3-integration.md)

---

## 🎮 Step 2.1: 게임 특화 컴포넌트 시스템 개발

### 📋 프롬프트

```markdown
# 게임 특화 컴포넌트 시스템 개발

## 목표
라이어 게임의 핵심 게임플레이를 지원하는 고급 컴포넌트 시스템을 개발합니다.

## 개발 대상 컴포넌트

### A. PlayerCard 고급 버전
```typescript
interface AdvancedPlayerCardProps {
  player: {
    id: number;
    userId: number;
    nickname: string;
    isAlive: boolean;
    role?: 'CITIZEN' | 'LIAR';
    state: PlayerState;
    hint?: string;
    votesReceived: number;
    hasVoted: boolean;
  };
  gamePhase: GamePhase;
  isCurrentTurn?: boolean;
  isVotingTarget?: boolean;
  onVote?: (playerId: number) => void;
  onViewHint?: (hint: string) => void;
  disabled?: boolean;
}
```

**기능:**
- 실시간 상태 표시 (투표 상태, 힌트 제공 여부)
- 역할별 시각적 구분 (시민/라이어 - 게임 종료 후에만)
- 현재 턴 플레이어 하이라이트 애니메이션
- 투표 카운트 실시간 업데이트
- 터치/클릭 피드백 애니메이션

### B. GameBoard 컴포넌트
```typescript
interface GameBoardProps {
  players: Player[];
  gameState: {
    gamePhase: GamePhase;
    currentTurnIndex: number;
    currentPlayerId?: number;
  };
  layout: 'circle' | 'grid' | 'adaptive';
  onPlayerAction?: (action: PlayerAction) => void;
  interactive?: boolean;
}
```

**기능:**
- 동적 레이아웃 (플레이어 수에 따른 자동 배치)
- 턴 순서 시각화 (화살표, 연결선)
- 실시간 애니메이션 (플레이어 추가/제거 시)
- 반응형 디자인 (모바일 최적화)

### C. VotingPanel 고급 버전
```typescript
interface VotingPanelProps {
  players: Player[];
  votingType: 'LIAR_SELECTION' | 'FINAL_SURVIVAL';
  onVote: (targetId: number, voteType?: boolean) => Promise<void>;
  timeRemaining?: number;
  currentVotes: VotingRecord[];
  userVote?: number | boolean;
  disabled?: boolean;
}
```

**기능:**
- 두 가지 투표 유형 지원 (라이어 지목, 찬반 투표)
- 실시간 투표 현황 시각화
- 타이머 통합 (시간 경고 애니메이션)
- 투표 취소 기능
- 결과 애니메이션

### D. ChatSystem 통합 컴포넌트
```typescript
interface ChatSystemProps {
  gameNumber: number;
  messages: ChatMessage[];
  chatType: ChatMessageType;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  allowedSender?: 'current_player' | 'accused_player' | 'all';
}
```

**기능:**
- 게임 단계별 채팅 제한 적용
- 메시지 타입별 스타일링 (힌트, 토론, 변론, 시스템)
- 실시간 메시지 애니메이션
- 스크롤 최적화 (가상화 적용)
- 비속어 필터링 통합

### E. GamePhaseIndicator 고급 버전
```typescript
interface GamePhaseIndicatorProps {
  currentPhase: GamePhase;
  phaseConfig: {
    [key in GamePhase]: {
      label: string;
      description: string;
      color: string;
      icon: React.ReactNode;
    }
  };
  timeRemaining?: number;
  totalTime?: number;
  onPhaseSkip?: () => void; // 권한이 있는 경우만
  nextPhase?: GamePhase;
}
```

**기능:**
- 단계별 진행 상황 시각화
- 원형 타이머 또는 프로그레스 바
- 다음 단계 미리보기
- 단계별 설명 툴팁
- 애니메이션 전환 효과

## 성능 최적화 전략

### A. 컴포넌트 최적화
1. **메모이제이션**
   ```typescript
   const PlayerCard = React.memo(({ player, gamePhase, ...props }) => {
     // 플레이어 상태가 변경될 때만 리렌더링
   }, (prevProps, nextProps) => {
     return (
       prevProps.player.id === nextProps.player.id &&
       prevProps.player.state === nextProps.player.state &&
       prevProps.gamePhase === nextProps.gamePhase
     );
   });
   ```

2. **가상화 적용**
   ```typescript
   // 대규모 채팅 메시지 리스트
   import { FixedSizeList as List } from 'react-window';
   
   const VirtualizedChatList = ({ messages }) => (
     <List
       height={400}
       itemCount={messages.length}
       itemSize={60}
       itemData={messages}
     >
       {ChatMessageItem}
     </List>
   );
   ```

## 테스트 및 검증

### A. 컴포넌트 테스팅
1. **단위 테스트**
   - 각 컴포넌트의 렌더링 테스트
   - 상태 변화에 따른 동작 테스트
   - 이벤트 핸들러 테스트

2. **통합 테스트**
   - 컴포넌트 간 상호작용 테스트
   - 실시간 데이터 업데이트 테스트
   - 애니메이션 동작 테스트

### B. 성능 테스트
1. **렌더링 성능 측정**
2. **메모리 사용량 모니터링**
3. **애니메이션 프레임률 확인**

## 출력 요구사항
1. 완성된 게임 특화 컴포넌트 라이브러리
2. 성능 최적화 적용 결과
3. 종합적인 테스트 스위트
4. 컴포넌트 사용 가이드 및 API 문서
```

### ✅ 완료 기준
- [ ] 모든 게임 특화 컴포넌트 개발 완료
- [ ] 실시간 상호작용 구현 완료
- [ ] 성능 최적화 적용 완료
- [ ] 단위 및 통합 테스트 작성 완료

---

## 🎭 Step 2.2: 동적 애니메이션 시스템 구축

### 📋 프롬프트

```markdown
# 동적 애니메이션 시스템 구축

## 목표
게임의 몰입도를 높이는 고품질 애니메이션 시스템을 구축하고, 성능과 사용자 경험을 균형있게 최적화합니다.

## 애니메이션 아키텍처

### A. 애니메이션 레이어 구조
```typescript
// 1. 기본 애니메이션 프리셋
export const baseAnimations = {
  fadeIn: { opacity: [0, 1] },
  slideUp: { y: [20, 0], opacity: [0, 1] },
  scaleIn: { scale: [0.9, 1], opacity: [0, 1] },
  bounce: { scale: [1, 1.1, 1] },
};

// 2. 게임 특화 애니메이션
export const gameAnimations = {
  turnHighlight: {
    boxShadow: [
      '0 0 0 rgba(59, 130, 246, 0)',
      '0 0 20px rgba(59, 130, 246, 0.8)',
      '0 0 0 rgba(59, 130, 246, 0)'
    ],
    transition: { duration: 2, repeat: Infinity }
  },
  voteSuccess: {
    scale: [1, 1.2, 1],
    rotate: [0, 5, -5, 0],
    transition: { duration: 0.6, ease: "backOut" }
  },
  elimination: {
    opacity: [1, 0.3],
    scale: [1, 0.95],
    grayscale: [0, 1],
    transition: { duration: 0.8 }
  }
};

// 3. 복합 애니메이션 시퀀스
export const animationSequences = {
  gameStart: {
    stages: [
      { cards: { scale: [0, 1], stagger: 0.1 } },
      { timer: { opacity: [0, 1], delay: 0.5 } },
      { instructions: { y: [-20, 0], delay: 0.8 } }
    ]
  },
  roundEnd: {
    stages: [
      { results: { scale: [0, 1] } },
      { scoreboard: { opacity: [0, 1], delay: 0.3 } },
      { nextButton: { y: [20, 0], delay: 0.6 } }
    ]
  }
};
```

### B. 실시간 파티클 효과
1. **투표 시 파티클**
   ```typescript
   const VoteParticleEffect = ({ targetPosition, particleCount = 10 }) => {
     return (
       <AnimatePresence>
         {[...Array(particleCount)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-2 h-2 bg-blue-500 rounded-full"
             initial={{
               x: 0, y: 0, opacity: 1, scale: 1
             }}
             animate={{
               x: targetPosition.x + Math.random() * 20 - 10,
               y: targetPosition.y + Math.random() * 20 - 10,
               opacity: 0,
               scale: 0
             }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
           />
         ))}
       </AnimatePresence>
     );
   };
   ```

2. **게임 종료 축하 효과**
   ```typescript
   const VictoryAnimation = ({ winningTeam }) => {
     const confettiVariants = {
       initial: { y: -100, opacity: 1, rotate: 0 },
       animate: {
         y: window.innerHeight + 100,
         opacity: [1, 1, 0],
         rotate: 360,
         transition: {
           duration: 3,
           ease: "easeIn"
         }
       }
     };
   };
   ```

### C. 맥락 인식 애니메이션
```typescript
interface AnimationContextProps {
  gamePhase: GamePhase;
  playerCount: number;
  isCurrentPlayer: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  performanceLevel: 'low' | 'medium' | 'high';
  userPreferences: {
    reduceMotion: boolean;
    preferredSpeed: number;
  };
}

const useContextualAnimation = (context: AnimationContextProps) => {
  return useMemo(() => {
    const baseConfig = getAnimationConfig(context.gamePhase);
    
    // 성능 수준에 따른 조정
    if (context.performanceLevel === 'low') {
      baseConfig.duration *= 0.5;
      baseConfig.complexity = 'simple';
    }
    
    // 사용자 설정 반영
    if (context.userPreferences.reduceMotion) {
      return { duration: 0, ease: 'linear' };
    }
    
    baseConfig.duration *= context.userPreferences.preferredSpeed;
    
    return baseConfig;
  }, [context]);
};
```

## 성능 최적화

### A. 애니메이션 성능 최적화
1. **GPU 레이어 활용**
   ```css
   .optimized-animation {
     will-change: transform, opacity;
     backface-visibility: hidden;
     perspective: 1000px;
   }
   ```

2. **적응형 품질 조정**
   ```typescript
   const useAdaptiveAnimation = () => {
     const [performanceLevel, setPerformanceLevel] = useState('high');
     
     useEffect(() => {
       // 성능 모니터링
       const observer = new PerformanceObserver((list) => {
         const entries = list.getEntries();
         const avgFrameTime = entries.reduce((sum, entry) => 
           sum + entry.duration, 0) / entries.length;
         
         if (avgFrameTime > 16) { // 60fps 이하
           setPerformanceLevel('medium');
         }
         if (avgFrameTime > 32) { // 30fps 이하
           setPerformanceLevel('low');
         }
       });
       
       observer.observe({ entryTypes: ['measure'] });
       
       return () => observer.disconnect();
     }, []);
     
     return performanceLevel;
   };
   ```

## 접근성 고려사항

### A. 모션 감소 옵션
```typescript
const respectMotionPreference = (animation) => {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  if (prefersReducedMotion) {
    return {
      ...animation,
      transition: { duration: 0 }
    };
  }
  
  return animation;
};
```

### B. 키보드 네비게이션 애니메이션
```typescript
const FocusableCard = ({ children }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      animate={{
        scale: isFocused ? 1.05 : 1,
        boxShadow: isFocused 
          ? '0 0 0 2px #3b82f6' 
          : '0 1px 3px rgba(0,0,0,0.1)'
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};
```

## 출력 요구사항
1. 완성된 동적 애니메이션 시스템
2. 맥락 인식 애니메이션 컨텍스트
3. 성능 최적화된 애니메이션 라이브러리
4. 접근성을 고려한 애니메이션 옵션
5. 종합적인 테스트 및 성능 벤치마크
```

### ✅ 완료 기준
- [ ] 애니메이션 시스템 아키텍처 완성
- [ ] 게임 특화 애니메이션 구현 완료
- [ ] 성능 최적화 적용 완료
- [ ] 접근성 옵션 구현 완료
- [ ] 애니메이션 테스트 완료

---

## 🎯 Phase 2 완료 체크리스트

### 필수 완료사항
- [ ] **게임 컴포넌트**: 모든 핵심 게임 컴포넌트 개발 완료
- [ ] **애니메이션 시스템**: 동적 애니메이션 시스템 완성
- [ ] **실시간 인터랙션**: 실시간 상호작용 구현
- [ ] **성능 최적화**: 60fps 애니메이션 유지
- [ ] **테스트 커버리지**: 80% 이상 테스트 커버리지 달성

### 산출물
1. **고급 컴포넌트 라이브러리**: 게임 특화 컴포넌트 완성
2. **애니메이션 시스템**: Framer Motion 기반 애니메이션
3. **성능 최적화 결과**: 벤치마크 개선 리포트
4. **테스트 스위트**: 종합적인 테스트 케이스
5. **사용자 경험 가이드**: UX 패턴 및 가이드라인

---

## 🔄 다음 단계

Phase 2 완료 후 [Phase 3: 통합 및 버전 관리](./phase-3-integration.md)로 진행합니다.

**Phase 3 미리보기:**
- Light Version과 Main Version 통합
- 공통 모듈 분리 및 관리
- 버전 전환 시스템 구현