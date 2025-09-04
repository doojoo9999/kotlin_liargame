# 1단계: Main Version 아키텍처 설정

## 🎯 목표
main version 프론트엔드를 위한 현대적 기술 스택 도입 및 프로젝트 구조 정립

## 🔧 주요 작업

### 1.1 shadcn/ui + Radix UI 설정
- [ ] shadcn/ui CLI 설치 및 프로젝트 초기화
- [ ] 기본 컴포넌트 설치 (Button, Card, Dialog, Input 등)
- [ ] Tailwind CSS 설정 커스터마이징
- [ ] 다크/라이트 테마 시스템 구축

**담당 에이전트**: `frontend-developer`

**예상 작업 시간**: 1-2일

### 1.2 Framer Motion 애니메이션 시스템
- [ ] Framer Motion 설치 및 기본 설정
- [ ] 페이지 전환 애니메이션 컴포넌트
- [ ] 게임 단계별 트랜지션 애니메이션
- [ ] 마이크로 인터랙션 라이브러리 구축

**담당 에이전트**: `frontend-developer`

**예상 작업 시간**: 2-3일

### 1.3 Main Version 전용 컴포넌트 구조
```
src/versions/main/
├── components/
│   ├── ui/           # shadcn/ui 기반 기본 컴포넌트
│   ├── layout/       # 레이아웃 컴포넌트
│   ├── game/         # 게임 특화 컴포넌트
│   └── common/       # 공통 컴포넌트
├── pages/            # Main 버전 전용 페이지
├── providers/        # Main 버전 전용 프로바이더
└── styles/           # Tailwind 설정
```

**담당 에이전트**: `frontend-developer`

**예상 작업 시간**: 1일

### 1.4 타입 안전성 강화
- [ ] 백엔드 API 타입 정의 파일 생성
- [ ] Zod를 활용한 런타임 검증 시스템
- [ ] React Hook Form과 타입 연동
- [ ] WebSocket 메시지 타입 정의

**담당 에이전트**: `typescript-pro`

**예상 작업 시간**: 1-2일

## 📋 완료 조건
- [ ] shadcn/ui 컴포넌트가 정상 작동
- [ ] Tailwind CSS 테마 시스템 구축
- [ ] Framer Motion 기본 애니메이션 동작 확인
- [ ] 타입 에러 0개 달성

## 🔄 다음 단계
`02_CORE_COMPONENTS.md` - 핵심 UI 컴포넌트 개발