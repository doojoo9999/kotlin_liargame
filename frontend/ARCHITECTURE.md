# 라이어 게임 Frontend 아키텍처 설계

## 📋 버전 전략

### Light Version (기존)
- **기술 스택**: Mantine + emotion
- **타겟**: 빠른 개발, 안정성 우선
- **유지보수**: 기존 사용자 지원

### Main Version (신규)
- **기술 스택**: Radix UI + shadcn/ui + Tailwind CSS + Framer Motion
- **타겟**: 현대적 UX, 애니메이션, 확장성
- **개발 방향**: 향후 메인 버전

---

## 🏗 최적화된 프로젝트 구조

```
frontend/src/
├── app/                          # 🔄 공통 앱 설정
│   ├── providers/
│   │   ├── AppProvider.tsx       # 버전별 프로바이더 선택
│   │   ├── QueryProvider.ts      # 공통 TanStack Query
│   │   └── RouterProvider.tsx    # 버전별 라우팅
│   ├── layouts/
│   │   ├── RootLayout.tsx        # 공통 루트 레이아웃
│   │   └── ErrorBoundary.tsx     # 공통 에러 처리
│   └── styles/
│       └── GlobalStyles.tsx      # 버전별 글로벌 스타일
│
├── shared/                       # 🔄 공통 비즈니스 로직
│   ├── api/                      # ✅ 버전 무관 API 계층
│   ├── stores/                   # ✅ 버전 무관 상태 관리
│   ├── socket/                   # ✅ 버전 무관 WebSocket
│   ├── hooks/                    # ✅ 비즈니스 로직 훅
│   ├── utils/                    # ✅ 공통 유틸리티
│   └── types/                    # ✅ 공통 타입 정의
│
├── features/                     # 🔄 기능별 모듈 (UI 독립적)
│   ├── auth/
│   │   ├── api/                  # ✅ API 로직
│   │   ├── hooks/                # ✅ 비즈니스 훅
│   │   ├── stores/               # ✅ 상태 관리
│   │   ├── types/                # ✅ 타입 정의
│   │   └── ui/                   # 🔄 버전별 UI 컴포넌트
│   │       ├── light/            # Mantine 기반
│   │       └── main/             # Radix 기반
│   ├── game/ (동일 구조)
│   ├── room/ (동일 구조)
│   └── chat/ (동일 구조)
│
├── versions/                     # 🎯 버전별 구현
│   ├── light/                    # Light Version
│   │   ├── App.tsx               # Light 버전 앱 엔트리
│   │   ├── components/           # Mantine 기반 공통 컴포넌트
│   │   ├── pages/                # Light 전용 페이지
│   │   ├── providers/            # Light 전용 프로바이더
│   │   └── styles/               # Mantine 테마
│   └── main/                     # Main Version
│       ├── App.tsx               # Main 버전 앱 엔트리
│       ├── components/           # Radix 기반 컴포넌트
│       │   ├── ui/               # shadcn/ui 기반 기본 컴포넌트
│       │   ├── layout/           # 레이아웃 컴포넌트
│       │   └── features/         # 기능별 복합 컴포넌트
│       ├── pages/                # Main 전용 페이지
│       ├── providers/            # Main 전용 프로바이더
│       ├── lib/                  # Main 전용 유틸리티
│       └── styles/               # Tailwind 설정
│
└── pages/                        # 🔄 공통 페이지 (현재 Light 전용)
    ├── LobbyPage.tsx             # Light Version 페이지
    ├── LoginPage.tsx
    └── GameRoomPage.tsx
```

---

## 🔄 마이그레이션 전략

### 1단계: 공통 모듈 분리 (현재 완료)
- ✅ API 계층 (shared/api)
- ✅ 상태 관리 (shared/stores)
- ✅ WebSocket (shared/socket)
- ✅ 공통 타입

### 2단계: 기능별 UI 분리
- 🎯 features/*/ui/ 디렉토리 구조화
- 🎯 light/ vs main/ UI 컴포넌트 분리
- 🎯 비즈니스 로직과 UI 완전 분리

### 3단계: Main Version 전용 컴포넌트 개발
- 🎯 shadcn/ui 기반 기본 컴포넌트
- 🎯 게임 특화 복합 컴포넌트
- 🎯 애니메이션 통합 컴포넌트

### 4단계: 라우팅 및 빌드 최적화
- 🎯 버전별 코드 스플리팅
- 🎯 Dynamic import 최적화
- 🎯 번들 사이즈 최적화

---

## 📊 마이그레이션 복잡도 매트릭스

| 컴포넌트 카테고리 | 복잡도 | 예상 시간 | 우선순위 |
|------------------|--------|-----------|----------|
| **Basic UI** | 🟢 낮음 | 1-2일 | P1 |
| Button, Badge, Avatar | | | |
| **Layout** | 🟡 중간 | 2-3일 | P1 |
| Container, Stack, Group | | | |
| **Forms** | 🟡 중간 | 3-4일 | P2 |
| TextInput, Validation | | | |
| **Data Display** | 🔴 높음 | 4-5일 | P2 |
| Table, List, Cards | | | |
| **Modal System** | 🔴 높음 | 3-4일 | P3 |
| useDisclosure 패턴 | | | |
| **Notifications** | 🟡 중간 | 2-3일 | P3 |
| Toast 시스템 | | | |

**총 예상 개발 시간**: 15-21일

---

## 🎯 핵심 설계 원칙

### 1. 버전 독립성
- 각 버전은 독립적으로 빌드/배포 가능
- 공통 비즈니스 로직은 shared/ 계층에서 관리
- UI 컴포넌트는 완전히 분리

### 2. 코드 재사용성
- API, 상태 관리, WebSocket 등 100% 재사용
- 비즈니스 로직 훅은 UI와 독립적으로 설계
- 타입 정의는 공통으로 사용

### 3. 개발자 경험
- 명확한 폴더 구조와 네이밍 컨벤션
- 버전별 개발 환경 분리
- Hot reload 및 타입 체킹 최적화

### 4. 확장성
- 새로운 기능 추가 시 version-agnostic 설계
- 컴포넌트 추상화를 통한 재사용성 극대화
- 향후 추가 버전 개발 고려
