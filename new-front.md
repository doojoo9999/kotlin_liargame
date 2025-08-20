# 새로운 프런트엔드 재구축 계획 및 AI 실행 프롬프트

이 문서는 기존 프런트엔드 프로젝트의 문제를 해결하고, 유지보수성과 확장성이 뛰어난 새로운 프로젝트를 구축하기 위한 계획과 AI 실행 지침을 담고 있습니다.

## 1. 기존 프런트엔드 기술 스택 분석

`package.json` 분석 결과, 프로젝트는 다음과 같은 최신 기술 스택을 사용하고 있었습니다. 라이브러리 선택 자체는 훌륭하나, 구조적인 문제와 각 라이브러리의 역할 분담이 명확하지 않아 에러가 발생했을 가능성이 높습니다.

- **UI/스타일링**: `Mantine`, `styled-components`, `framer-motion`, `lucide-react`
- **상태 관리**: `@tanstack/react-query` (서버 상태), `zustand` (클라이언트 상태)
- **라우팅**: `react-router-dom`
- **폼/검증**: `react-hook-form`, `zod`
- **네트워킹**: `axios` (HTTP), `@stomp/stompjs` + `sockjs-client` (WebSocket)
- **유틸리티**: `dayjs`, `lodash-es`, `react-window`
- **개발 환경**: `Vite`, `ESLint`

## 2. 새로운 프런트엔드 재구축을 위한 제안

### 핵심 철학
- **모듈성 (Modularity)**: 기능을 독립적인 모듈 단위로 개발하여 결합도를 낮추고 재사용성을 높입니다. (Feature-Sliced Design)
- **명확한 책임 분리 (Clear SoC)**: 각 파일과 폴더는 단 하나의 책임을 가집니다. (e.g., UI, 비즈니스 로직, API 호출)
- **예측 가능한 상태 관리 (Predictable State)**: 서버 상태와 클라이언트 상태를 명확히 분리하고, 데이터 흐름을 단방향으로 유지합니다.

### 권장 기술 스택 (기존 스택의 역할 명확화)

| 구분 | 라이브러리 | 역할 및 사용 규칙 |
| --- | --- | --- |
| **개발 환경** | Vite | 기존과 동일. 빠른 개발 서버와 번들링. |
| **UI 프레임워크**| Mantine | 기본 UI 컴포넌트 시스템. 일관된 디자인 시스템의 기반. |
| **스타일링** | styled-components | Mantine으로 구현이 어려운 복잡한 커스텀 스타일링 또는 컴포넌트 제작 시 제한적으로 사용. |
| **서버 상태** | TanStack Query v5 | 모든 서버 데이터(GET, POST, PUT, DELETE) 관리. 캐싱, 재시도, 동기화 담당. |
| **클라이언트 상태**| Zustand | 전역 UI 상태(e.g., 모달 열림/닫힘), 비서버 임시 데이터 등 최소한의 상태만 관리. |
| **라우팅** | React Router v7 | 페이지 라우팅 및 데이터 로더(Loader)를 활용한 사전 데이터 페칭. |
| **폼/검증** | React Hook Form, Zod | 사용자 입력 폼 상태 관리 및 스키마 기반의 강력한 유효성 검증. |
| **네트워킹** | Axios, STOMP.js | `axios`는 중앙화된 인스턴스(apiClient)로 관리. `STOMP`는 WebSocket 연결/구독/메시지 처리를 위한 래퍼(wrapper)로 관리. |
| **아이콘/애니메이션**| Lucide-React, Framer Motion | 경량 아이콘 및 선언적 애니메이션. |

### 새로운 디렉터리 구조 (Feature-Sliced Design)

기존의 `pages`, `components`, `hooks`를 기능 중심으로 재편성하여 응집도를 높입니다.

```
frontend/
└── src/
    ├── app/
    │   ├── providers/      # 모든 전역 Provider (QueryClient, Mantine, Router 등)
    │   ├── styles/         # 전역 스타일, 테마
    │   └── main.jsx        # 애플리케이션 진입점
    │
    ├── pages/              # 각 페이지를 정의하는 매우 얇은(thin) 컨테이너
    │   ├── LobbyPage.jsx
    │   ├── GameRoomPage.jsx
    │   └── index.js        # 페이지 컴포넌트 Barrel Export
    │
    ├── features/           # ✨ 핵심: 도메인/기능별 모듈
    │   ├── auth/           # (예시) 인증 기능
    │   │   ├── api/        # - 인증 관련 API 호출 함수 (login, logout)
    │   │   ├── hooks/      # - 인증 관련 React Query 훅 (useLoginMutation)
    │   │   └── ui/         # - 인증 관련 UI 컴포넌트 (LoginForm, ProfileButton)
    │   │   └── index.js    # - 외부에 노출할 훅, 컴포넌트 Barrel Export
    │   ├── create-room/
    │   ├── game-play/
    │   └── ...
    │
    └── shared/             # 모든 기능에서 공유되는 공통 모듈
        ├── api/            # - apiClient (axios 인스턴스), queryKeys
        ├── socket/         # - StompClient 래퍼
        ├── ui/             # - 원자적 UI 컴포넌트 (Button, Input, Card 등)
        ├── hooks/          # - 범용 훅 (useDebounce, useToggle 등)
        └── utils/          # - 순수 함수 유틸리티 (formatDate, logger 등)
```

---

## 3. AI 에이전트를 위한 실행 프롬프트

**역할**: 당신은 React 및 최신 프런트엔드 기술 스택에 매우 능숙한 전문가입니다. Feature-Sliced Design 아키텍처를 적용하여 확장 가능하고 안정적인 웹 애플리케이션을 처음부터 구축하는 임무를 받았습니다.

**목표**: '실시간 라이어 게임' 프런트엔드 프로젝트를 Vite, React, Mantine, TanStack Query, Zustand를 사용하여 재구축합니다. 제공된 `new-front.md`의 아키텍처와 규칙을 100% 준수해야 합니다.

**핵심 원칙**:
1.  **Feature-Sliced Design**: 모든 코드는 `app`, `pages`, `features`, `shared` 4개의 슬라이스(slice)로 구성됩니다.
2.  **엄격한 책임 분리**: `features` 폴더의 각 모듈은 `api`, `hooks`, `ui` 등으로 내부 책임이 명확히 나뉩니다.
3.  **상태 관리 규칙**: 서버 상태는 TanStack Query, 클라이언트 상태는 Zustand로 엄격히 분리합니다.
4.  **Barrel Export**: 각 모듈(`features/*`, `shared/*` 등)은 `index.js`를 통해 외부에 필요한 것만 노출합니다. 모듈 내부 파일에 직접 접근하는 import는 금지됩니다.

### **단계별 실행 계획 (Step-by-Step Execution Plan):**

#### **Phase 1: 프로젝트 초기 설정**

1.  **Vite 프로젝트 생성**: `frontend-new` 폴더에 Vite + React 프로젝트를 생성하세요.
2.  **의존성 설치**: `new-front.md`의 '권장 기술 스택'에 명시된 모든 라이브러리(`@mantine/core`, `@tanstack/react-query`, `zustand` 등)를 `npm install`을 통해 설치하세요.
3.  **기본 폴더 구조 생성**: `src` 폴더 내에 `app`, `pages`, `features`, `shared` 폴더를 생성하세요. 각 폴더 하위에도 필요한 기본 폴더(`app/providers`, `shared/api`, `shared/ui` 등)를 미리 만들어 두세요.
4.  **ESLint/Prettier 설정**: 일관된 코드 스타일을 위해 기본 규칙을 설정합니다.

#### **Phase 2: `shared` 레이어 구축 (공통 기반)**

1.  **`shared/api/apiClient.js`**: `axios` 인스턴스를 생성하고, 기본 `baseURL`과 인터셉터(요청/응답)를 설정합니다.
2.  **`shared/api/queryKeys.js`**: TanStack Query에서 사용할 모든 쿼리 키를 중앙에서 관리하는 객체를 정의합니다.
3.  **`shared/socket/stompClient.js`**: STOMP.js와 SockJS를 래핑하여 연결, 구독, 메시지 발행, 재연결 로직을 포함하는 클래스 또는 훅을 만듭니다.
4.  **`shared/ui/`**: 프로젝트 전반에서 사용될 원자적 UI 컴포넌트를 만듭니다. (예: `Button.jsx`, `Input.jsx`, `Modal.jsx`). Mantine 컴포넌트를 래핑하여 프로젝트에 맞게 커스터마이징하는 것을 권장합니다.

#### **Phase 3: `app` 레이어 구축 (전역 설정)**

1.  **`app/styles/`**: Mantine 테마 설정, 전역 CSS 변수, `global.css` 등을 설정합니다.
2.  **`app/providers/`**: 애플리케이션 전체를 감싸는 Provider들을 조합하는 `AppProvider.jsx`를 만듭니다. (`MantineProvider`, `QueryClientProvider`, `BrowserRouter` 포함)
3.  **`app/main.jsx`**: `AppProvider`를 사용하여 `App` 컴포넌트를 렌더링합니다.

#### **Phase 4: `features` 및 `pages` 레이어 구축 (기능 구현)**

*이제 각 기능을 독립적으로 개발하고 페이지에 조립합니다. **인증** 기능부터 시작합니다.*

1.  **`features/auth` 모듈 생성**:
    -   `api/index.js`: `apiClient`를 사용하여 `login(nickname)`, `logout()` API 요청 함수를 작성합니다.
    -   `hooks/useLogin.js`: `login` API를 호출하는 `useMutation` 훅을 만듭니다.
    -   `ui/LoginForm.jsx`: 닉네임을 입력받고, `useLogin` 훅을 사용하여 로그인을 시도하는 폼 컴포넌트를 작성합니다. `react-hook-form`과 `zod`를 사용하세요.
    -   `index.js`: `useLogin` 훅과 `LoginForm` 컴포넌트를 export 합니다.

2.  **`pages/LoginPage.jsx` 생성**:
    -   `features/auth`에서 노출한 `LoginForm` 컴포넌트를 가져와 페이지 중앙에 배치합니다. 다른 로직은 포함하지 않습니다.

3.  **`stores/authStore.js` (Zustand) 생성**:
    -   로그인된 유저의 닉네임과 로그인 상태(isLoggedIn)를 저장하는 Zustand 스토어를 만듭니다. `login`, `logout` 액션을 포함합니다.
    -   `useLogin` 훅의 `onSuccess` 콜백에서 이 스토어의 상태를 업데이트하도록 연동합니다.

*위와 같은 방식으로 **방 목록 보기**, **방 생성하기**, **채팅** 등 다른 기능들도 `features` 모듈로 각각 개발하고, `pages`에서 조립하세요.*

#### **Phase 5: 최종 검증**

1.  **빌드 및 린트**: `npm run build`와 `npm run lint`를 실행하여 에러가 없는지 확인합니다.
2.  **기능 검토**: 모든 기능이 기획서대로 동작하는지, 상태 관리가 예측 가능하게 이루어지는지 확인합니다.
3.  **README 작성**: 프로젝트 실행 방법, 아키텍처 개요, 주요 결정 사항을 `README.md`에 문서화합니다.

**준수해야 할 규칙**:
- **절대 경로 사용**: Vite 설정에서 `@/`를 `src/`로 매핑하여 모든 import는 절대 경로를 사용합니다. (`import { Button } from '@/shared/ui'`)
- **단방향 의존성**: `features`는 `shared`에 의존할 수 있지만, `shared`는 `features`에 의존할 수 없습니다. `features` 간의 직접적인 의존도도 피해야 합니다.
- **컴포넌트 분리**: 로직을 포함한 컴포넌트와 순수 UI 컴포넌트를 명확히 분리하세요.

이 지침에 따라 작업을 시작하세요. 각 단계가 완료될 때마다 진행 상황을 보고해주세요.