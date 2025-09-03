# Phase 1: 기반 환경 구축 단계

> **목표**: Main Version 개발을 위한 기본 환경을 구축하고 핵심 컴포넌트의 데모를 개발합니다.

**예상 소요시간**: 3-4일  
**선행 조건**: [Phase 0: 프로젝트 준비 및 분석](./phase-0-preparation.md) 완료  
**다음 단계**: [Phase 2: 핵심 컴포넌트 개발](./phase-2-components.md)

---

## 🛠️ Step 1.1: shadcn/ui 환경 구축

### 📋 프롬프트

```markdown
# Main Version shadcn/ui 환경 구축

## 목표
Radix UI + shadcn/ui + Framer Motion 기반의 Main Version 개발 환경을 완성합니다.

## 설치 및 설정 작업

### A. 핵심 패키지 설치
```bash
# shadcn/ui 핵심 의존성
npm install @radix-ui/react-slot @radix-ui/react-toast @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-avatar @radix-ui/react-progress
npm install class-variance-authority clsx tailwind-merge lucide-react

# Framer Motion
npm install framer-motion

# React Hook Form + Zod
npm install react-hook-form @hookform/resolvers zod

# 추가 유틸리티
npm install date-fns @radix-ui/react-icons
```

### B. Tailwind CSS 설정 업데이트
1. **tailwind.config.js 구성**
   ```javascript
   module.exports = {
     content: [
       "./src/**/*.{js,ts,jsx,tsx}",
       "./src/versions/main/**/*.{js,ts,jsx,tsx}", // Main 버전 전용
     ],
     theme: {
       extend: {
         colors: {
           border: "hsl(var(--border))",
           input: "hsl(var(--input))",
           ring: "hsl(var(--ring))",
           background: "hsl(var(--background))",
           foreground: "hsl(var(--foreground))",
           primary: {
             DEFAULT: "hsl(var(--primary))",
             foreground: "hsl(var(--primary-foreground))",
           },
           // 게임 특화 색상 추가
           "game-primary": "hsl(var(--game-primary))",
           "game-danger": "hsl(var(--game-danger))",
           "role-citizen": "hsl(var(--role-citizen))",
           "role-liar": "hsl(var(--role-liar))",
         },
         borderRadius: {
           lg: "var(--radius)",
           md: "calc(var(--radius) - 2px)",
           sm: "calc(var(--radius) - 4px)",
         },
         keyframes: {
           "vote-pulse": {
             "0%, 100%": { transform: "scale(1)" },
             "50%": { transform: "scale(1.05)" },
           },
           "hint-glow": {
             "0%, 100%": { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
             "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
           },
         },
         animation: {
           "vote-pulse": "vote-pulse 1s ease-in-out infinite",
           "hint-glow": "hint-glow 2s ease-in-out infinite",
         },
       },
     },
     plugins: [require("tailwindcss-animate")],
   }
   ```

2. **globals.css 구성**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 222.2 84% 4.9%;
       
       /* 게임 특화 색상 */
       --game-primary: 217 91% 60%;
       --game-danger: 0 84% 60%;
       --role-citizen: 142 76% 36%;
       --role-liar: 0 72% 51%;
       
       --border: 214.3 31.8% 91.4%;
       --input: 214.3 31.8% 91.4%;
       --ring: 221.2 83.2% 53.3%;
       --radius: 0.5rem;
     }
     
     .dark {
       --background: 222.2 84% 4.9%;
       --foreground: 210 40% 98%;
       
       /* 다크 모드 게임 색상 */
       --game-primary: 217 91% 70%;
       --game-danger: 0 84% 70%;
       --role-citizen: 142 76% 46%;
       --role-liar: 0 72% 61%;
     }
   }
   
   @layer components {
     /* 게임 특화 컴포넌트 스타일 */
     .player-card {
       @apply relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm;
     }
     
     .player-card--current-turn {
       @apply ring-2 ring-game-primary animate-hint-glow;
     }
     
     .voting-button {
       @apply transition-all duration-200 hover:scale-105 active:scale-95;
     }
   }
   ```

### C. shadcn/ui 초기화 및 컴포넌트 설치
```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 게임에 필요한 기본 컴포넌트 설치
npx shadcn-ui@latest add button input card dialog form
npx shadcn-ui@latest add toast avatar badge progress skeleton
npx shadcn-ui@latest add dropdown-menu radio-group checkbox
npx shadcn-ui@latest add tabs separator scroll-area
```

### D. 프로젝트 구조 생성
```
src/versions/main/
├── app/
│   ├── layout.tsx           # Main 버전 레이아웃
│   └── providers.tsx        # Main 전용 프로바이더
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트들 (자동 생성)
│   ├── game/                # 게임 특화 컴포넌트
│   ├── motion/              # Framer Motion 래퍼들
│   └── forms/               # React Hook Form 컴포넌트
├── lib/
│   ├── utils.ts             # shadcn/ui 유틸리티
│   ├── validations.ts       # Zod 스키마
│   └── constants.ts         # Main 버전 상수
├── hooks/                   # Main 전용 훅들
└── styles/
    ├── globals.css          # Main 버전 글로벌 스타일
    └── themes.css           # 테마 변형들
```

## 검증 및 테스트

### A. 기본 기능 테스트
1. **컴포넌트 렌더링 검증**
   - 모든 shadcn/ui 컴포넌트 정상 렌더링
   - 다크/라이트 테마 전환 동작
   - 반응형 레이아웃 확인

2. **개발 환경 확인**
   - Hot reload 성능
   - TypeScript 타입 체크
   - ESLint/Prettier 호환성

### B. 성능 벤치마크
- 번들 사이즈 측정
- 초기 로딩 속도
- Lighthouse 점수

## 출력 요구사항
1. 완전히 설정된 Main 버전 개발 환경
2. 기본 컴포넌트 데모 페이지
3. 성능 벤치마크 결과
4. 다음 단계 개발 가이드
```

### ✅ 완료 기준
- [ ] 모든 필수 패키지 설치 완료
- [ ] Tailwind CSS 설정 완료
- [ ] shadcn/ui 컴포넌트 설치 완료
- [ ] 기본 프로젝트 구조 생성
- [ ] 개발 환경 정상 동작 확인

---

## 🎨 Step 1.2: 기본 컴포넌트 데모 개발

### 📋 프롬프트

```markdown
# 기본 컴포넌트 데모 및 디자인 시스템 검증

## 목표
shadcn/ui 기반으로 게임에 필요한 핵심 컴포넌트들의 데모를 개발하여 디자인 시스템을 검증합니다.

## 개발 대상 컴포넌트

### A. 확장된 shadcn/ui 컴포넌트
1. **GameButton 컴포넌트**
   ```typescript
   interface GameButtonProps extends ButtonProps {
     variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'game-primary' | 'game-danger';
     size: 'default' | 'sm' | 'lg' | 'icon';
     animation?: 'none' | 'pulse' | 'glow' | 'shake' | 'scale';
     loading?: boolean;
     particleEffect?: boolean;
   }
   ```

2. **GameCard 컴포넌트**
   ```typescript
   interface GameCardProps extends CardProps {
     variant: 'default' | 'interactive' | 'player' | 'phase';
     selected?: boolean;
     disabled?: boolean;
     glowEffect?: boolean;
     hoverScale?: boolean;
   }
   ```

3. **StatusIndicator 컴포넌트**
   ```typescript
   interface StatusIndicatorProps {
     status: 'online' | 'offline' | 'playing' | 'waiting' | 'voting';
     size?: 'sm' | 'md' | 'lg';
     animated?: boolean;
     showLabel?: boolean;
   }
   ```

### B. 게임 특화 기본 컴포넌트
1. **PlayerAvatar 컴포넌트**
   ```typescript
   interface PlayerAvatarProps {
     player: {
       id: number;
       nickname: string;
       isOnline: boolean;
       role?: 'CITIZEN' | 'LIAR';
     };
     size: 'sm' | 'md' | 'lg' | 'xl';
     showStatus?: boolean;
     showRole?: boolean;
     interactive?: boolean;
     onClick?: () => void;
   }
   ```

2. **GamePhaseIndicator 컴포넌트**
   ```typescript
   interface GamePhaseIndicatorProps {
     currentPhase: 'WAITING' | 'SPEECH' | 'VOTING' | 'DEFENSE' | 'FINAL_VOTE' | 'GAME_OVER';
     timeRemaining?: number;
     totalTime?: number;
     animated?: boolean;
   }
   ```

3. **VoteCounter 컴포넌트**
   ```typescript
   interface VoteCounterProps {
     current: number;
     total: number;
     target: number;
     animated?: boolean;
     showProgress?: boolean;
   }
   ```

### C. Framer Motion 통합 컴포넌트
1. **AnimatedCard 래퍼**
   ```typescript
   const cardVariants = {
     initial: { opacity: 0, y: 20 },
     animate: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -20 },
     hover: { scale: 1.02, y: -2 },
     tap: { scale: 0.98 }
   };
   ```

2. **PageTransition 컴포넌트**
   ```typescript
   const pageVariants = {
     initial: { opacity: 0, x: -20 },
     animate: { opacity: 1, x: 0 },
     exit: { opacity: 0, x: 20 }
   };
   ```

### D. React Hook Form 통합 컴포넌트
1. **GameFormField 컴포넌트**
   ```typescript
   interface GameFormFieldProps {
     name: string;
     label: string;
     placeholder?: string;
     type?: 'text' | 'number' | 'select';
     options?: Array<{ value: string; label: string }>;
     validation?: ZodSchema;
   }
   ```

## 데모 페이지 구성

### ComponentDemo 페이지
```typescript
// /main/demo 경로에 생성
const ComponentDemo = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <GameButton variant="game-primary">Primary Action</GameButton>
          <GameButton variant="game-danger">Dangerous Action</GameButton>
          <GameButton variant="outline" animation="pulse">Pulsing Button</GameButton>
          <GameButton loading>Loading State</GameButton>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Player Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlayerAvatar 
            player={{ id: 1, nickname: "Player1", isOnline: true, role: "CITIZEN" }}
            size="lg"
            showStatus
            showRole
          />
          <PlayerAvatar 
            player={{ id: 2, nickname: "Player2", isOnline: false, role: "LIAR" }}
            size="lg"
            showStatus
            showRole
          />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Game State Indicators</h2>
        <div className="space-y-4">
          <GamePhaseIndicator 
            currentPhase="SPEECH" 
            timeRemaining={30} 
            totalTime={60} 
            animated 
          />
          <VoteCounter current={3} total={6} target={4} animated showProgress />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Animation Tests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <AnimatedCard key={i} className="p-4 text-center">
              <p>Animated Card {i}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>
    </div>
  );
};
```

## 테스트 및 검증

### A. 시각적 검증
1. **다양한 상태 테스트**
   - 기본, 호버, 활성, 비활성 상태
   - 로딩, 에러 상태
   - 다크/라이트 테마 적용

2. **반응형 테스트**
   - 모바일, 태블릿, 데스크톱 레이아웃
   - 터치 인터페이스 최적화

### B. 상호작용 테스트
1. **애니메이션 성능**
   - 60fps 유지 여부
   - 버터 스무스한 전환
   - 메모리 사용량

2. **접근성 검증**
   - 키보드 네비게이션
   - 스크린 리더 호환성
   - 색상 대비 검사

## 출력 요구사항
1. 완성된 기본 컴포넌트 라이브러리
2. 인터랙티브 데모 페이지
3. 컴포넌트 사용 가이드
4. 성능 및 접근성 테스트 결과
5. 다음 Phase 개발 준비 완료 확인
```

### ✅ 완료 기준
- [ ] 모든 기본 컴포넌트 개발 완료
- [ ] 데모 페이지 정상 동작
- [ ] 애니메이션 성능 검증 완료
- [ ] 접근성 테스트 통과
- [ ] 컴포넌트 사용 가이드 작성

---

## 🎯 Phase 1 완료 체크리스트

### 필수 완료사항
- [ ] **개발 환경**: shadcn/ui + Framer Motion 완전 설정
- [ ] **기본 컴포넌트**: 게임에 필요한 핵심 컴포넌트 데모 완성
- [ ] **디자인 시스템**: 일관된 스타일 가이드 수립
- [ ] **성능 기준**: 초기 성능 벤치마크 설정
- [ ] **개발 도구**: TypeScript, ESLint, Prettier 정상 동작

### 산출물
1. **완성된 개발 환경**: Main Version 전용 개발 환경
2. **컴포넌트 라이브러리**: 기본 UI 컴포넌트 세트
3. **데모 애플리케이션**: 컴포넌트 시연용 데모 페이지
4. **성능 리포트**: 초기 성능 측정 결과
5. **개발 가이드**: 컴포넌트 사용법 및 개발 가이드

### 품질 기준
- **번들 사이즈**: 기존 Light Version 대비 30% 이내 증가
- **로딩 성능**: Lighthouse Performance 90점 이상
- **접근성**: WCAG 2.1 AA 수준 준수
- **타입 안전성**: TypeScript 에러 0개
- **애니메이션**: 60fps 유지

---

## 🚨 주의사항

1. **의존성 충돌 방지**: 기존 Light Version과 패키지 충돌 없이 설치
2. **성능 영향 최소화**: Main Version 개발이 전체 프로젝트 성능에 영향 없도록 관리
3. **점진적 통합**: 한 번에 모든 컴포넌트를 교체하지 말고 단계적으로 진행
4. **테스트 중심**: 모든 컴포넌트에 대한 기본적인 테스트 케이스 작성

---

## 🔧 문제 해결

### 자주 발생하는 문제들

**1. Tailwind와 기존 CSS 충돌**
```bash
# Tailwind 스코핑 설정
# tailwind.config.js에서 prefix 설정 또는 별도 빌드 환경 구성
```

**2. shadcn/ui 컴포넌트 타입 에러**
```bash
# 타입 정의 설치
npm install --save-dev @types/react @types/react-dom
```

**3. Framer Motion 성능 이슈**
```typescript
// 애니메이션 최적화 설정
const reducedMotion = useReducedMotion();
const animation = reducedMotion ? {} : animationConfig;
```

---

## 🔄 다음 단계

Phase 1 완료 후 [Phase 2: 핵심 컴포넌트 개발](./phase-2-components.md)로 진행합니다.

**Phase 2 미리보기:**
- 게임 특화 고급 컴포넌트 개발
- 실시간 애니메이션 시스템 구축
- 복잡한 인터랙션 구현