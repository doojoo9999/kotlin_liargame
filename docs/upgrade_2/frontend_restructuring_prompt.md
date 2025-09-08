# 프론트엔드 네비게이션 구조 리팩토링 가이드

## 개요

이 가이드는 프론트엔드 애플리케이션의 네비게이션 플로우를 재구성하여 더 깔끔하고 직관적인 사용자 경험을 구현하고, 간소화된 인증과 적절한 게임 플로우 관리를 위한 가이드입니다.

## 현재 상태 분석

### 기존 네비게이션 구조
현재 코드베이스 분석 결과 (`frontend/src/lib/router.tsx`):

```
/ → /main (리다이렉트)
/main → MainHomePage (게임 브라우저/대시보드)
/main/login → MainLoginPage (닉네임 전용 인증)
/main/lobby/:sessionCode? → MainLobbyPage (게임 로비)
/main/game/:gameId → MainGamePage (활성 게임)
/main/results/:gameId → MainResultsPage (게임 결과)
```

### 현재 문제점
1. **혼란스러운 진입점**: 메인 페이지가 로그인 대신 게임 브라우저를 보여줌
2. **복잡한 네비게이션**: 사용자가 로그인을 우회하고 게임 브라우저에 접근 가능
3. **플로우 통합 부족**: 게임 종료 후 로비로 돌아가거나 재시작하는 명확한 경로 없음
4. **로비 관리 기능**: 제한적인 주제/답안 관리 기능

## 목표 네비게이션 구조

### 새로운 플로우 요구사항
```
진입점: 로그인 페이지 (/)
↓ (닉네임만 사용, Admin 으로 로그인 시 패스워드가 필요하므로 별개의 비밀번호 입력 페이지 or 모달 필요)
로비 페이지 (/lobby)
↓ (게임 참여/생성)
게임룸 (/game/:gameId) 
↓ (게임 완료)
게임 결과 (/results/:gameId)
↓ (사용자 선택)
├── 한판 더 → 게임룸으로 돌아가기
└── 게임 나가기 → 로비로 돌아가기
```

### 필요한 주요 변경사항

1. **라우트 구조 재구성**
   - 로그인을 기본 라우트(`/`)로 설정
   - 로비를 `/lobby`로 이동 (세션 코드 복잡성 제거)
   - 게임 및 결과 라우팅 단순화
   - 혼란스러운 `/main` 접두사 제거

2. **인증 플로우 단순화**
   - 닉네임 전용 인증 (패스워드 필드 없음)
   - 인증 상태 적절히 저장
   - 적절한 라우트 가드 구현

3. **로비 기능 향상**
   - 주제 추가 기능 추가
   - 답안 추가 기능 추가
   - 게임 생성/참여 플로우 개선

## 구현 단계

### 1단계: 라우트 구조 리팩토링

**파일: `frontend/src/lib/router.tsx`**

```typescript
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <LoginPage />, // 로그인을 진입점으로 설정
      },
      {
        path: "lobby",
        element: <ProtectedRoute><LobbyPage /></ProtectedRoute>,
      },
      {
        path: "game/:gameId",
        element: <ProtectedRoute><GamePage /></ProtectedRoute>,
      },
      {
        path: "results/:gameId",
        element: <ProtectedRoute><ResultsPage /></ProtectedRoute>,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])
```

### 2단계: 인증 시스템 업데이트

**생성: `frontend/src/components/auth/ProtectedRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}
```

**생성: `frontend/src/stores/authStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  nickname: string | null
  isAuthenticated: boolean
  login: (nickname: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      nickname: null,
      isAuthenticated: false,
      login: (nickname) => set({ nickname, isAuthenticated: true }),
      logout: () => set({ nickname: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

### 3단계: 로그인 페이지 단순화

**업데이트: `frontend/src/versions/main/pages/LoginPage.tsx`**

복잡성 제거:
- 로그인에서 게임 참여 로직 제거
- 닉네임 인증에만 집중
- 성공적인 로그인 후 로비로 리다이렉트
- 패스워드 필드 완전 제거

주요 변경사항:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!nickname.trim()) {
    toast({
      title: "닉네임이 필요합니다",
      description: "계속하려면 닉네임을 입력해주세요",
      variant: "destructive",
    })
    return
  }

  try {
    // 닉네임만으로 간단한 인증
    await loginMutation.mutateAsync({ 
      nickname: nickname.trim() 
    })
    
    // 인증 상태 저장
    useAuthStore.getState().login(nickname.trim())
    
    // 항상 로비로 리다이렉트
    navigate('/lobby')
    
    toast({
      title: "환영합니다!",
      description: `${nickname}님으로 로그인되었습니다`,
    })
  } catch (error: any) {
    toast({
      title: "로그인 실패",
      description: error.message,
      variant: "destructive",
    })
  }
}
```

### 4단계: 로비 페이지 기능 향상

**업데이트: `frontend/src/versions/main/pages/LobbyPage.tsx`**

새로운 기능 추가:
1. **주제 관리 섹션**
   - 기존 주제 보기
   - 새 주제 추가
   - 주제 편집/삭제 (권한이 있는 경우)

2. **답안 관리 섹션**  
   - 주제별 기존 답안 보기
   - 주제에 새 답안 추가
   - 답안 풀 관리

3. **게임 관리**
   - 새 게임룸 생성
   - 기존 게임 참여
   - 활성 게임 보기

구조 예시:
```typescript
export function LobbyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <WelcomeHeader />
      
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">게임룸</TabsTrigger>
          <TabsTrigger value="topics">주제 관리</TabsTrigger>
          <TabsTrigger value="answers">답안 관리</TabsTrigger>
        </TabsList>
        
        <TabsContent value="games">
          <GameRoomsSection />
        </TabsContent>
        
        <TabsContent value="topics">
          <TopicManagementSection />
        </TabsContent>
        
        <TabsContent value="answers">
          <AnswerManagementSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 5단계: 게임 결과 페이지 업데이트

**업데이트: `frontend/src/versions/main/pages/ResultsPage.tsx`**

재시작 기능 추가:
```typescript
const GameEndActions = () => {
  const navigate = useNavigate()
  
  return (
    <div className="flex gap-4 justify-center mt-6">
      <Button 
        variant="default"
        onClick={() => navigate(`/game/${gameId}`)} // 같은 게임으로 돌아가기
      >
        한판 더
      </Button>
      
      <Button 
        variant="outline"
        onClick={() => navigate('/lobby')} // 로비로 돌아가기
      >
        로비로 돌아가기
      </Button>
    </div>
  )
}
```

### 6단계: 컴포넌트 생성

**생성: `frontend/src/components/lobby/TopicManagementSection.tsx`**
- 주제 CRUD 작업
- 주제 카테고리 관리
- 주제 검증

**생성: `frontend/src/components/lobby/AnswerManagementSection.tsx`**
- 각 주제별 답안 CRUD
- 답안 검증 및 중복 방지
- 답안 일괄 가져오기

**생성: `frontend/src/components/lobby/GameRoomsSection.tsx`**
- 룸 생성 폼
- 사용 가능한 룸 목록
- 룸 참여 기능

### 7단계: 상태 관리 업데이트

**업데이트: `frontend/src/hooks/useGameQueries.ts`**

새로운 훅 추가:
```typescript
// 주제 관리
export const useTopics = () => { /* ... */ }
export const useCreateTopic = () => { /* ... */ }
export const useUpdateTopic = () => { /* ... */ }
export const useDeleteTopic = () => { /* ... */ }

// 답안 관리  
export const useAnswers = (topicId?: string) => { /* ... */ }
export const useCreateAnswer = () => { /* ... */ }
export const useDeleteAnswer = () => { /* ... */ }
```

### 8단계: 네비게이션 가드 업데이트

**라우트 가드 업데이트:**
```typescript
export const useAuthGuard = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  return isAuthenticated
}

export const useGameGuard = (gameId?: string) => {
  const isAuthenticated = useAuthGuard()
  // 게임별 추가 검증
  return isAuthenticated && !!gameId
}
```

### 9단계: 사용하지 않는 컴포넌트 제거

**업데이트/제거할 파일들:**
- `MainHomePage.tsx` 제거 또는 리팩토링 (게임 브라우저 기능이 로비로 이동)
- 제거된 라우트를 가져오는 컴포넌트들 업데이트
- 사용하지 않는 라우트 매개변수 정리

### 10단계: 테스트 및 검증

**테스트 케이스:**
1. **인증 플로우**
   - 유효한 닉네임으로 로그인
   - 로그인 검증 (빈 닉네임)
   - 인증 지속성
   - 라우트 보호

2. **네비게이션 플로우**
   - 로그인 → 로비 → 게임 → 결과 → (한판더 | 로비로)
   - 직접 URL 접근 보호
   - 적절한 리다이렉트

3. **로비 기능**
   - 주제 관리 (생성, 읽기, 업데이트, 삭제)
   - 답안 관리 (생성, 읽기, 삭제)
   - 게임룸 관리

4. **게임 플로우**
   - 게임 완료 → 결과 페이지
   - 한판 더 기능  
   - 로비로 돌아가기 기능

## 구현 참고사항

### 설계 고려사항
1. **사용자 경험**: 단순화된 플로우로 혼란 감소
2. **상태 관리**: 지속성을 가진 중앙화된 인증 상태
3. **라우트 보호**: 적절한 가드로 무단 접근 방지
4. **데이터 관리**: 효율적인 주제/답안 CRUD 작업

### 기술적 고려사항
1. **성능**: 로비 관리 컴포넌트 지연 로딩
2. **접근성**: 모든 상호작용 요소에 적절한 ARIA 레이블
3. **오류 처리**: 포괄적인 오류 경계 및 사용자 피드백
4. **모바일 반응형**: 모든 새 컴포넌트가 모바일에서 작동하도록 보장

### 보안 고려사항
1. **입력 검증**: 모든 주제/답안 입력 살균화
2. **인증**: 안전한 토큰 저장 및 검증
3. **권한**: 관리 기능에 대한 적절한 권한 확인

## 테스트 전략

### 단위 테스트
- 인증 스토어
- 라우트 가드
- 폼 검증
- CRUD 작업

### 통합 테스트  
- 완전한 네비게이션 플로우
- 인증 지속성
- 게임 상태 전환

### E2E 테스트
- 로그인부터 게임 완료까지 전체 사용자 여정
- 주제/답안 관리 워크플로우
- 다중 사용자 게임 시나리오

## 성공 기준

✅ **네비게이션 플로우**
- 사용자가 로그인 페이지에서 시작
- 닉네임 전용 인증 작동
- 로그인 후 로비로 적절한 리다이렉트
- 게임 플로우: 로비 → 게임 → 결과 → (재시작 | 로비)

✅ **로비 기능**  
- 주제 관리 (추가/편집/삭제)
- 답안 관리 (주제별 추가/삭제)
- 게임룸 생성 및 참여

✅ **인증**
- 닉네임 전용 로그인
- 세션 지속성
- 라우트 보호
- 적절한 로그아웃 기능

✅ **사용자 경험**
- 직관적인 네비게이션
- 명확한 사용자 피드백
- 모바일 반응형 디자인
- 접근성 준수

## 구현 후 작업

1. **성능 최적화**
   - 번들 크기 분석
   - 지연 로딩 구현
   - API 호출 최적화

2. **문서 업데이트**
   - 새로운 플로우로 README 업데이트
   - 새 컴포넌트 문서화
   - API 문서 업데이트

3. **모니터링 설정**
   - 사용자 여정 분석
   - 오류 추적
   - 성능 모니터링

이 리팩토링을 통해 기존 기능을 모두 유지하면서 요청된 로비 관리 기능을 추가하여 훨씬 더 깔끔하고 직관적인 사용자 경험을 만들 수 있습니다.