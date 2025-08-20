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

---

## 4. 백엔드 API 명세 (Frontend-Backend Interface)

### 4.1. 백엔드 아키텍처 개요

백엔드는 역할과 책임에 따라 여러 서비스로 분리되었습니다. 프론트엔드 개발 시 각 서비스의 역할을 이해하면 API를 더 쉽게 파악할 수 있습니다.

- **`GameService`**: 게임 방의 생명주기(생성, 참여, 퇴장)를 관리합니다. 동시성 제어를 위해 비관적 락(`PESSIMISTIC_WRITE`)을 사용하여 여러 유저가 동시에 방에 참여하거나 나갈 때 데이터 정합성을 보장합니다.
- **`GameProgressService`**: 게임의 실제 진행(시작, 힌트 제공, 턴 관리)을 담당합니다.
- **`VotingService`**: 라이어 투표, 생존 투표 등 모든 투표 관련 로직을 전담합니다.
- **`ChatService`**: 인게임 채팅 및 시스템 메시지 전송을 관리합니다.
- **`GameMonitoringService`**: WebSocket을 통해 게임 상태 변경(플레이어 입/퇴장, 게임 시작 등)을 모든 클라이언트에게 브로드캐스팅하는 역할을 합니다.

### 4.1.1. 프론트엔드-백엔드 핵심 아키텍처 원칙

이 프로젝트는 **서버 중심 아키텍처(Server-Authoritative Architecture)**를 따릅니다. 이는 모든 상태 변경의 최종 권한과 책임이 백엔드에 있음을 의미합니다. 프론트엔드는 이 원칙을 반드시 준수해야 합니다.

- **백엔드는 '상태'와 '규칙'의 단일 진실 공급원(Single Source of Truth)입니다.**
  - 예시: "방이 가득 찼는가?", "지금 투표할 시간인가?", "주인을 잃은 방을 삭제해야 하는가?" 와 같은 모든 판단은 백엔드가 내립니다.
- **프론트엔드의 역할은 '사용자 액션 요청'과 '상태 표시'입니다.**
  - 예시: 사용자가 '나가기' 버튼을 누르면, 프론트엔드는 자신이 마지막 플레이어인지 판단하지 않고, 단순히 "제가 이 방에서 나가겠습니다" (`/api/v1/game/leave`) 라는 요청을 백엔드에 보냅니다.
- **상태 동기화는 백엔드가 주도합니다.**
  - 예시: 백엔드는 `leave` 요청을 처리한 후, 방이 삭제되어야 한다고 판단하면 `/topic/lobby`로 `ROOM_DELETED` 메시지를 브로드캐스팅합니다. 프론트엔드는 이 메시지를 수신하여 로비 화면으로 이동하는 등 UI를 업데이트할 뿐입니다.

**이 원칙을 통해 데이터 정합성을 보장하고, 보안을 강화하며, 여러 클라이언트 간의 상태를 일관되게 유지할 수 있습니다.**

### 4.2. REST API 엔드포인트 상세

#### **인증 (Auth)**
- **Controller**: `AuthController`
- **Service**: `UserService`

---

- **`POST /api/v1/auth/login`**: 닉네임으로 로그인합니다.
  - **Service Method**: `fun login(nickname: String, session: HttpSession): User`
  - **설명**: 사용자가 입력한 닉네임으로 시스템에 로그인합니다. 기존에 해당 닉네임의 유저가 없으면 새로 생성하고, 있으면 기존 유저 정보를 반환합니다. 로그인 성공 시 서버 세션에 `userId`와 `nickname`이 저장됩니다.
  - **Request Body**: 
    ```json
    { "nickname": "string" }
    ```
  - **Response Body**: 
    ```json
    { "userId": number, "nickname": "string" }
    ```

- **`POST /api/v1/auth/logout`**: 로그아웃합니다.
  - **Service Method**: `fun logout(session: HttpSession)`
  - **설명**: 현재 사용자의 세션을 무효화하여 로그아웃 처리합니다.
  - **Response Body**: 
    ```json
    { "message": "Logged out successfully" }
    ```

#### **게임 방 (Game Room)**
- **Controller**: `GameController`
- **Service**: `GameService`

---

- **`POST /api/v1/game/create`**: 새 게임 방을 생성합니다.
  - **Service Method**: `fun createGameRoom(req: CreateGameRoomRequest, session: HttpSession): Int`
  - **설명**: 새로운 라이어 게임 방을 생성합니다. 요청한 유저가 방장이 되며, 첫 번째 플레이어로 자동 참가 처리됩니다.
  - **핵심 로직**:
    1. 현재 사용자가 다른 게임에 참여 중인지 확인합니다.
    2. 사용 가능한 방 번호를 1번부터 순차적으로 찾습니다.
    3. `Game` 엔티티를 생성하고 데이터베이스에 저장합니다.
    4. 방장을 첫 번째 `Player`로 추가하기 위해 내부적으로 `joinGame` 로직을 호출합니다.
  - **Request Body**: `CreateGameRoomRequest`
    ```json
    {
      "gameName": "string",
      "gameParticipants": number,
      "gameTotalRounds": number,
      "gameLiarCount": number,
      "gameMode": "NORMAL" | "FOOL" | "LIARS_DIFFERENT_WORD",
      "subjectIds": number[] | null,
      "useRandomSubjects": boolean,
      "randomSubjectCount": number | null
    }
    ```
  - **Response Body**: `number` (생성된 게임 방의 고유 번호)

- **`POST /api/v1/game/join`**: 기존 게임 방에 참여합니다.
  - **Service Method**: `fun joinGame(req: JoinGameRequest, session: HttpSession): GameStateResponse`
  - **설명**: 지정된 번호의 게임 방에 현재 세션의 사용자가 플레이어로 참여합니다.
  - **핵심 로직**:
    1. **(동시성 제어)** `findByGameNumberWithLock`을 호출하여 대상 게임에 **비관적 락**을 겁니다. 이를 통해 여러 유저가 동시에 참여 요청을 보내도 방 인원수가 정확하게 관리됩니다.
    2. 방 상태(대기 중인지), 현재 인원 등을 확인하여 참여 가능 여부를 검사합니다.
    3. `Player` 엔티티를 생성하고 게임에 추가합니다.
  - **WebSocket 이벤트**: 성공 시 `GameMonitoringService`를 통해 `/topic/room/{gameNumber}` 토픽으로 `PLAYER_JOINED` 메시지를 브로드캐스팅하여 대기실의 모든 클라이언트에게 알립니다.
  - **Request Body**: 
    ```json
    { "gameNumber": number }
    ```
  - **Response Body**: `GameStateResponse` (업데이트된 게임 상태)

- **`POST /api/v1/game/leave`**: 게임 방에서 나갑니다.
  - **Service Method**: `fun leaveGame(req: LeaveGameRequest, session: HttpSession): Boolean`
  - **설명**: 현재 게임 방에서 나갑니다. 방장이 나갈 경우, 방에 남아있는 다른 플레이어에게 방장 권한이 자동으로 위임됩니다. 마지막 플레이어가 나갈 경우 방은 삭제됩니다.
  - **핵심 로직**:
    1. **(동시성 제어)** `findByGameNumberWithLock`을 호출하여 대상 게임에 **비관적 락**을 겁니다.
    2. `Player` 엔티티를 게임에서 삭제합니다.
    3. 남은 플레이어 수를 확인하고, 필요 시 방장 위임 또는 방 삭제를 처리합니다.
  - **WebSocket 이벤트**: 성공 시 `GameMonitoringService`를 통해 `/topic/room/{gameNumber}`로 `PLAYER_LEFT` 메시지를, 방 삭제 시 `/topic/lobby`로 `ROOM_DELETED` 메시지를 브로드캐스팅합니다.
  - **Request Body**: 
    ```json
    { "gameNumber": number }
    ```
  - **Response Body**: `boolean` (성공 여부)

- **`GET /api/v1/game/rooms`**: 활성화된 게임 방 목록을 조회합니다.
  - **Service Method**: `fun getAllGameRooms(session: HttpSession): GameRoomListResponse`
  - **설명**: 현재 '대기 중'이거나 '진행 중'인 모든 게임 방의 목록을 반환합니다. 로비 화면 표시에 사용됩니다.
  - **Response Body**: `GameRoomListResponse`

#### **게임 진행 (Game Progress)**
- **Controller**: `GameController`
- **Service**: `GameProgressService`

---

- **`POST /api/v1/game/start`**: 게임을 시작합니다.
  - **Service Method**: `fun startGame(req: StartGameRequest, session: HttpSession): GameStateResponse`
  - **설명**: 방장이 게임 시작을 요청합니다. 최소 인원(3명)이 충족되어야 시작할 수 있습니다.
  - **핵심 로직**:
    1. 요청자가 방장인지, 방이 대기 상태인지 확인합니다.
    2. 게임에 참여한 플레이어들에게 '라이어'와 '시민' 역할을 무작위로 할당합니다.
    3. 게임 주제와 제시어를 설정합니다.
    4. 게임 상태를 `IN_PROGRESS`로 변경합니다.
  - **WebSocket 이벤트**: 성공 시 `GameMonitoringService`를 통해 `/topic/game/{gameNumber}/state` 토픽으로 게임 전체 상태(`GameStateResponse`)를 브로드캐스팅합니다.
  - **Request Body**: `StartGameRequest`
  - **Response Body**: `GameStateResponse`

- **`POST /api/v1/game/hint`**: 힌트(발언)를 제출합니다.
  - **Service Method**: `fun giveHint(req: GiveHintRequest, session: HttpSession): GameStateResponse`
  - **설명**: 자신의 턴에 라이어가 아닌 것을 증명하기 위한 힌트(제시어 설명)를 제출합니다.
  - **핵심 로직**:
    1. 현재 게임이 진행 중이고, 플레이어가 힌트를 제출할 차례인지 확인합니다.
    2. 제출된 힌트를 `Player` 엔티티에 저장하고, 상태를 `GAVE_HINT`로 변경합니다.
    3. 모든 플레이어가 힌트를 제출했는지 확인하고, 만약 그렇다면 자동으로 투표 단계로 넘어갈 준비를 합니다.
  - **WebSocket 이벤트**: 상태 변경 시 `/topic/game/{gameNumber}/state`로 업데이트된 게임 상태를 브로드캐스팅합니다.
  - **Request Body**: `GiveHintRequest`
    ```json
    { "gameNumber": number, "hint": "string" }
    ```
  - **Response Body**: `GameStateResponse`

#### **투표 (Voting)**
- **Controller**: `GameController`
- **Service**: `VotingService`

---

- **`POST /api/v1/game/vote`**: 라이어로 의심되는 플레이어에게 투표합니다.
  - **Service Method**: `fun vote(req: VoteRequest, session: HttpSession): GameStateResponse`
  - **설명**: 힌트 제공 단계가 끝난 후, 라이어라고 생각되는 플레이어에게 투표합니다.
  - **핵심 로직**:
    1. 현재가 투표 단계인지 확인합니다.
    2. 투표 내용을 기록하고, 대상 플레이어의 `votesReceived`를 1 증가시킵니다.
    3. 모든 플레이어가 투표를 완료하면, 최다 득표자를 결정합니다.
    4. 동점일 경우 재투표를 진행하고, 단독 최다 득표자가 나오면 '변론' 단계로 넘어갑니다.
  - **WebSocket 이벤트**: 투표가 진행되거나 완료될 때마다 `/topic/game/{gameNumber}/state`로 게임 상태를 브로드캐스팅합니다.
  - **Request Body**: `VoteRequest`
    ```json
    { "gameNumber": number, "targetPlayerId": number }
    ```
  - **Response Body**: `GameStateResponse`

### 4.3. WebSocket (STOMP) 프로토콜

- **연결 Endpoint**: `/ws`

#### **클라이언트 -> 서버 (MessageMapping)**

- **채팅 메시지 전송**:
  - **Destination**: `/chat.send`
  - **Payload**: `SendChatMessageRequest` (`{ "gameNumber": number, "content": "string" }`)
  - **설명**: 게임 중 채팅 메시지를 서버로 전송합니다. `ChatService`가 메시지를 받아 DB에 저장하고, 해당 게임 방의 모든 클라이언트에게 `/topic/chat/{gameNumber}`로 메시지를 브로드캐스팅합니다.

- **발언(힌트) 완료 알림**:
  - **Destination**: `/speech/complete`
  - **Payload**: `CompleteSpeechRequest` (`{ "gameNumber": number }`)
  - **설명**: `GameProgressService`의 `markPlayerAsSpoken`을 호출하여 해당 플레이어의 발언이 끝났음을 기록합니다. 모든 플레이어가 발언을 마치면 자동으로 투표 단계로 전환되고, 새로운 게임 상태가 브로드캐스팅됩니다.

#### **서버 -> 클라이언트 (Topic)**

- **게임 상태 업데이트 (가장 중요)**:
  - **Topic**: `/topic/game/{gameNumber}/state`
  - **Payload**: `GameStateResponse` DTO
  - **설명**: 게임 시작, 힌트 제출, 투표 완료 등 게임의 주요 상태가 변경될 때마다 서버가 이 토픽으로 최신 게임 상태 전체를 전송합니다. **클라이언트는 이 데이터를 받아 화면 전체를 업데이트하는 것을 기본 전략으로 삼아야 합니다.**

- **게임 이벤트 수신 (최적화)**:
  - **Topic**: `/topic/game/{gameNumber}/events`
  - **Payload**: `PlayerVotedEvent` | `HintSubmittedEvent` | `TurnChangedEvent` 등
  - **설명**: 투표, 힌트 제출 등 빈번하게 발생하는 작은 변화들을 실시간으로 전달합니다. 클라이언트는 이 이벤트를 사용하여 전체 상태를 다시 요청하지 않고도 UI의 일부(예: 투표 현황)를 즉시 업데이트하여 반응성을 높일 수 있습니다.

- **플레이어 입/퇴장 및 방 정보 변경**:
  - **Topic**: `/topic/room/{gameNumber}`
  - **Payload**: `{ "type": "PLAYER_JOINED" | "PLAYER_LEFT", "playerName": "string", "currentPlayers": number, ... }`
  - **설명**: 대기실에서 플레이어가 들어오거나 나갈 때, 방장 변경 등 방 정보가 업데이트될 때마다 전송됩니다.

- **로비 업데이트**:
  - **Topic**: `/topic/lobby`
  - **Payload**: `{ "type": "ROOM_DELETED" | "ROOM_UPDATED", "gameNumber": number, ... }`
  - **설명**: 방이 삭제되거나, 방의 인원수가 변경될 때 로비에 있는 모든 클라이언트에게 전송됩니다.

- **채팅 메시지 수신**:
  - **Topic**: `/topic/chat/{gameNumber}`
  - **Payload**: `ChatMessageResponse` DTO
  - **설명**: 새로운 채팅 메시지(유저 메시지, 시스템 메시지)가 도착했을 때 수신합니다.
