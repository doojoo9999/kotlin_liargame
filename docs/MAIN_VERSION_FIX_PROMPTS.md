# Main Version 수정 작업 프롬프트 모음

> **사용법**: 아래 프롬프트들을 순서대로 실행하여 Main Version의 모든 이슈를 해결합니다.  
> **소요시간**: 총 약 9시간 (단계별 분할 가능)

---

## 🚀 **1단계: 긴급 수정 작업 (우선순위 1)**

### 1-1. 컴포넌트 Export/Import 수정

```
Main Version의 컴포넌트 export/import 오류를 수정해주세요:

1. **Button 컴포넌트 export 수정**:
   - `src/versions/main/components/ui/button.tsx` 파일에서 Button 컴포넌트가 제대로 export되지 않는 문제 수정
   - 파일 끝에 올바른 export 구문 추가

2. **Import 오류 수정**:
   - `src/versions/main/demo/SimpleComponentDemo.tsx`에서 Button import 실패 해결
   - `src/versions/main/pages/ComponentDemoPage.tsx`에서 다중 컴포넌트 import 실패 해결

3. **검증**:
   - 수정 후 해당 파일들에서 컴포넌트가 정상적으로 import되는지 확인
   - TypeScript 오류가 해결되었는지 확인

이 작업을 완료한 후 다음 단계로 넘어가겠습니다.
```

### 1-2. 경로 매핑 및 설정 수정

```
Main Version의 경로 매핑과 기본 설정을 수정해주세요:

1. **vite.config.ts 수정**:
   - '@/' 경로 alias 설정 추가
   - Node.js 모듈 (path, __dirname) 타입 정의 추가
   - 올바른 resolve.alias 설정 구성

2. **tsconfig.json 수정**:
   - paths 매핑 설정 추가 ("@/*": ["./src/*"])
   - Node.js 타입 정의 추가

3. **검증**:
   - `npm run type-check`에서 경로 관련 오류 해결 확인
   - '@/' 경로로 import하는 파일들이 정상 동작하는지 확인

이 작업을 완료한 후 다음 단계로 진행하겠습니다.
```

### 1-3. 누락된 페이지 컴포넌트 생성

```
Main Version에서 누락된 핵심 페이지 컴포넌트들을 생성해주세요:

1. **MainLobbyPage 생성**:
   - `src/versions/main/pages/MainLobbyPage.tsx` 파일 생성
   - 기존 LobbyPage를 참고하여 Main Version 스타일로 구현
   - shadcn/ui 컴포넌트와 Framer Motion 활용

2. **MainGameRoomPage 생성**:
   - `src/versions/main/pages/MainGameRoomPage.tsx` 파일 생성
   - 게임방 UI를 Main Version 디자인으로 구현

3. **MainGamePlayPage 생성**:
   - `src/versions/main/pages/MainGamePlayPage.tsx` 파일 생성
   - 게임 플레이 화면을 Main Version으로 구현

4. **GameComponentsDemo 생성**:
   - `src/features/demo/GameComponentsDemo.tsx` 파일 생성
   - 게임 컴포넌트들의 데모 페이지 구현

5. **검증**:
   - 모든 페이지가 정상적으로 import되는지 확인
   - 기본적인 렌더링이 동작하는지 확인

이 작업을 완료한 후 2단계로 진행하겠습니다.
```

---

## ⚡ **2단계: 타입 안전성 개선 (우선순위 2)**

### 2-1. TypeScript Import 규칙 준수

```
TypeScript의 엄격한 import 규칙을 준수하도록 수정해주세요:

1. **type-only import 수정**:
   - verbatimModuleSyntax가 활성화된 상황에서 타입만 사용하는 import들을 `import type`으로 변경
   - 특히 다음 파일들의 import 구문 수정:
     - `src/shared/hooks/useWebSocket.ts`
     - `src/shared/stores/auth.store.ts`
     - `src/shared/stores/game.store.ts`
     - `src/shared/stores/websocket.store.ts`
     - `src/versions/main/lib/animations.ts`

2. **타입 정의 추가**:
   - 누락된 GamePhase 타입 정의 추가
   - Navigator.deviceMemory 타입 확장

3. **검증**:
   - type-only import 관련 모든 오류 해결 확인
   - TypeScript 컴파일 오류 감소 확인

이 작업을 완료한 후 다음 단계로 진행하겠습니다.
```

### 2-2. 컴포넌트 Props 타입 수정

```
컴포넌트들의 Props 타입 불일치 문제를 해결해주세요:

1. **Badge 컴포넌트 variant 타입 수정**:
   - "citizen", "liar", "online", "offline", "waiting" variant 타입 정의 추가
   - Badge 컴포넌트의 variant union 타입 확장

2. **Progress 컴포넌트 확장**:
   - animated prop 타입 정의 및 구현 추가
   - color prop 지원 추가

3. **Button 컴포넌트 게임 variant 추가**:
   - "game-primary", "game-success", "game-warning", "game-danger" variant 구현

4. **검증**:
   - ComponentDemo에서 모든 variant가 정상 동작하는지 확인
   - 타입 오류 해결 확인

이 작업을 완료한 후 다음 단계로 진행하겠습니다.
```

### 2-3. Store 타입 오류 수정

```
Zustand Store들의 타입 오류를 해결해주세요:

1. **auth.store.ts 수정**:
   - refreshToken 속성 타입 충돌 해결
   - AuthState interface와 AuthStore interface 타입 일치성 확보
   - 중복 속성 제거

2. **game.store.ts 수정**:
   - GamePhase 타입 정의 추가 또는 올바른 import
   - 누락된 타입 import 추가

3. **version.store.ts 수정**:
   - Navigator.deviceMemory 타입 확장 또는 안전한 접근 방식 구현
   - detectDeviceCapability 메소드 누락 문제 해결

4. **검증**:
   - 모든 Store가 타입 오류 없이 컴파일되는지 확인
   - Store 기능이 정상 동작하는지 확인

이 작업을 완료한 후 3단계로 진행하겠습니다.
```

---

## 🧹 **3단계: 코드 품질 개선 (우선순위 3)**

### 3-1. 사용되지 않는 코드 정리

```
코드 품질 향상을 위해 불필요한 코드를 정리해주세요:

1. **사용되지 않는 import 제거**:
   - 모든 파일에서 사용되지 않는 import 구문 제거
   - ESLint 규칙에 따라 자동 정리 가능한 항목들 처리

2. **사용되지 않는 변수 제거**:
   - 선언만 되고 사용되지 않는 변수들 제거
   - 필요한 경우 underscore prefix(_) 추가로 의도적 미사용 표시

3. **중복 속성 제거**:
   - 객체 리터럴에서 중복된 속성 정리

4. **검증**:
   - ESLint 경고 감소 확인
   - 코드 가독성 향상 확인

이 작업을 완료한 후 마지막 단계로 진행하겠습니다.
```

### 3-2. Deprecated API 업데이트

```
최신 API 규격에 맞게 deprecated 사용법을 업데이트해주세요:

1. **React Query v5 업데이트**:
   - `cacheTime` → `gcTime`으로 변경
   - 기타 v5에서 변경된 옵션들 업데이트

2. **Zod 설정 수정**:
   - errorMap 속성 사용법 수정
   - enum 정의 방식 업데이트

3. **Framer Motion 설정 수정**:
   - duration 속성의 올바른 위치로 이동
   - 최신 API에 맞는 애니메이션 설정 적용

4. **검증**:
   - 모든 라이브러리의 최신 API 사용 확인
   - 경고 메시지 제거 확인

이 작업을 완료하면 모든 수정 작업이 완료됩니다.
```

---

## ✅ **최종 검증 프롬프트**

```
모든 수정 작업이 완료된 후 최종 검증을 진행해주세요:

1. **타입 검사 통과 확인**:
   - `npm run type-check` 실행하여 오류 0개 달성 확인

2. **빌드 성공 확인**:
   - `npm run build` 실행하여 성공적인 빌드 확인

3. **기본 기능 테스트**:
   - 개발 서버 실행 (`npm run dev`)
   - ComponentDemo 페이지 정상 렌더링 확인
   - Main Version 컴포넌트들의 기본 동작 확인

4. **라우팅 테스트**:
   - 새로 생성된 페이지들의 정상 접근 확인
   - 페이지 전환 및 렌더링 확인

5. **성능 확인**:
   - 개발 도구에서 React 컴포넌트 렌더링 확인
   - 콘솔 오류 메시지 제거 확인

검증 완료 후 Phase 4 진행 준비 완료 보고를 해주세요.
```

---

## 📝 **사용 가이드**

1. **순차 실행**: 프롬프트를 1-1부터 순서대로 실행
2. **단계별 검증**: 각 단계 완료 후 반드시 검증 수행
3. **문제 발생 시**: 해당 단계의 프롬프트를 다시 실행하거나 세부 사항 문의
4. **최종 확인**: 모든 단계 완료 후 최종 검증 프롬프트 실행

**총 예상 소요시간**: 약 9시간 (숙련도에 따라 변동 가능)