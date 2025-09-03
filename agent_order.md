# 라이어 게임 Main Version 개발 단계별 가이드

## 목차
1. [Phase 1: 분석 및 설계 단계](#phase-1-분석-및-설계-단계)
2. [Phase 1.5: 컴포넌트 데모 및 검증 단계](#phase-15-컴포넌트-데모-및-검증-단계) - **새로 추가**
3. [Phase 2: 기반 구조 구축 단계](#phase-2-기반-구조-구축-단계)
4. [Phase 3: Main Version UI 개발 단계](#phase-3-main-version-ui-개발-단계)
5. [Phase 4: 고급 기능 개발 단계](#phase-4-고급-기능-개발-단계)
6. [Phase 5: 테스트 및 배포 단계](#phase-5-테스트-및-배포-단계)

---

## Phase 1: 분석 및 설계 단계

### 🔍 Step 1.1: 참고 사이트 분석 프롬프트
```markdown
# 참고 사이트 UI/UX 분석 및 인사이트 도출

## 목표
Playwright를 활용하여 Linear와 끄투온라인의 UI/UX 패턴을 분석하고, 라이어 게임에 적용할 수 있는 디자인 인사이트를 도출합니다.

## 분석 대상
1. **Linear (https://linear.app/)**
   - 현대적인 디자인 시스템
   - 애니메이션 및 인터랙션 패턴 (Framer Motion 스타일)
   - 레이아웃 구조 및 네비게이션
   - 색상 체계 및 타이포그래피
   - Radix UI 기반 컴포넌트 패턴

2. **끄투온라인 게임 진행 화면**
   - 실시간 게임 UI 패턴
   - 플레이어 상태 표시 방법
   - 채팅 및 상호작용 인터페이스
   - 게임 진행 상태 시각화

## 분석 항목
### A. 동적 요소 분석
- 페이지 로딩 애니메이션 (Framer Motion 패턴)
- 호버/클릭 인터랙션 (spring 애니메이션)
- 실시간 업데이트 표현 방식
- 상태 변화 트랜지션 (layout 애니메이션)
- Liquid Button, Rolling Text, Shimmering Text
- 마이크로 인터랙션 (scale, opacity, transform)

### B. 레이아웃 및 구조
- 반응형 디자인 패턴
- 컴포넌트 배치 원칙 (CSS Grid, Flexbox)
- 정보 계층 구조
- 공간 활용 방식 (spacing tokens)
- Radix Primitives 활용 패턴

### C. 사용자 경험 패턴
- 액션 플로우 설계
- 피드백 시스템 (toast, dialog)
- 오류 처리 방식 (form validation)
- 로딩 상태 표현 (skeleton, spinner)
- 접근성 고려사항 (ARIA, keyboard navigation)

### D. shadcn/ui 스타일 분석
- 컴포넌트 변형 패턴 (variants)
- 색상 시스템 (CSS variables)
- 크기 시스템 (size tokens)
- 테마 시스템 (light/dark mode)

## 출력 형식
1. 스크린샷 및 시각적 분석
2. 추출 가능한 디자인 패턴 목록
3. Radix + shadcn/ui 적용 방안
4. Framer Motion 애니메이션 패턴
5. 라이어 게임 적용 방안
6. 기술적 구현 고려사항
```

### 📋 Step 1.2: 아키텍처 설계 프롬프트 (업데이트)
```markdown
# Main Version 아키텍처 설계

## 목표
현재 Mantine 기반의 Light Version과 호환되면서, Radix + shadcn/ui 기반의 확장 가능한 Main Version 아키텍처를 설계합니다.

## 기술 스택 정의
### Frontend 기술 스택
- **UI Framework**: Radix UI Primitives + shadcn/ui
- **Animation**: Framer Motion
- **Form Management**: React Hook Form + Zod
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand (기존 유지)
- **Build Tool**: Vite (기존 유지)

### 기존 Light Version (유지)
- **UI Framework**: Mantine
- **기존 로직**: 모든 비즈니스 로직 보존

## 설계 조건
1. **호환성 유지**: 기존 API 및 비즈니스 로직 보존
2. **버전 전환**: Light ↔ Main 버전 간 매끄러운 전환
3. **확장성**: 향후 기능 추가를 고려한 모듈 구조
4. **성능**: 동적 컨텐츠로 인한 성능 저하 최소화
5. **디자인 시스템**: shadcn/ui 기반 일관된 컴포넌트 시스템

## 설계 범위
### A. 프로젝트 구조 (업데이트)
```
frontend/
├── src/
│   ├── versions/
│   │   ├── light/              # 기존 Mantine 기반 Light Version
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   └── main/               # 새로운 Radix + shadcn/ui Main Version
│   │       ├── components/
│   │       │   ├── ui/         # shadcn/ui 컴포넌트들
│   │       │   ├── game/       # 게임 전용 컴포넌트
│   │       │   └── forms/      # React Hook Form 컴포넌트
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── lib/
│   │       │   ├── utils.ts    # shadcn/ui utils
│   │       │   └── validations.ts # Zod 스키마
│   │       └── App.tsx
│   ├── shared/                 # 공통 모듈
│   │   ├── api/               # API 클라이언트
│   │   ├── stores/            # Zustand 스토어
│   │   ├── types/             # 공통 타입 정의
│   │   ├── utils/             # 공통 유틸리티
│   │   └── constants/         # 상수 정의
│   ├── components/            # 버전 간 공유 컴포넌트
│   └── assets/
```

### B. 상태 관리 설계
- **버전별 독립적인 UI 상태**: Light(Mantine) vs Main(Radix)
- **공유되는 게임 비즈니스 로직**: Zustand 스토어
- **실시간 데이터 동기화 방식**: WebSocket + 상태 동기화
- **폼 상태 관리**: React Hook Form (Main Version만)

### C. 라우팅 전략
- **버전 선택 메커니즘**: URL 파라미터 기반
- **URL 구조 설계**: `/light/*`, `/main/*`
- **브라우저 히스토리 관리**: React Router v6
- **버전 간 상태 유지**: sessionStorage + 컨텍스트

### D. 컴포넌트 시스템 설계
- **shadcn/ui 컴포넌트**: 기본 UI 프리미티브
- **게임 전용 컴포넌트**: shadcn/ui 기반 커스텀 컴포넌트
- **애니메이션 컴포넌트**: Framer Motion 래퍼
- **폼 컴포넌트**: React Hook Form + Zod 통합

## 출력 요구사항
1. 상세한 폴더 구조도
2. 기술 스택 의존성 다이어그램
3. 컴포넌트 시스템 아키텍처
4. 상태 관리 플로우 차트
5. 버전 전환 시나리오
6. 패키지 의존성 목록
```

---

## Phase 1.5: 컴포넌트 데모 및 검증 단계 ⭐ **새로 추가**

### 🎨 Step 1.5.1: shadcn/ui 설치 및 기본 설정 프롬프트
```markdown
# shadcn/ui 설치 및 Main Version 기본 환경 구축

## 목표
Main Version 개발을 위한 Radix + shadcn/ui 환경을 구축하고 기본 컴포넌트를 설치합니다.

## 설치 작업
### A. 필수 패키지 설치
```bash
# shadcn/ui 및 의존성 설치
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-icons

# Framer Motion 설치
npm install framer-motion

# React Hook Form + Zod 설치
npm install react-hook-form @hookform/resolvers zod

# 추가 유틸리티
npm install date-fns @tanstack/react-table
```

### B. Tailwind CSS 설정
1. **tailwind.config.js 업데이트**
   - shadcn/ui 호환 설정
   - CSS variables 설정
   - dark mode 설정

2. **globals.css 설정**
   - shadcn/ui 기본 스타일
   - 커스텀 CSS variables
   - 게임 테마 색상 정의

### C. shadcn/ui 초기화
```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 기본 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
```

### D. 기본 유틸리티 설정
1. **lib/utils.ts 구성**
2. **lib/validations.ts 구성** (Zod 스키마)
3. **hooks 폴더 구성**
4. **constants 폴더 구성**

## 검증 조건
- shadcn/ui 컴포넌트가 정상 렌더링되어야 함
- Tailwind CSS가 올바르게 적용되어야 함
- 다크/라이트 테마 전환이 작동해야 함
```

### 🎮 Step 1.5.2: 게임 컴포넌트 데모 개발 프롬프트
```markdown
# 게임 핵심 컴포넌트 데모 개발

## 목표
실제 게임에서 사용될 핵심 컴포넌트들의 데모 버전을 개발하여 디자인과 UX를 검증합니다.

## 개발 대상 컴포넌트
### A. 기본 UI 컴포넌트 데모
1. **GameButton 컴포넌트**
   ```typescript
   interface GameButtonProps extends ButtonProps {
     variant: 'primary' | 'secondary' | 'danger' | 'ghost';
     size: 'sm' | 'md' | 'lg';
     animation?: 'pulse' | 'glow' | 'shake' | 'scale';
     loading?: boolean;
     icon?: React.ReactNode;
   }
   ```

2. **GameCard 컴포넌트**
   ```typescript
   interface GameCardProps {
     variant: 'player' | 'info' | 'action';
     interactive?: boolean;
     selected?: boolean;
     disabled?: boolean;
     children: React.ReactNode;
   }
   ```

3. **StatusIndicator 컴포넌트**
   ```typescript
   interface StatusIndicatorProps {
     status: 'online' | 'offline' | 'away' | 'playing';
     size?: 'sm' | 'md' | 'lg';
     showText?: boolean;
   }
   ```

### B. 게임 전용 컴포넌트 데모
1. **PlayerCard 데모**
   ```typescript
   interface PlayerCardProps {
     player: {
       id: number;
       nickname: string;
       role?: 'CITIZEN' | 'LIAR';
       isAlive: boolean;
       isCurrentTurn: boolean;
       votesReceived: number;
     };
     onVote?: (playerId: number) => void;
     disabled?: boolean;
     showRole?: boolean;
   }
   ```

2. **GamePhaseIndicator 데모**
   ```typescript
   interface GamePhaseIndicatorProps {
     currentPhase: GamePhase;
     phases: Array<{
       key: GamePhase;
       label: string;
       description: string;
     }>;
     timeRemaining?: number;
   }
   ```

3. **VotingPanel 데모**
   ```typescript
   interface VotingPanelProps {
     players: Player[];
     onVote: (targetId: number) => void;
     votedPlayerId?: number;
     disabled?: boolean;
     timeRemaining?: number;
   }
   ```

### C. 폼 컴포넌트 데모 (React Hook Form)
1. **CreateGameForm 데모**
   ```typescript
   const createGameSchema = z.object({
     gameParticipants: z.number().min(4).max(10),
     gameLiarCount: z.number().min(1).max(3),
     gameTotalRounds: z.number().min(1).max(10),
     gameMode: z.enum(['LIARS_KNOW', 'LIARS_DIFFERENT_WORD']),
     targetPoints: z.number().min(1).max(50),
   });
   ```

2. **ChatForm 데모**
3. **LoginForm 데모**

### D. 애니메이션 컴포넌트 데모 (Framer Motion)
1. **PageTransition 컴포넌트**
   ```typescript
   const pageVariants = {
     initial: { opacity: 0, x: -20 },
     animate: { opacity: 1, x: 0 },
     exit: { opacity: 0, x: 20 }
   };
   ```

2. **CardFlip 애니메이션**
3. **CountUp 애니메이션**
4. **Pulse 애니메이션**

## 데모 페이지 구성
### ComponentDemo 페이지
```typescript
// /main/demo 경로에 컴포넌트 데모 페이지 생성
- 모든 컴포넌트의 다양한 상태 시연
- 인터랙션 테스트 가능
- 애니메이션 효과 확인
- 반응형 동작 테스트
- 다크/라이트 테마 테스트
```

## 피드백 수집 방식
1. **시각적 검토**: 디자인 일관성, 브랜드 부합성
2. **UX 테스트**: 사용성, 직관성, 접근성
3. **성능 검토**: 애니메이션 부드러움, 반응 속도
4. **기술적 검토**: 코드 구조, 재사용성, 확장성

## 출력 요구사항
1. 컴포넌트별 데모 코드
2. Storybook 스타일 데모 페이지
3. 컴포넌트 API 문서
4. 사용 가이드라인
5. 피드백 수집 체크리스트
```

### 📝 Step 1.5.3: 컴포넌트 피드백 및 개선 프롬프트
```markdown
# 컴포넌트 데모 피드백 수집 및 개선

## 목표
개발된 컴포넌트 데모에 대한 종합적인 피드백을 수집하고 개선사항을 도출합니다.

## 피드백 영역
### A. 디자인 시스템 검토
1. **일관성 검사**
   - 색상 사용의 일관성
   - 간격(spacing) 시스템 적용
   - 타이포그래피 계층 구조
   - 모서리 반경(border radius) 일관성

2. **브랜드 정체성**
   - 라이어 게임 테마에 적합성
   - 게임적 요소 표현
   - 긴장감과 재미 요소 반영

3. **접근성 검증**
   - 색상 대비 비율 확인
   - 키보드 네비게이션 테스트
   - 스크린 리더 호환성
   - 터치 타겟 크기 적절성

### B. 사용자 경험 검토
1. **인터랙션 패턴**
   - 버튼 클릭 피드백의 적절성
   - 호버 상태의 명확성
   - 로딩 상태 표현의 직관성
   - 에러 상태 처리의 명확성

2. **애니메이션 품질**
   - 자연스러운 트랜지션
   - 성능에 미치는 영향
   - 게임 몰입도 향상 효과
   - 과도한 애니메이션 여부

3. **정보 전달력**
   - 게임 상태의 명확한 전달
   - 플레이어 상태 표시의 직관성
   - 액션 가능 요소의 명확성

### C. 기술적 품질 검토
1. **성능 평가**
   - 렌더링 성능 측정
   - 메모리 사용량 확인
   - 번들 크기 영향도
   - 모바일 디바이스 성능

2. **코드 품질**
   - 컴포넌트 재사용성
   - Props 인터페이스 설계
   - 타입 안전성
   - 테스트 가능성

3. **반응형 동작**
   - 다양한 화면 크기 대응
   - 터치 인터페이스 최적화
   - 모바일 UX 적합성

## 피드백 수집 방법
### A. 체크리스트 기반 검토
```markdown
## 컴포넌트별 검토 체크리스트

### PlayerCard 컴포넌트
- [ ] 플레이어 상태가 명확하게 구분되는가?
- [ ] 투표 대상으로 선택 가능함이 직관적인가?
- [ ] 역할 표시(라이어/시민)가 적절한가?
- [ ] 애니메이션이 게임 몰입도를 높이는가?

### VotingPanel 컴포넌트
- [ ] 투표 프로세스가 직관적인가?
- [ ] 시간 제한 표시가 명확한가?
- [ ] 선택 상태 피드백이 충분한가?
- [ ] 에러 처리가 사용자 친화적인가?

### GamePhaseIndicator 컴포넌트
- [ ] 현재 게임 단계가 명확한가?
- [ ] 다음 단계 예고가 도움이 되는가?
- [ ] 진행률 표시가 직관적인가?
- [ ] 시각적 계층 구조가 적절한가?
```

### B. 사용자 테스트 시나리오
1. **신규 사용자 관점**
   - 처음 보는 사용자도 직관적으로 사용 가능한가?
   - 게임 규칙을 모르는 상태에서도 UI가 도움이 되는가?

2. **숙련된 사용자 관점**
   - 빠른 액션이 가능한가?
   - 정보 밀도가 적절한가?
   - 반복 사용에도 피로감이 없는가?

## 개선 우선순위 설정
### 높은 우선순위 (즉시 수정)
- 게임 플레이를 방해하는 UX 문제
- 접근성 기준 미달 항목
- 심각한 성능 문제

### 중간 우선순위 (다음 이터레이션)
- 일관성 개선 사항
- 애니메이션 최적화
- 모바일 UX 개선

### 낮은 우선순위 (장기 개선)
- 시각적 완성도 향상
- 고급 인터랙션 추가
- 추가 애니메이션 효과

## 출력 요구사항
1. 컴포넌트별 피드백 리포트
2. 개선사항 우선순위 목록
3. 수정된 컴포넌트 스펙
4. 다음 단계 개발 가이드라인
5. 승인된 디자인 시스템 문서
```

---

## Phase 2: 기반 구조 구축 단계

### 🏗️ Step 2.1: 공통 모듈 분리 프롬프트 (업데이트)
```markdown
# 공통 모듈 추출 및 리팩토링

## 목표
기존 Mantine 기반 Light Version에서 재사용 가능한 공통 모듈을 추출하여 shared 폴더로 이동시키고, Main Version과 호환되도록 개선합니다.

## 작업 범위
### A. API 레이어 분리
1. **기존 API 호출 로직 추출**
   - `src/features/*/api/` → `src/shared/api/`
   - API 클라이언트 타입 정의 (Zod 스키마 적용)
   - 에러 핸들링 유틸리티

2. **WebSocket 연결 관리**
   - 연결 상태 관리 (Zustand)
   - 메시지 큐잉 시스템
   - 재연결 로직
   - Framer Motion과 연동된 연결 상태 애니메이션

### B. 상태 관리 분리
1. **게임 비즈니스 로직** (Zustand 스토어)
   - 게임 상태 스토어
   - 플레이어 관리 로직
   - 채팅 시스템 로직
   - 실시간 동기화 로직

2. **사용자 인증 로직**
   - 로그인/로그아웃 상태
   - 세션 관리
   - 권한 검증
   - 토큰 갱신 로직

### C. 유틸리티 함수 분리
1. **공통 헬퍼 함수**
   - 날짜/시간 처리 (date-fns 활용)
   - 문자열 변환
   - 유효성 검증 (Zod 스키마)
   - 애니메이션 유틸리티

2. **상수 및 설정**
   - API 엔드포인트
   - 게임 설정값
   - UI 상수 (spacing, colors 등)
   - 애니메이션 상수 (duration, easing)

### D. 폼 관련 공통 모듈 (신규 추가)
1. **React Hook Form 설정**
   - 공통 폼 컨텍스트
   - Zod resolver 설정
   - 에러 메시지 관리

2. **재사용 가능한 폼 필드**
   - GameInput 컴포넌트
   - GameSelect 컴포넌트
   - GameCheckbox 컴포넌트

## 호환성 유지 전략
### A. 점진적 마이그레이션
1. **별칭(alias) 활용**
   - 기존 import 경로 유지
   - 점진적으로 새 경로로 이동

2. **어댑터 패턴**
   - Mantine ↔ Radix 컴포넌트 간 어댑터
   - API 응답 포맷 통일

### B. 타입 안전성 강화
1. **공통 타입 정의**
   - 게임 관련 모든 타입 통합
   - Zod 스키마 기반 런타임 검증

2. **유틸리티 타입 활용**
   - 조건부 타입으로 버전별 분기
   - 제네릭 타입으로 재사용성 향상

## 실행 가이드라인
1. **기존 코드를 깨뜨리지 않는 점진적 이동**
2. **타입 안전성 유지 및 강화**
3. **테스트 케이스 보존 및 확장**
4. **의존성 순환 참조 방지**
5. **번들 크기 최적화**

## 검증 조건
- Light Version이 정상 동작해야 함
- 모든 기존 테스트가 통과해야 함
- 새로운 공통 모듈이 Main Version에서 정상 동작해야 함
- 번들 크기 증가 최소화 (10% 이내)
- 타입 에러 0개 달성
```

### 🔧 Step 2.2: 버전 관리 시스템 구축 프롬프트 (업데이트)
```markdown
# 버전 관리 시스템 구현

## 목표
Mantine 기반 Light Version과 Radix 기반 Main Version을 동적으로 전환할 수 있는 시스템을 구축합니다.

## 구현 요구사항
### A. 버전 선택 인터페이스
1. **초기 진입점 설계**
   ```typescript
   interface VersionSelectorProps {
     defaultVersion: 'light' | 'main';
     onVersionChange: (version: 'light' | 'main') => void;
     showDemo?: boolean; // 컴포넌트 데모 접근 옵션
   }
   
   // Main Version용 추가 옵션
   interface MainVersionOptions {
     theme: 'light' | 'dark' | 'system';
     animations: 'full' | 'reduced' | 'none';
     performance: 'high' | 'balanced' | 'battery';
   }
   ```

2. **사용자 설정 저장**
   - localStorage를 활용한 사용자 선호도 저장
   - 버전별 개별 설정 관리
   - Main Version 전용 설정 (테마, 애니메이션 등)

### B. 동적 로딩 시스템
1. **Code Splitting 구현**
   ```typescript
   // 버전별 lazy loading with error boundary
   const LightVersion = React.lazy(() => 
     import('../versions/light/App').catch(() => 
       import('../versions/light/ErrorFallback')
     )
   );
   
   const MainVersion = React.lazy(() => 
     import('../versions/main/App').catch(() => 
       import('../versions/main/ErrorFallback')
     )
   );
   
   // 컴포넌트 데모 페이지 (개발 중에만)
   const ComponentDemo = React.lazy(() => 
     import('../versions/main/demo/ComponentDemo')
   );
   ```

2. **로딩 상태 관리**
   - Framer Motion 기반 로딩 애니메이션
   - 진행률 표시 (Main Version)
   - 스켈레톤 UI (shadcn/ui)
   - 에러 상태 처리

### C. 상태 동기화
1. **버전 간 데이터 이전**
   - 게임 진행 상태 유지
   - 사용자 설정 동기화
   - 채팅 기록 보존
   - 폼 데이터 마이그레이션

2. **WebSocket 연결 관리**
   - 버전 전환 시 연결 유지
   - 메시지 손실 방지 큐잉
   - 상태 복구 메커니즘
   - 실시간 동기화 최적화

### D. 테마 및 설정 관리 (Main Version 전용)
1. **테마 시스템**
   ```typescript
   interface ThemeConfig {
     mode: 'light' | 'dark' | 'system';
     primaryColor: string;
     animations: boolean;
     reducedMotion: boolean;
   }
   ```

2. **성능 설정**
   ```typescript
   interface PerformanceConfig {
     animationQuality: 'high' | 'medium' | 'low';
     particleEffects: boolean;
     autoOptimize: boolean;
   }
   ```

## 기술적 고려사항
### A. 성능 최적화
1. **번들 분리 전략**
   - 버전별 청크 분리
   - 공통 모듈 별도 청크
   - 미사용 버전 코드 제거

2. **메모리 관리**
   - 사용하지 않는 버전 언로드
   - 메모리 누수 방지
   - 가비지 컬렉션 최적화

### B. 사용자 경험
1. **매끄러운 전환**
   - Framer Motion 페이지 전환
   - 상태 보존 애니메이션
   - 로딩 피드백 최적화

2. **오류 복구**
   - 버전 로딩 실패 시 fallback
   - 자동 재시도 로직
   - 사용자 친화적 에러 메시지

## 개발 도구 통합
### A. 개발 모드 기능
1. **컴포넌트 데모 접근**
   - `/main/demo` 경로로 접근
   - 개발 환경에서만 활성화
   - 실시간 컴포넌트 편집

2. **개발자 도구**
   - 버전 간 상태 비교
   - 성능 메트릭 표시
   - 디버깅 정보 패널

## 테스트 시나리오
1. **버전 전환 중 게임 진행 테스트**
2. **WebSocket 연결 안정성 테스트**
3. **브라우저 새로고침 시 상태 복구 테스트**
4. **다양한 디바이스에서 성능 테스트**
5. **테마 전환 및 설정 동기화 테스트**

## 출력 요구사항
1. 버전 관리 시스템 코드
2. 설정 관리 인터페이스
3. 전환 애니메이션 구현
4. 에러 처리 로직
5. 개발자 도구 (선택사항)
```

---

## Phase 3: Main Version UI 개발 단계

### 🎨 Step 3.1: 디자인 시스템 구축 프롬프트 (업데이트)
```markdown
# Main Version 디자인 시스템 구축

## 목표
shadcn/ui와 Radix UI를 기반으로 한 일관되고 확장 가능한 디자인 시스템을 구축합니다.

## 디자인 토큰 정의
### A. 색상 시스템 (shadcn/ui 기반)
1. **Primary 색상 팔레트**
   ```css
   :root {
     --background: 0 0% 100%;
     --foreground: 222.2 84% 4.9%;
     --card: 0 0% 100%;
     --card-foreground: 222.2 84% 4.9%;
     --popover: 0 0% 100%;
     --popover-foreground: 222.2 84% 4.9%;
     --primary: 221.2 83.2% 53.3%;
     --primary-foreground: 210 40% 98%;
     --secondary: 210 40% 96%;
     --secondary-foreground: 222.2 84% 4.9%;
     --muted: 210 40% 96%;
     --muted-foreground: 215.4 16.3% 46.9%;
     --accent: 210 40% 96%;
     --accent-foreground: 222.2 84% 4.9%;
     --destructive: 0 84.2% 60.2%;
     --destructive-foreground: 210 40% 98%;
     --border: 214.3 31.8% 91.4%;
     --input: 214.3 31.8% 91.4%;
     --ring: 221.2 83.2% 53.3%;
     --radius: 0.5rem;
   }
   ```

2. **게임 의미론적 색상**
   ```css
   /* 게임 상태별 색상 */
   --game-waiting: 43 96% 56%;      /* 대기 - 노란색 */
   --game-progress: 142 76% 36%;    /* 진행 - 초록색 */
   --game-ended: 346 87% 43%;       /* 종료 - 빨간색 */
   
   /* 플레이어 역할별 색상 */
   --role-citizen: 217 91% 60%;     /* 시민 - 파란색 */
   --role-liar: 0 84% 60%;          /* 라이어 - 빨간색 */
   
   /* 상호작용 상태 */
   --vote-active: 142 76% 36%;      /* 투표 가능 */
   --vote-disabled: 215 16% 47%;    /* 투표 불가 */
   --turn-active: 43 96% 56%;       /* 현재 턴 */
   ```

### B. 타이포그래피 시스템
1. **폰트 스케일** (Tailwind 기반)
   ```typescript
   const typography = {
     h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
     h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight',
     h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
     h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
     p: 'leading-7 [&:not(:first-child)]:mt-6',
     lead: 'text-xl text-muted-foreground',
     large: 'text-lg font-semibold',
     small: 'text-sm font-medium leading-none',
     muted: 'text-sm text-muted-foreground',
   };
   ```

### C. 간격 시스템 (Tailwind)
```typescript
const spacing = {
  xs: '0.25rem',    // 1
  sm: '0.5rem',     // 2
  md: '1rem',       // 4
  lg: '1.5rem',     // 6
  xl: '2rem',       // 8
  '2xl': '3rem',    // 12
  '3xl': '4rem',    // 16
};
```

### D. 컴포넌트 라이브러리
1. **기본 컴포넌트 확장**
   ```typescript
   // GameButton - shadcn/ui Button 확장
   interface GameButtonProps extends ButtonProps {
     variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'game-primary' | 'game-danger';
     animation?: 'none' | 'pulse' | 'glow' | 'shake' | 'scale' | 'bounce';
     particleEffect?: boolean;
   }
   
   // GameCard - shadcn/ui Card 확장
   interface GameCardProps extends CardProps {
     variant: 'default' | 'interactive' | 'player' | 'phase';
     glowEffect?: boolean;
     selected?: boolean;
   }
   ```

2. **게임 전용 컴포넌트**
   ```typescript
   // PlayerAvatar - Radix Avatar 기반
   interface PlayerAvatarProps {
     player: Player;
     size: 'sm' | 'md' | 'lg' | 'xl';
     showStatus?: boolean;
     interactive?: boolean;
   }
   
   // PhaseProgressBar - Progress 기반
   interface PhaseProgressBarProps {
     currentPhase: GamePhase;
     timeRemaining?: number;
     totalTime?: number;
     animated?: boolean;
   }
   ```

## 애니메이션 시스템 (Framer Motion)
### A. 애니메이션 프리셋
```typescript
export const animations = {
  // 페이지 전환
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  
  // 카드 등장
  cardAppear: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  // 버튼 클릭
  buttonTap: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 }
  },
  
  // 투표 효과
  voteEffect: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 0.3 }
  }
};
```

### B. 게임 특화 애니메이션
```typescript
// 플레이어 턴 애니메이션
export const turnHighlight = {
  animate: {
    boxShadow: [
      '0 0 0 rgba(59, 130, 246, 0)',
      '0 0 20px rgba(59, 130, 246, 0.5)',
      '0 0 0 rgba(59, 130, 246, 0)'
    ]
  },
  transition: { duration: 2, repeat: Infinity }
};

// 게임 종료 애니메이션
export const gameEndEffect = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: { type: 'spring', damping: 10 }
};
```

## 반응형 시스템
### A. 브레이크포인트 (Tailwind)
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
```

### B. 컴포넌트 반응형 패턴
```typescript
// 반응형 PlayerCard 레이아웃
const playerCardClasses = cn(
  'grid gap-4',
  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
);
```

## 테마 시스템
### A. 다크 모드 지원
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... 다크 모드 색상 정의 */
}
```

### B. 게임 테마 변형
```typescript
export const gameThemes = {
  classic: 'classic theme colors',
  neon: 'neon cyberpunk colors',
  minimal: 'minimal monochrome colors'
} as const;
```

## 성능 고려사항
1. **CSS-in-JS 최적화**: emotion/styled-components 대신 Tailwind 사용
2. **애니메이션 최적화**: transform과 opacity 위주 사용
3. **번들 크기**: 사용하지 않는 Radix 컴포넌트 tree-shaking
4. **메모이제이션**: 복잡한 계산이 필요한 스타일 캐싱

## 출력 요구사항
1. 완성된 디자인 토큰 정의
2. 확장된 shadcn/ui 컴포넌트들
3. Framer Motion 애니메이션 통합
4. 접근성 가이드라인 준수
5. 성능 최적화 적용
6. 포괄적인 테스트 코드
```

### 🎮 Step 3.2: 게임 UI 컴포넌트 개발 프롬프트 (업데이트)
```markdown
# 게임 핵심 UI 컴포넌트 개발

## 목표
shadcn/ui와 Framer Motion을 활용하여 라이어 게임의 핵심 컴포넌트를 개발합니다.

## 개발 대상 컴포넌트
### A. 게임보드 (GameBoard)
1. **플레이어 배치 시스템**
   ```typescript
   interface GameBoardProps {
     players: Player[];
     currentTurn: number;
     gamePhase: GamePhase;
     layout: 'circle' | 'grid' | 'linear';
     onPlayerClick?: (player: Player) => void;
   }
   
   // Framer Motion을 활용한 동적 레이아웃
   const layoutVariants = {
     circle: { /* 원형 배치 애니메이션 */ },
     grid: { /* 그리드 배치 애니메이션 */ },
     linear: { /* 선형 배치 애니메이션 */ }
   };
   ```

2. **레이아웃 애니메이션**
   - 플레이어 수 변화에 따른 자동 재배치
   - 부드러운 위치 전환 (layout 애니메이션)
   - 화면 크기 변화 대응

### B. 플레이어 카드 (PlayerCard) - Radix + shadcn/ui 기반
1. **컴포넌트 구조**
   ```typescript
   interface PlayerCardProps {
     player: Player;
     variant: 'compact' | 'detailed' | 'voting';
     interactive?: boolean;
     selected?: boolean;
     disabled?: boolean;
     showHint?: boolean;
     onVote?: () => void;
     onViewDetails?: () => void;
   }
   ```

2. **상태 표시 시스템**
   - Badge 컴포넌트로 역할 표시
   - Avatar 컴포넌트로 프로필 표시
   - Progress 컴포넌트로 투표 수 표시
   - 생존/사망 상태 시각화

3. **인터랙티브 요소**
   ```typescript
   // Radix Tooltip 활용
   <Tooltip>
     <TooltipTrigger asChild>
       <motion.div whileHover="hover" whileTap="tap">
         <Card className={cn(cardVariants({ variant, selected }))}>
           {/* 카드 내용 */}
         </Card>
       </motion.div>
     </TooltipTrigger>
     <TooltipContent>플레이어 상세 정보</TooltipContent>
   </Tooltip>
   ```

### C. 게임 진행 표시기 (GamePhaseIndicator)
1. **단계별 진행도** (shadcn/ui Progress + Steps)
   ```typescript
   interface GamePhaseIndicatorProps {
     currentPhase: GamePhase;
     phases: PhaseConfig[];
     timeRemaining?: number;
     onPhaseClick?: (phase: GamePhase) => void;
   }
   ```

2. **시각적 요소**
   - Stepper 컴포넌트로 단계 표시
   - Progress 컴포넌트로 타이머 표시
   - Badge로 현재 단계 하이라이트

### D. 채팅 시스템 (ChatSystem) - Radix 기반
1. **메시지 컴포넌트**
   ```typescript
   interface ChatMessageProps {
     message: ChatMessage;
     variant: 'incoming' | 'outgoing' | 'system';
     animated?: boolean;
   }
   
   // Framer Motion 메시지 애니메이션
   const messageVariants = {
     initial: { opacity: 0, y: 20, scale: 0.8 },
     animate: { opacity: 1, y: 0, scale: 1 },
     exit: { opacity: 0, scale: 0.8 }
   };
   ```

2. **실시간 기능**
   - ScrollArea 컴포넌트로 스크롤 최적화
   - 타이핑 인디케이터 (애니메이션)
   - 메시지 전송 상태 표시

### E. 투표 패널 (VotingPanel) - React Hook Form 통합
1. **폼 구조**
   ```typescript
   const votingSchema = z.object({
     targetPlayerId: z.number(),
     confidence: z.number().min(1).max(5).optional()
   });
   
   interface VotingPanelProps {
     players: Player[];
     onSubmit: (data: VotingFormData) => Promise<void>;
     timeRemaining?: number;
     disabled?: boolean;
   }
   ```

2. **shadcn/ui 폼 컴포넌트 활용**
   ```typescript
   <Form {...form}>
     <form onSubmit={form.handleSubmit(onSubmit)}>
       <FormField
         control={form.control}
         name="targetPlayerId"
         render={({ field }) => (
           <FormItem>
             <FormLabel>투표할 플레이어 선택</FormLabel>
             <FormControl>
               <RadioGroup {...field}>
                 {players.map(player => (
                   <motion.div key={player.id} whileHover={{ scale: 1.02 }}>
                     <RadioGroupItem value={player.id.toString()}>
                       {player.nickname}
                     </RadioGroupItem>
                   </motion.div>
                 ))}
               </RadioGroup>
             </FormControl>
           </FormItem>
         )}
       />
     </form>
   </Form>
   ```

## 고급 기능
### A. 실시간 시각 효과 (Framer Motion)
1. **액션 피드백**
   ```typescript
   // 투표 시 파티클 효과
   const voteParticleEffect = {
     initial: { scale: 0 },
     animate: { scale: [0, 1.2, 0], opacity: [0, 1, 0] },
     transition: { duration: 0.6 }
   };
   
   // 힌트 제공 시 글로우 효과
   const hintGlowEffect = {
     animate: {
       boxShadow: [
         '0 0 0 rgba(34, 197, 94, 0)',
         '0 0 20px rgba(34, 197, 94, 0.5)',
         '0 0 0 rgba(34, 197, 94, 0)'
       ]
     }
   };
   ```

2. **게임 종료 애니메이션**
   ```typescript
   const gameEndAnimation = {
     winner: {
       initial: { scale: 0, rotate: -180 },
       animate: { scale: 1, rotate: 0 },
       transition: { type: 'spring', damping: 10, stiffness: 100 }
     },
     loser: {
       initial: { opacity: 1 },
       animate: { opacity: 0.5, scale: 0.95 },
       transition: { duration: 0.5 }
     }
   };
   ```

### B. 접근성 고려사항 (Radix UI 내장)
1. **키보드 네비게이션**
   - Radix의 roving tabindex 활용
   - 커스텀 키보드 단축키

2. **스크린 리더 지원**
   - 적절한 ARIA 라벨
   - 상태 변화 공지
   - 의미론적 HTML 구조

3. **모션 감소 옵션**
   ```typescript
   const prefersReducedMotion = useReducedMotion();
   const animationProps = prefersReducedMotion 
     ? { initial: false, animate: false }
     : animations.cardAppear;
   ```

## 성능 최적화
### A. 가상화 (Virtual Scrolling)
```typescript
// react-window를 사용한 채팅 메시지 가상화
import { FixedSizeList as List } from 'react-window';

const ChatMessageList = ({ messages }) => (
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

### B. 메모이제이션 전략
```typescript
// 복잡한 계산이 필요한 컴포넌트 최적화
const PlayerCard = memo(({ player, ...props }) => {
  const playerStats = useMemo(() => 
    calculatePlayerStats(player), [player.id, player.score]
  );
  
  return (
    <motion.div {...animationProps}>
      {/* 컴포넌트 내용 */}
    </motion.div>
  );
});
```

## 테스트 전략
### A. 컴포넌트 테스트
```typescript
// Jest + Testing Library + Framer Motion
describe('PlayerCard', () => {
  it('should animate on mount', async () => {
    render(<PlayerCard player={mockPlayer} />);
    
    // 애니메이션 완료 대기
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveStyle('opacity: 1');
    });
  });
});
```

### B. 접근성 테스트
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<VotingPanel players={mockPlayers} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 출력 요구사항
1. 완성된 게임 컴포넌트 라이브러리
2. Framer Motion 애니메이션 통합
3. React Hook Form 폼 컴포넌트
4. 접근성 가이드라인 준수
5. 성능 최적화 적용
6. 포괄적인 테스트 코드
````

