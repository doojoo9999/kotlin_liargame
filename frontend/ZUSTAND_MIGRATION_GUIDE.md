# Zustand Migration Guide

## 개요

이 가이드는 기존 GameContext.jsx에서 Zustand 기반 상태 관리로 마이그레이션하는 방법을 설명합니다.

## 마이그레이션 완료된 구조

### 새로운 스토어 구조

```
src/stores/
├── authStore.js          # 인증 관련 상태 및 액션
├── roomStore.js          # 방 관리 관련 상태 및 액션
├── socketStore.js        # WebSocket 및 채팅 관련 상태 및 액션
├── gameStore.js          # 게임 로직 관련 상태 및 액션
├── subjectStore.js       # 주제 관리 관련 상태 및 액션
├── useGame.js           # 통합 훅 (기존 useGame과 동일한 API)
└── devtools.js          # 개발 도구 및 디버깅 유틸리티
```

## 주요 개선사항

### 1. 성능 최적화
- **선택적 구독**: 컴포넌트가 필요한 상태만 구독
- **불필요한 리렌더링 방지**: 상태 변경 시 관련 컴포넌트만 업데이트
- **메모이제이션**: 복잡한 계산 결과 캐싱

### 2. 코드 구조 개선
- **관심사 분리**: 각 도메인별로 스토어 분리
- **타입 안전성**: 더 나은 TypeScript 지원 (필요시)
- **테스트 용이성**: 각 스토어를 독립적으로 테스트 가능

### 3. 개발자 경험 향상
- **Redux DevTools 지원**: 상태 변화 추적 및 디버깅
- **성능 모니터링**: 액션 실행 시간 추적
- **액션 추적**: 호출 빈도 모니터링

## 컴포넌트 마이그레이션 예시

### Before (GameContext 사용)

```jsx
import React from 'react'
import { useGame } from '../context/GameContext'

const LoginComponent = () => {
  const {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  } = useGame()

  const handleLogin = async (nickname) => {
    try {
      await login(nickname)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (loading.auth) {
    return <div>로그인 중...</div>
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {currentUser.nickname}님!</p>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <div>
          {error.auth && <p>오류: {error.auth}</p>}
          <button onClick={() => handleLogin('testUser')}>
            로그인
          </button>
        </div>
      )}
    </div>
  )
}
```

### After (Zustand 사용)

#### 옵션 1: 통합 훅 사용 (기존과 동일한 API)

```jsx
import React from 'react'
import { useGame } from '../stores/useGame'

const LoginComponent = () => {
  const {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  } = useGame()

  const handleLogin = async (nickname) => {
    try {
      await login(nickname)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (loading.auth) {
    return <div>로그인 중...</div>
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {currentUser.nickname}님!</p>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <div>
          {error.auth && <p>오류: {error.auth}</p>}
          <button onClick={() => handleLogin('testUser')}>
            로그인
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 옵션 2: 개별 스토어 사용 (성능 최적화)

```jsx
import React from 'react'
import { useAuth } from '../stores/useGame'

const LoginComponent = () => {
  const {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  } = useAuth()

  const handleLogin = async (nickname) => {
    try {
      await login(nickname)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (loading) {
    return <div>로그인 중...</div>
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {currentUser.nickname}님!</p>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <div>
          {error && <p>오류: {error}</p>}
          <button onClick={() => handleLogin('testUser')}>
            로그인
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 옵션 3: 선택적 구독 (최고 성능)

```jsx
import React from 'react'
import useAuthStore from '../stores/authStore'

const LoginComponent = () => {
  // 필요한 상태만 선택적으로 구독
  const currentUser = useAuthStore(state => state.currentUser)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const loading = useAuthStore(state => state.loading)
  const error = useAuthStore(state => state.error)
  const login = useAuthStore(state => state.login)
  const logout = useAuthStore(state => state.logout)

  const handleLogin = async (nickname) => {
    try {
      await login(nickname)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (loading) {
    return <div>로그인 중...</div>
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {currentUser.nickname}님!</p>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <div>
          {error && <p>오류: {error}</p>}
          <button onClick={() => handleLogin('testUser')}>
            로그인
          </button>
        </div>
      )}
    </div>
  )
}
```

## 단계별 마이그레이션 전략

### 1단계: 점진적 마이그레이션 준비
- ✅ Zustand 설치 완료
- ✅ 모든 스토어 구현 완료
- ✅ 통합 훅 구현 완료

### 2단계: 컴포넌트별 마이그레이션
1. **인증 관련 컴포넌트부터 시작**
   - LoginForm, UserProfile 등
   - `useAuth()` 훅 사용

2. **방 관리 컴포넌트**
   - RoomList, CreateRoom, JoinRoom 등
   - `useRoom()` 훅 사용

3. **채팅 및 WebSocket 컴포넌트**
   - ChatWindow, PlayerList 등
   - `useSocket()` 훅 사용

4. **게임 로직 컴포넌트**
   - GameBoard, VotingPanel 등
   - `useGameLogic()` 훅 사용

5. **주제 관리 컴포넌트**
   - SubjectList, AddSubject 등
   - `useSubjects()` 훅 사용

### 3단계: GameContext 제거
```jsx
// App.jsx에서 GameProvider 제거
// Before
import { GameProvider } from './context/GameContext'

function App() {
  return (
    <GameProvider>
      <Router>
        {/* 앱 컴포넌트들 */}
      </Router>
    </GameProvider>
  )
}

// After
import { Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      {/* 앱 컴포넌트들 */}
    </Router>
  )
}
```

## 사용 가능한 훅들

### 통합 훅
- `useGame()`: 모든 상태와 액션에 접근 (기존 API와 동일)

### 개별 스토어 훅
- `useAuth()`: 인증 관련 상태 및 액션
- `useRoom()`: 방 관리 관련 상태 및 액션
- `useSocket()`: WebSocket 및 채팅 관련 상태 및 액션
- `useGameLogic()`: 게임 로직 관련 상태 및 액션
- `useSubjects()`: 주제 관리 관련 상태 및 액션

### 유틸리티 훅
- `useLoading()`: 모든 로딩 상태 통합 조회
- `useErrors()`: 모든 에러 상태 통합 조회

## 개발 도구 사용법

### Redux DevTools 활성화
개발 환경에서 자동으로 활성화됩니다. 브라우저의 Redux DevTools 확장에서 상태 변화를 추적할 수 있습니다.

### 성능 모니터링
```javascript
// 콘솔에서 액션 통계 확인
import { devUtils } from './stores/devtools'

// 액션 호출 통계 출력
devUtils.logActionStats()

// 액션 추적 리셋
devUtils.resetActionTracker()

// 특정 스토어의 디버그 상태 확인
devUtils.getDebugState('auth')
```

### 디버깅 팁
1. **상태 변화 추적**: Redux DevTools에서 액션별 상태 변화 확인
2. **성능 분석**: 콘솔에서 액션 실행 시간 확인
3. **메모리 사용량**: 불필요한 구독이 없는지 확인

## 주의사항

### 1. 순환 의존성 방지
스토어 간 직접 import 대신 동적 import 사용:
```javascript
// ❌ 순환 의존성 위험
import useGameStore from './gameStore'

// ✅ 동적 import 사용
import('./gameStore').then(({ default: gameStore }) => {
  gameStore.getState().handleUpdate(data)
})
```

### 2. 메모리 누수 방지
컴포넌트 언마운트 시 구독 정리는 Zustand가 자동으로 처리하지만, 수동 구독의 경우 정리 필요:
```javascript
useEffect(() => {
  const unsubscribe = useAuthStore.subscribe(
    state => state.isAuthenticated,
    (isAuthenticated) => {
      // 처리 로직
    }
  )
  
  return unsubscribe // 정리 함수 반환
}, [])
```

### 3. 상태 초기화
로그아웃 시 모든 스토어가 자동으로 초기화되지만, 필요시 수동 초기화:
```javascript
// 모든 스토어 초기화
useAuthStore.getState().reset()
useRoomStore.getState().reset()
useSocketStore.getState().reset()
useGameStore.getState().reset()
useSubjectStore.getState().reset()
```

## 마이그레이션 체크리스트

- [ ] 모든 컴포넌트에서 `useGame` import 경로 변경
- [ ] GameProvider 제거
- [ ] GameContext.jsx 파일 제거 또는 백업
- [ ] 개발 도구 설정 확인
- [ ] 모든 기능 테스트
- [ ] 성능 측정 및 최적화

## 문제 해결

### 자주 발생하는 문제

1. **상태가 업데이트되지 않음**
   - 올바른 훅을 사용하고 있는지 확인
   - 상태 구독이 제대로 되어 있는지 확인

2. **성능 문제**
   - 불필요한 전체 상태 구독 대신 선택적 구독 사용
   - useMemo, useCallback 적절히 활용

3. **WebSocket 연결 문제**
   - 스토어 간 의존성 확인
   - 연결 순서 및 타이밍 확인

## 결론

Zustand 마이그레이션을 통해 다음과 같은 이점을 얻을 수 있습니다:

- **성능 향상**: 선택적 구독으로 불필요한 리렌더링 방지
- **코드 품질**: 관심사 분리로 유지보수성 향상
- **개발 경험**: 강력한 디버깅 도구와 개발 유틸리티
- **확장성**: 새로운 기능 추가 시 독립적인 스토어 생성 가능

마이그레이션 과정에서 문제가 발생하면 기존 GameContext와 병행 운영하면서 점진적으로 전환할 수 있습니다.