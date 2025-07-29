# 라이어 게임 (Liar Game)

<div align="center">

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

</div>

<div align="center">
  <h3>
    <a href="#프로젝트-개요">
      한국어
    </a>
  </h3>
</div>

## 목차 (Table of Contents)

- [한국어](#프로젝트-개요)
  - [프로젝트 개요](#프로젝트-개요)
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

## 프로젝트 개요

라이어 게임은 플레이어들이 주제와 관련된 단어에 대해 힌트를 제공하고, 누가 라이어(거짓말쟁이)인지 찾아내는 소셜 추리 게임입니다. 라이어는 단어를 모르는 상태에서 다른 플레이어들의 힌트를 듣고 단어를 추측해야 합니다.

이 프로젝트는 Kotlin 백엔드와 Vue 3 프론트엔드를 포함하는 모노레포로 구성되어 있습니다.

## 주요 기능

- 사용자 인증 및 게임 참여
- 게임 생성 및 설정 (플레이어 수, 시간 제한, 라운드 수)
- 실시간 채팅 및 힌트 제공
- 라이어 투표 및 변론 시스템
- 라운드 진행 및 결과 확인

## 프로젝트 구조

```
kotlin_liargame/
├── frontend/             # Vue 3 프론트엔드 애플리케이션
│   ├── public/           # 정적 자산
│   ├── src/              # Vue 소스 코드
│   │   ├── assets/       # 프론트엔드 자산 (CSS, 이미지)
│   │   ├── components/   # Vue 컴포넌트
│   │   ├── views/        # 페이지 뷰 컴포넌트
│   │   ├── stores/       # Pinia 상태 관리 스토어
│   │   ├── router/       # Vue Router 설정
│   │   ├── App.vue       # 메인 Vue 컴포넌트
│   │   └── main.js       # Vue 애플리케이션 진입점
│   ├── package.json      # 프론트엔드 의존성
│   └── vite.config.js    # Vite 설정
├── src/                  # Kotlin 백엔드 소스 코드
│   ├── main/             # 메인 소스 코드
│   │   ├── kotlin/       # Kotlin 코드
│   │   │   └── org/example/kotlin_liargame/
│   │   │       ├── domain/   # 도메인별 코드 (게임, 채팅, 사용자 등)
│   │   │       └── config/   # 애플리케이션 설정
│   │   └── resources/    # 리소스 파일
│   └── test/             # 테스트 코드
├── build.gradle.kts      # Gradle 빌드 설정
└── settings.gradle.kts   # Gradle 설정
```

## 기술 스택

### 백엔드
- Kotlin
- Spring Boot
- Spring WebSocket
- JPA/Hibernate
- H2 Database

### 프론트엔드
- Vue 3 (Composition API)
- Vue Router
- Pinia (상태 관리)
- Axios (HTTP 요청)
- Socket.io (실시간 통신)

## 게임 플레이 방법

1. 홈 화면에서 사용자 이름을 입력하여 로그인합니다.
2. 새 게임을 만들거나 기존 게임에 참여할 수 있습니다.
3. 게임 생성 시 플레이어 수, 제한 시간, 라운드 수를 설정할 수 있습니다.
4. 게임 로비에서 다른 플레이어들이 참여할 때까지 기다립니다.
5. 게임이 시작되면 주제와 단어가 표시됩니다 (라이어는 단어를 볼 수 없습니다).
6. 각 플레이어는 힌트를 제공하고, 누가 라이어인지 투표합니다.
7. 라이어로 지목된 플레이어는 변론할 기회가 있습니다.
8. 라이어는 단어를 맞추려고 시도합니다.
9. 라운드가 끝나면 결과가 표시되고 다음 라운드로 진행합니다.
10. 모든 라운드가 끝나면 최종 결과가 표시됩니다.

## 향후 개발 계획

1. **다국어 지원**: i18n을 통한 다국어 지원 추가
2. **테마 설정**: 다크 모드 등 테마 설정 기능 추가
3. **사용자 프로필 및 통계**: 사용자 프로필 및 게임 통계 기능 추가
4. **게임 히스토리**: 이전 게임 기록 조회 기능 추가
5. **모바일 최적화**: 모바일 환경에서의 사용성 개선
6. **CI/CD 파이프라인**: 프론트엔드 및 백엔드를 위한 CI/CD 파이프라인 구축
7. **테스트 강화**: 단위 테스트 및 E2E 테스트 추가