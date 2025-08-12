# FRONTEND_REBUILD_PLAN.md

## 1. 프로젝트 개요

### 1.1. 목표
안정적이고 유지보수 용이하며, 사용자 경험이 뛰어난 최신 프론트엔드 애플리케이션 구축

### 1.2. 핵심 기술 스택
- **UI 라이브러리:** Mantine
- **상태 관리:** Zustand
- **라우팅:** React Router DOM v6
- **폼 관리:** React Hook Form
- **데이터 페칭:** Axios 및 TanStack Query (React Query)
- **실시간 통신:** StompJS, SockJS
- **개발 환경:** Vite

---

## 2. 백엔드 통신 명세

### 2.1. REST API Endpoints

| 기능 | Method | URL | Request Body/Params |
| --- | --- | --- | --- |
| **인증** |
| 로그인 | `POST` | `/auth/login` | `{ nickname: string }` |
| **게임방 관리** |
| 방 목록 조회 | `GET` | `/game/rooms` | - |
| 방 생성 | `POST` | `/game/create` | `{ gameName, gameParticipants, gameTotalRounds, gamePassword, subjectIds, ... }` |
| 방 참가 | `POST` | `/game/join` | `{ gameNumber: number, password?: string }` |
| 방 나가기 | `POST` | `/game/leave` | `{ gameNumber: number }` |
| 방 상세 정보 | `GET` | `/game/{gameNumber}` | - |
| 게임 시작 | `POST` | `/game/start` | `{ gameNumber: number }` |
| 상태 복구 | `GET` | `/game/recover-state/{gameNumber}` | - |
| **인게임 액션** |
| 힌트 제출 | `POST` | `/game/hint` | `{ gameNumber: number, hint: string }` |
| 투표 | `POST` | `/game/vote` | `{ gameNumber: number, targetPlayerId: string }` |
| 변론 제출 | `POST` | `/game/submit-defense` | `{ gameNumber: number, defenseText: string }` |
| 최종 판결 | `POST` | `/game/cast-final-judgment` | `{ gameNumber: number, judgment: "KILL" \| "SPARE" }` |
| 생존 투표 | `POST` | `/game/survival-vote` | `{ gameNumber: number, survival: boolean }` |
| 단어 추측 | `POST` | `/game/guess-word` | `{ gameNumber: number, guessedWord: string }` |
| **콘텐츠 관리** |
| 주제 목록 조회 | `GET` | `/subjects/listsubj` | - |
| 주제 추가 | `POST` | `/subjects/applysubj` | `{ name: string }` |
| 단어 추가 | `POST` | `/words/applyw` | `{ subject: string, word: string }` |
| **채팅** |
| 채팅 내역 조회 | `GET` | `/chat/history` | `params: { gameNumber: number, limit: number }` |

### 2.2. WebSocket (STOMP) Topics

| 목적 | 구독 경로 (Subscribe) | 발행 경로 (Publish) | 메시지 페이로드 구조 (예시) |
| --- | --- | --- | --- |
| **게임방 상태** | `/topic/room.{gameNumber}` | - | `{ type: "PLAYER_JOINED", roomData: { ... } }` |
| **채팅** | `/topic/chat.{gameNumber}` | `/app/chat.send` | `{ gameNumber, content }` |
| **플레이어 목록**| `/topic/players.{gameNumber}` | - | `{ players: [...] }` |
| **사회자 메시지**| `/topic/game/{gameNumber}/moderator` | - | `{ content: "잠시 후 게임이 시작됩니다." }` |
| **턴 변경** | `/topic/game/{gameNumber}/turn` | - | `{ currentSpeakerId: string }` |
| **게임 액션** | - | `/app/game/{gameNumber}/{action}` | `action`에 따라 페이로드 상이 (e.g., `vote`, `hint`) |

---

## 3. 아키텍처 설계

### 3.1. 디렉토리 구조

```
/src
├── /api                 # Axios 인스턴스 및 API 호출 함수
│   ├── apiClient.js
│   └── index.js
├── /assets              # 이미지, 폰트 등 정적 에셋
├── /components          # 재사용 가능한 공통 컴포넌트
│   ├── /common            # 버튼, 인풋 등 범용 컴포넌트
│   ├── /layout            # Header, Footer, Layout 등
│   └── /game              # 게임 관련 특정 컴포넌트 (PlayerProfile, ChatWindow 등)
├── /constants           # 앱 전역 상수
├── /hooks               # 커스텀 훅
│   ├── useAuth.js
│   ├── useGame.js
│   └── useSocket.js
├── /pages               # 라우팅 단위 페이지 컴포넌트
│   ├── LoginPage.jsx
│   ├── LobbyPage.jsx
│   └── GameRoomPage.jsx
├── /routes              # 라우터 설정
│   └── AppRouter.jsx
├── /stores              # Zustand 상태 관리 스토어
│   ├── authStore.js
│   ├── roomStore.js
│   ├── gameStore.js
│   └── socketStore.js
├── /styles              # 전역 스타일 및 Mantine 테마 설정
│   └── theme.js
├── /types               # TypeScript 타입 정의 (필요시)
├── /utils               # 유틸리티 함수
└── main.jsx             # 애플리케이션 진입점
```

### 3.2. 디자인 시스템 (Mantine)

"모던하고 따뜻한" 분위기를 위해 다음과 같이 Mantine 테마를 설정합니다.

- **주요 색상 (Primary Color):** 부드러운 파란색 계열 (`blue`)을 메인 테마로 설정하여 신뢰감과 안정감을 줍니다.
- **보조 색상 (Secondary Color):** 따뜻한 느낌의 주황색 (`orange`) 또는 노란색 (`yellow`)을 포인트 색상으로 사용하여 활기찬 느낌을 더합니다.
- **폰트:** 가독성이 뛰어난 `Pretendard` 또는 `Noto Sans KR`와 같은 한글 웹폰트를 전역으로 적용합니다.
- **컴포넌트 스타일:**
    - `Button`, `Input` 등 주요 컴포넌트의 `radius`를 `md` 또는 `lg`로 설정하여 부드러운 인상을 줍니다.
    - `Paper`, `Card` 컴포넌트에 은은한 `shadow`를 적용하여 입체감을 부여합니다.
    - 전반적인 컴포넌트 간 간격(spacing)을 여유롭게 설정하여 시각적 편안함을 제공합니다.

### 3.3. 상태 관리 (Zustand)

전역 상태를 기능별 도메인으로 분리하여 관리의 복잡성을 낮추고 유지보수성을 높입니다.

- **`authStore.js`**
    - **역할:** 사용자 인증 정보 및 로그인 상태를 관리합니다.
    - **상태:** `user` (사용자 정보 객체), `isAuthenticated` (boolean)
    - **액션:** `login`, `logout`
- **`roomStore.js`**
    - **역할:** 로비의 방 목록과 현재 입장한 방의 기본 정보를 관리합니다.
    - **상태:** `rooms` (방 목록 배열), `currentRoom` (현재 방 정보 객체)
    - **액션:** `setRooms`, `createRoom`, `joinRoom`, `leaveRoom`
- **`gameStore.js`**
    - **역할:** 인게임의 상세 상태(게임 진행, 라운드, 역할, 투표 등)를 관리합니다.
    - **상태:** `gameStatus`, `currentRound`, `playerRole`, `assignedWord`, `timer`, `votingData`, `gameResult` 등
    - **액션:** `setGameStatus`, `setPlayerRole`, `updateTimer` 등 게임 진행에 따른 상태 변경 액션
- **`socketStore.js`**
    - **역할:** WebSocket(StompJS) 연결 상태 및 실시간으로 수신되는 데이터를 관리하고, 다른 스토어에 데이터를 전파합니다.
    - **상태:** `stompClient`, `isConnected` (boolean)
    - **액션:** `connect`, `disconnect`, `subscribe`, `publish`
    - **전략:** `socketStore`는 수신한 데이터를 `gameStore`나 `roomStore`의 액션을 호출하여 해당 도메인 상태를 업데이트하는 역할을 수행합니다.

### 3.4. 데이터 페칭 (React Query)

- **`useQuery` 활용:**
    - 방 목록(`getAllRooms`), 채팅 내역(`getChatHistory`), 주제 목록(`getAllSubjects`) 등 서버 데이터를 조회하는 모든 API 호출에 `useQuery`를 사용합니다.
    - `queryKey`를 명확하게 설정하여 캐싱을 관리합니다. (예: `['rooms']`, `['room', gameNumber]`)
    - `staleTime`과 `cacheTime`을 적절히 설정하여 불필요한 API 호출을 최소화합니다.
- **`useMutation` 활용:**
    - 방 생성/참가/나가기, 투표, 힌트 제출 등 서버 데이터를 변경하는 모든 작업에 `useMutation`을 사용합니다.
    - `onSuccess` 콜백에서 `queryClient.invalidateQueries`를 호출하여 관련된 쿼리를 무효화하고, 최신 데이터를 자동으로 다시 불러오도록 설정합니다. (예: 방 생성 후 `['rooms']` 쿼리 무효화)
    - `onMutate`와 `onError`를 사용한 낙관적 업데이트(Optimistic Updates)를 적용하여 사용자 경험을 향상시킬 수 있습니다.

---

## 4. 단계별 구현 가이드

### 1단계: 라우팅 및 전역 레이아웃 구현
1.  `react-router-dom`을 사용하여 `AppRouter.jsx`를 설정합니다.
2.  `LoginPage`, `LobbyPage`, `GameRoomPage` 경로를 정의합니다.
3.  `authStore`의 `isAuthenticated` 상태에 따라 로그인 페이지 또는 로비로 리다이렉션하는 `PrivateRoute` 컴포넌트를 구현합니다.
4.  Mantine `AppShell` 또는 커스텀 레이아웃 컴포넌트를 사용하여 전역 헤더, 푸터 등 기본 구조를 잡습니다.

### 2단계: 인증 페이지 구현
1.  `LoginPage.jsx`를 구현합니다.
2.  `react-hook-form`을 사용하여 닉네임 입력 폼과 유효성 검사를 처리합니다.
3.  `useMutation`을 사용하여 `login` API를 호출하고, 성공 시 `authStore`의 상태를 업데이트하며 로비 페이지로 이동시킵니다.

### 3단계: 로비 페이지 구현
1.  `LobbyPage.jsx`를 구현합니다.
2.  `useQuery`를 사용하여 방 목록을 조회하고 `Mantine Table`을 사용해 렌더링합니다.
3.  방 만들기(`createRoom`), 방 참가(`joinRoom`) 기능을 `Mantine Modal`과 `react-hook-form`, `useMutation`을 연동하여 구현합니다.
4.  `useQuery`로 주제 목록을 가져오고, `useMutation`으로 주제/단어 추가 기능을 구현합니다.

### 4단계: 게임방 페이지 및 실시간 통신 구현
1.  `GameRoomPage.jsx`의 기본 UI 레이아웃을 구현합니다. (플레이어 위치, 중앙 정보창, 채팅창)
2.  `socketStore`와 `useSocket` 커스텀 훅을 구현하여 STOMP 연결 및 구독/발행 로직을 처리합니다.
3.  페이지 진입 시 `gameNumber`를 기반으로 WebSocket에 연결하고 필요한 토픽(`room`, `chat`, `players`)을 구독합니다.
4.  `gameStore`를 사용하여 실시간으로 수신되는 게임 상태(플레이어 입장/퇴장, 게임 시작, 턴 변경 등)를 관리하고 UI에 반영합니다.
5.  게임 상태(`gameStatus`)에 따라 조건부 렌더링을 통해 힌트 입력, 투표, 변론 등 각 단계에 맞는 컴포넌트를 표시합니다.
6.  각 게임 액션(힌트 제출, 투표 등)은 `useMutation`을 사용하여 API를 호출하고, 성공 시 WebSocket을 통해 상태가 갱신되기를 기다립니다.

---

## 5. 주요 라이브러리 활용 전략

- **Mantine:**
    - **Theming:** `createTheme`을 사용하여 프로젝트 전반의 색상, 폰트, 그림자, `border-radius`를 중앙에서 관리합니다.
    - **Components:** `Grid`, `Stack`, `Group`을 활용하여 반응형 레이아웃을 효율적으로 구성합니다. `Modal`, `Notification`, `Tooltip` 등 오버레이 컴포넌트를 적극 활용하여 사용자 인터랙션을 개선합니다.
    - **Hooks:** `useMediaQuery`, `useDebouncedValue` 등 Mantine이 제공하는 훅을 활용하여 UI 로직을 간소화합니다.

- **Zustand:**
    - **Simplicity:** `Context.Provider` 없이 스토어를 생성하고 어떤 컴포넌트에서든 훅으로 상태를 바로 사용합니다.
    - **Selectors:** 컴포넌트에서는 `useMyStore(state => state.value)`와 같이 셀렉터를 사용하여 불필요한 리렌더링을 방지합니다.
    - **Middleware:** `immer` 미들웨어를 사용하여 불변성을 유지하며 상태를 쉽게 업데이트하고, `persist` 미들웨어를 사용하여 `authStore`의 사용자 정보를 `localStorage`에 저장합니다.

- **React Query:**
    - **Devtools:** 개발 중 `ReactQueryDevtools`를 반드시 활성화하여 캐시 상태를 시각적으로 확인하고 디버깅 효율을 높입니다.
    - **Query Keys:** 쿼리 키를 배열로 관리하며, 계층적으로 구성하여 (`['rooms', 'detail', id]`) 예측 가능하고 효율적인 무효화를 가능하게 합니다.
    - **Error Handling:** `useQuery`와 `useMutation`의 `error` 객체와 `isError` 상태를 활용하고, Mantine `Alert` 또는 `Notification` 컴포넌트와 연동하여 사용자에게 명확한 에러 피드백을 제공합니다.

- **React Hook Form:**
    - **Uncontrolled Components:** 비제어 컴포넌트 방식으로 폼을 처리하여 리렌더링을 최소화하고 성능을 최적화합니다.
    - **Validation:** `yup` 또는 `zod`와 같은 스키마 기반 유효성 검사 라이브러리와 연동하여 복잡한 폼의 유효성 검사 규칙을 선언적으로 관리합니다.
    - **Integration:** `Controller` 컴포넌트를 사용하여 Mantine의 `TextInput`, `Select`, `Checkbox` 등과 같은 UI 컴포넌트와 쉽게 통합합니다.
