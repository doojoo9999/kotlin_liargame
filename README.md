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
- [English](#project-overview)
  - [Project Overview](#project-overview)
  - [Key Features](#key-features)
  - [Project Structure](#project-structure)
  - [Technology Stack](#technology-stack)
  - [Installation and Setup](#installation-and-setup)
  - [How to Play](#how-to-play)
  - [Future Development Plans](#future-development-plans)
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
├── frontend/             # React 프론트엔드 애플리케이션
│   ├── public/           # 정적 자원
│   ├── src/              # React 소스 코드
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지별 컴포넌트
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LobbyPage.jsx
│   │   │   ├── GameRoomPage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── SubjectWordPage.jsx
│   │   ├── stores/       # Zustand 상태 관리 스토어
│   │   ├── App.jsx       # 메인 React 컴포넌트
│   │   └── main.jsx      # React 애플리케이션 진입점
│   ├── package.json      # 프론트엔드 의존성
│   └── vite.config.js    # Vite 설정
├── src/                  # Kotlin 백엔드 소스 코드
│   ├── main/             # 메인 소스 코드
│   │   ├── kotlin/       # Kotlin 코드
│   │   │   └── org/example/kotlin_liargame/
│   │   │       ├── domain/   # 도메인별 코드 (게임, 채팅, 사용자 등)
│   │   │       │   ├── auth/     # 인증 관련
│   │   │       │   ├── chat/     # 채팅 기능
│   │   │       │   ├── game/     # 게임 로직
│   │   │       │   ├── subject/  # 주제 관리
│   │   │       │   ├── user/     # 사용자 관리
│   │   │       │   └── word/     # 단어 관리
│   │   │       └── config/   # 애플리케이션 설정
│   │   └── resources/    # 리소스 파일
│   └── test/             # 테스트 코드
├── build.gradle.kts      # Gradle 빌드 설정
└── settings.gradle.kts   # Gradle 설정
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
- **React** 18.2.0
- **Material-UI (MUI)** 5.14.19 - UI 컴포넌트 라이브러리
- **React Router DOM** 7.7.1 - 라우팅
- **Zustand** 5.0.7 - 상태 관리
- **Axios** 1.11.0 - HTTP 클라이언트
- **STOMP.js** 7.0.0 - WebSocket 통신
- **Socket.io Client** 4.8.1 - 실시간 통신
- **Vite** 5.0.0 - 빌드 도구

### 개발 도구
- **Java** 17
- **Gradle** - 빌드 도구
- **TypeScript** - 타입 안전성

## 설치 및 실행 방법

### 사전 요구사항
- Java 17 이상
- Node.js 16 이상
- npm 또는 yarn

### 백엔드 실행
```bash
# 프로젝트 루트 디렉토리에서
./gradlew bootRun
```

### 프론트엔드 실행
```bash
# frontend 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

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
├── frontend/             # React frontend application
│   ├── public/           # Static assets
│   ├── src/              # React source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── stores/       # Zustand state management stores
│   │   ├── App.jsx       # Main React component
│   │   └── main.jsx      # React application entry point
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
├── src/                  # Kotlin backend source code
│   ├── main/             # Main source code
│   │   ├── kotlin/       # Kotlin code
│   │   │   └── org/example/kotlin_liargame/
│   │   │       ├── domain/   # Domain-specific code
│   │   │       └── config/   # Application configuration
│   │   └── resources/    # Resource files
│   └── test/             # Test code
├── build.gradle.kts      # Gradle build configuration
└── settings.gradle.kts   # Gradle settings
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
- **React** 18.2.0
- **Material-UI (MUI)** 5.14.19 - UI component library
- **React Router DOM** 7.7.1 - Routing
- **Zustand** 5.0.7 - State management
- **Axios** 1.11.0 - HTTP client
- **STOMP.js** 7.0.0 - WebSocket communication
- **Socket.io Client** 4.8.1 - Real-time communication
- **Vite** 5.0.0 - Build tool

### Development Tools
- **Java** 17
- **Gradle** - Build tool
- **TypeScript** - Type safety

## Installation and Setup

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup
```bash
# From project root directory
./gradlew bootRun
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## How to Play

1. Enter your nickname on the home screen to log in.
2. Create a game room or join an existing game in the lobby.
3. Configure player count, game time, and number of rounds in the game room.
4. Chat with other players while waiting in the game lobby.
5. When the game starts, the topic is displayed (liars cannot see the topic).
6. Each player provides hints and accuses other players of being the liar.
7. Vote for the player suspected of being the liar.
8. The accused player gets a chance to defend themselves.
9. Final voting takes place and results are displayed.
10. The liar attempts to guess the topic.
11. The game ends and final results are shown.

## Future Development Plans

1. **Multi-language Support**: Add multi-language interface through i18n
2. **Theme Features**: Add dark mode and theme customization
3. **User Profiles and Statistics**: Add user profile and game statistics features
4. **Game History**: Add game record viewing functionality
5. **Server Optimization**: Performance optimization for production environment
6. **CI/CD Pipeline**: Build CI/CD pipeline for frontend and backend
7. **Enhanced Testing**: Add unit tests and E2E tests

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.