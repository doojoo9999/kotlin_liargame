# Project Context: Liar Game (kotlin_liargame)

## 1. Project Overview
**Liar Game** is a real-time social deduction web game. Players guess a secret topic while identifying the "Liar" who doesn't know the topic.
- **Type**: Monorepo (Backend + Multiple Frontend Apps)
- **Core Features**: Real-time chat, WebSocket game state sync, voting system, admin dashboard.

## 2. Technology Stack

### Backend (Spring Boot)
- **Language**: Kotlin 1.9.0 (JDK 17)
- **Framework**: Spring Boot 3.2.0
- **Data**: Spring Data JPA, H2 (In-memory), PostgreSQL (Runtime), Redis (Session/Cache)
- **Real-time**: Spring WebSocket (STOMP)
- **Security**: Spring Security, Spring Session
- **Testing**: MockK, Testcontainers

### Frontend (React)
- **Location**: `apps/` directory
- **Core**: React 19, Vite 7, TypeScript
- **State**: Zustand, TanStack Query
- **Styling**: Tailwind CSS, Radix UI
- **Network**: Axios, STOMP.js

## 3. Project Structure

### Root Directory
- `apps/`: Frontend applications workspace.
  - `main/`: Main landing page.
  - `liar-game/`: The core Liar Game client.
  - `nemonemo/`, `roulette/`, `sadari-game/`: Other game scaffolds.
- `src/`: Backend source code.
- `docs/`: Documentation.
- `scripts/`: Utility scripts.

### Backend Structure (`src/main/kotlin/org/example/kotlin_liargame`)
- `KotlinLiargameApplication.kt`: Entry point.
- `domain/`: Business logic and features (Game, Player, etc.).
- `global/`: Global configurations (Security, WebSocket config, Exception handling).
- `common/`: Shared utilities.
- `tools/`: Helper tools.

## 4. Development & Run Instructions

### Backend
- **Run**: `./gradlew bootRun`
- **Test**: `./gradlew test`
- **Profiles**: Default is `dev`.

### Frontend
- **Setup**: Go to specific app dir (e.g., `cd apps/liar-game`), then `npm install`.
- **Run**: `npm run dev`
- **Build**: `npm run build`

## 5. Key Conventions & Notes
- **API**: REST API for general actions, WebSocket (STOMP) for real-time game events.
- **Database**: Uses H2 for development/testing, PostgreSQL for production.
- **Authentication**: Session-based auth (Spring Session backed by Redis).
- **Frontend**: Uses a multi-app structure. Each app is independent but shares the repo.
