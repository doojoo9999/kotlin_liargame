# 라이어 게임 (Liar Game)

<div align="center">

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![WebSocket](https://img.shields.io/badge/websocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>

<div align="center">
  <h3>
    <a href="#프로젝트-소개">
      한국어
    </a>
  </h3>
</div>

## 목차 (Table of Contents)

- [한국어](#프로젝트-소개)
  - [프로젝트 소개](#프로젝트-소개)
  - [주요 기능](#주요-기능)
  - [프로젝트 구조](#프로젝트-구조)
  - [기술 스택](#기술-스택)
  - [설치 및 실행 방법](#설치-및-실행-방법)
  - [게임 플레이 방법](#게임-플레이-방법)
  - [향후 개발 계획](#향후-개발-계획)
  - [네모네모 프로젝트](#네모네모-프로젝트)
- [English](#project-overview)
  - [Project Overview](#project-overview)
  - [Key Features](#key-features)
  - [Project Structure](#project-structure)
  - [Technology Stack](#technology-stack)
  - [Installation and Setup](#installation-and-setup)
  - [How to Play](#how-to-play)
  - [Future Development Plans](#future-development-plans)
  - [Nemonemo Project](#nemonemo-project)
- [License](#license)
- [Contributing](#contributing)

---

## 프로젝트 소개

라이어 게임은 플레이어들이 주어진 주제에 대한 힌트를 제공하고, 숨어있는 라이어(거짓말쟁이)를 찾아내는 소셜 추리 게임입니다. 라이어는 주제를 모르는 상태에서 다른 플레이어들의 힌트를 듣고 주제를 추측해야 합니다.

이 프로젝트는 Kotlin 백엔드와 React 프론트엔드를 사용하는 실시간 웹 게임으로 구현되어 있습니다.

## 주요 기능

- 실시간 게임 방 생성 및 참가 기능
- 게임 설정 및 관리 (플레이어 수, 시간 제한, 라운드 수)
- 실시간 채팅 및 힌트 제공
- 라이어 지목 및 투표 시스템
- 게임 결과 및 통계 확인
- 관리자 대시보드 (주제 및 단어 관리)

## 프로젝트 구조

```
kotlin_liargame/
├── apps/                       # 프론트엔드 멀티앱 워크스페이스
│   ├── main/                   # 메인 랜딩 페이지 SPA
│   ├── liar-game/              # 기존 라이어 게임 React 애플리케이션
│   ├── nemonemo/               # 네모네모 로직 프로젝트 스캐폴드
│   ├── roulette/               # 파티 룰렛 프로젝트 스캐폴드
│   └── sadari-game/            # 사다리 게임 프로젝트 스캐폴드
├── src/                        # Kotlin 백엔드 소스 코드
│   ├── main/
│   │   ├── kotlin/             # 도메인 및 어댑터 레이어
│   │   └── resources/          # 설정 및 리소스
│   └── test/                   # 테스트 코드
├── docs/                       # 문서 및 운영 가이드
├── scripts/                    # 보조 스크립트
├── build.gradle.kts            # Gradle 빌드 설정
└── settings.gradle.kts         # Gradle 설정
```

## 기술 스택

### 백엔드
- **Kotlin** 1.9.0
- **Spring Boot** 3.2.0
- **Spring Data JPA** - 데이터베이스 ORM
- **Spring WebSocket** - 실시간 통신
- **Spring Session** - 세션 관리
- **H2 Database** - 인메모리 데이터베이스
- **SpringDoc OpenAPI** - API 문서화 (Swagger)
- **MockK** - 테스트 프레임워크

### 프론트엔드
- **React** 19
- **Vite** 7
- **React Router DOM** 7 - 라우팅
- **Zustand** 5 & **@tanstack/react-query** 5 - 상태 및 데이터 동기화
- **Tailwind CSS** 3, `tailwind-merge`, `tailwindcss-animate` - 스타일 프리셋
- **Radix UI** 컴포넌트 & **framer-motion** - 인터랙션
- **Axios**, **STOMP.js**, `sockjs-client` - HTTP & WebSocket 클라이언트

### 개발 도구
- **Java** 17
- **Gradle** - 빌드 도구
- **TypeScript** - 타입 안전성

## 설치 및 실행 방법

### 사전 요구사항
- Java 17 이상
- Node.js 18 이상
- npm (또는 호환되는 패키지 매니저)

### 백엔드 실행
```bash
# 프로젝트 루트 디렉토리에서
./gradlew bootRun
```

### 프론트엔드 실행
멀티앱 구조이므로 각 애플리케이션 디렉토리에서 의존성을 설치하고 실행합니다.

**메인 허브**
```bash
cd apps/main
npm install
npm run dev
```

**라이어 게임**
```bash
cd apps/liar-game
npm install
npm run dev
```

나머지 앱(`apps/nemonemo`, `apps/roulette`, `apps/sadari-game`)은 현재 스캐폴드만 존재하며 이후 동일한 방식으로 확장할 수 있습니다.

## 게임 플레이 방법

1. 홈 화면에서 닉네임을 입력하여 로그인합니다.
2. 로비에서 게임 방을 생성하거나 기존 게임에 참가할 수 있습니다.
3. 게임 방에서 플레이어 수, 게임 시간, 라운드 수를 설정할 수 있습니다.
4. 게임 로비에서 다른 플레이어들과 채팅을 나누며 기다립니다.
5. 게임이 시작되면 주제가 표시됩니다 (라이어는 주제를 볼 수 없습니다).
6. 각 플레이어는 힌트를 제공하고, 다른 라이어를 지목합니다.
7. 라이어로 의심되는 플레이어에 대해 투표합니다.
8. 라이어가 변명할 기회를 가집니다.
9. 최종 투표가 진행되고 결과가 표시됩니다.
10. 라이어가 주제를 맞추려고 시도합니다.
11. 게임이 종료되고 최종 결과가 표시됩니다.

## 향후 개발 계획

1. **다국어 지원**: i18n을 통한 다국어 인터페이스 추가
2. **테마 기능**: 다크 모드 및 테마 커스터마이징 기능 추가
3. **사용자 프로필 및 통계**: 사용자 프로필 및 게임 통계 기능 추가
4. **게임 히스토리**: 게임 기록 조회 기능 추가
5. **서버 최적화**: 프로덕션 환경에서의 성능 최적화
6. **CI/CD 파이프라인**: 프론트엔드 및 백엔드를 위한 CI/CD 파이프라인 구축
7. **테스트 강화**: 단위 테스트 및 E2E 테스트 추가

## 네모네모 프로젝트

네모네모로직(Nonogram) 플랫폼은 본 저장소의 차세대 퍼즐 경험으로, 싱글 플레이와 멀티플레이, 커뮤니티 기능을 강화합니다.

- 설계 문서: `docs/nemonemo/DEVELOPMENT_PLAN.md`, `docs/nemonemo/TEST_PLAN.md`
- 아키텍처 다이어그램: `docs/architecture.md`
- 데이터 모델/DDL: `docs/database-schema.md`
- API 명세: `docs/openapi.yaml`, 예제 요청 `docs/api-examples.http`
- 의사결정 기록: `docs/adr/` 디렉터리

현재 단계는 문서화 및 스캐폴딩을 정비한 상태이며, 이후 백엔드 서비스와 프론트엔드 클라이언트를 순차적으로 구현할 예정입니다.

---

## Project Overview

Liar Game is a social deduction game where players provide hints about a given topic and try to identify the hidden liar. The liar must guess the topic without knowing it, based on hints from other players.

This project is implemented as a real-time web game using a Kotlin backend and React frontend.

## Key Features

- Real-time game room creation and joining
- Game configuration and management (player count, time limits, rounds)
- Real-time chat and hint sharing
- Liar accusation and voting system
- Game results and statistics
- Admin dashboard for topic and word management

## Project Structure

```
kotlin_liargame/
├── apps/                       # Multi-frontend workspace
│   ├── main/                   # Landing SPA linking every experience
│   ├── liar-game/              # Liar Game React client
│   ├── nemonemo/               # Nemonemo puzzle scaffold
│   ├── roulette/               # Party roulette scaffold
│   └── sadari-game/            # Ladder game scaffold
├── src/                        # Kotlin backend source
│   ├── main/
│   │   ├── kotlin/
│   │   └── resources/
│   └── test/
├── docs/                       # Documentation and plans
├── scripts/                    # Utility scripts
├── build.gradle.kts            # Gradle build configuration
└── settings.gradle.kts         # Gradle settings
```

## Technology Stack

### Backend
- **Kotlin** 1.9.0
- **Spring Boot** 3.2.0
- **Spring Data JPA** - Database ORM
- **Spring WebSocket** - Real-time communication
- **Spring Session** - Session management
- **H2 Database** - In-memory database
- **SpringDoc OpenAPI** - API documentation (Swagger)
- **MockK** - Testing framework

### Frontend
- **React** 19
- **Vite** 7
- **React Router DOM** 7 for routing
- **Zustand** 5 + **@tanstack/react-query** 5 for state/data sync
- **Tailwind CSS** 3 with `tailwind-merge` & `tailwindcss-animate`
- **Radix UI** primitives and **framer-motion**
- **Axios**, **STOMP.js**, `sockjs-client` for HTTP & WebSocket clients

### Development Tools
- **Java** 17
- **Gradle** - Build tool
- **TypeScript** - Type safety

## Installation and Setup

### Prerequisites
- Java 17 or newer
- Node.js 18 or newer
- npm (or a compatible package manager)

### Backend
```bash
./gradlew bootRun
```

### Frontend Apps
Each app now lives under `apps/`. Install dependencies and run dev servers individually.

**Main hub**
```bash
cd apps/main
npm install
npm run dev
```

**Liar Game**
```bash
cd apps/liar-game
npm install
npm run dev
```

Scaffolds for `apps/nemonemo`, `apps/roulette`, and `apps/sadari-game` are ready for future builds.

## Future Development Plans

1. **Internationalization**: add full i18n support across clients
2. **Theme customization**: deliver dark mode and user themes
3. **Player profiles & stats**: expose historical performance dashboards
4. **Game history**: allow replaying past sessions and reviewing moves
5. **Server scaling**: optimize production workloads and observability
6. **CI/CD pipeline**: automate deployment for backend and frontend apps
7. **Testing**: expand unit, integration, and end-to-end coverage

## Nemonemo Project

The Nemonemo (Nonogram) initiative extends this repository with a puzzle-first experience that blends single-player mastery, multiplayer showdowns, and creator tooling.

- Planning references: `docs/nemonemo/DEVELOPMENT_PLAN.md`, `docs/nemonemo/TEST_PLAN.md`
- Architecture: `docs/architecture.md`
- Database DDL & ERD: `docs/database-schema.md`
- API contract: `docs/openapi.yaml` with sample requests in `docs/api-examples.http`
- Decision records: `docs/adr/`

The current milestone establishes documentation and scaffolding. Backend services and the React client will iterate towards the feature set described in the development plan.
