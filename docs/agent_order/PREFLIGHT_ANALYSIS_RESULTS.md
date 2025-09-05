# 0단계: 프리플라이트 분석 결과 보고서

## 📊 분석 완료 일시
**분석 일시**: 2025년 1월 5일  
**분석 범위**: Light 버전 코드, 백엔드 API 명세, 개발 환경, Main 버전 초기 구조

## 🔍 주요 발견사항

### ✅ 긍정적 발견사항

#### 1. 견고한 기존 아키텍처
- **공통 모듈 완성도**: `src/shared/` 디렉토리가 잘 구조화되어 있음
- **API 클라이언트**: Axios 기반 견고한 HTTP 클라이언트 구현
- **상태 관리**: Zustand 기반 체계적인 스토어 구조 (game, auth, socket, user)
- **WebSocket 관리**: SocketManager 클래스로 실시간 통신 체계적 관리
- **타입 안전성**: TypeScript 기반 타입 정의 체계 구축

#### 2. 현대적 기술 스택 준비 완료
- **shadcn/ui 설정**: `components.json`이 Main 버전용으로 이미 구성됨
- **Radix UI**: 접근성 컴포넌트들이 이미 설치되어 있음
- **Framer Motion**: 애니메이션 라이브러리 설치 완료
- **Tailwind CSS v4**: 최신 버전 사용 중
- **React 19**: 최신 React 버전 사용

#### 3. Main 버전 기초 구조 존재
- Main 버전 디렉토리 (`src/versions/main/`) 이미 생성
- 기본 App.tsx, Router, 스타일 파일 구성 완료
- 컴포넌트, 페이지, 애니메이션 디렉토리 구조 준비됨

### ⚠️ 중요한 문제점 발견

#### 1. 백엔드 API 명세 불일치 (HIGH PRIORITY)

**게임 생성 API 불일치**:
```typescript
// 현재 프론트엔드 추정
interface GameCreateRequest {
  gameName?: string;
  maxPlayers: number;
}

// 실제 백엔드 요구사항 
interface GameCreateRequest {
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  subjectIds: number[];
  useRandomSubjects: boolean;
  randomSubjectCount: number;
  targetPoints: number;
}
```

**투표 API 이중 구조**:
- 기존 API: `POST /api/v1/game/vote` (권장하지 않음)
- 신규 API: `POST /api/v1/game/cast-vote` (권장)
- 필드명 차이: `targetPlayerId` vs `targetUserId`

**채팅 메시지 타입 변경**:
- 기존: `"NORMAL"` → 현재: `"DISCUSSION"`
- 전체 타입 체계 업데이트 필요

#### 2. 프론트엔드 API 타입 정의 구식화
- `src/shared/api/endpoints/index.ts`의 엔드포인트가 실제 백엔드와 불일치
- API 클라이언트 타입 정의 전면 재작성 필요
- WebSocket 메시지 타입 검증 필요

### 🔧 개발 환경 호환성

#### ✅ 호환성 확인 완료
- **Vite 설정**: React 19, TypeScript 5.8 지원 완료
- **ESLint/Prettier**: 최신 설정으로 구성됨
- **테스트 환경**: Vitest, Testing Library 준비 완료
- **빌드 최적화**: 코드 스플리팅, 번들 최적화 설정됨

#### ⚠️ 주의사항
- Mantine UI와 shadcn/ui 동시 사용으로 스타일 충돌 가능성
- Styled Components와 Tailwind CSS 혼재 사용

## 🎯 즉시 해결 필요 사항

### Priority 1: API 타입 정의 수정 (1일)
1. `src/shared/api/types.ts` 백엔드 명세에 맞게 전면 재작성
2. `src/shared/api/endpoints/index.ts` 엔드포인트 URL 업데이트
3. 모든 API 호출 함수 타입 정의 수정

### Priority 2: 채팅 시스템 타입 수정 (0.5일)
1. `ChatMessageType` 타입 정의 수정
2. 모든 채팅 관련 컴포넌트에서 `"NORMAL"` → `"DISCUSSION"` 변경
3. WebSocket 메시지 핸들링 로직 검증

### Priority 3: 게임 생성 플로우 재설계 (1일)
1. 게임 생성 요청 DTO 구조 완전히 재설계
2. 게임 설정 UI 컴포넌트 요구사항 재정의
3. 응답 처리 로직 수정 (객체 → 숫자)

## 📋 1단계 진행 전 체크리스트

- [ ] **API 타입 정의 수정 완료**
  - [ ] GameCreateRequest 인터페이스 수정
  - [ ] ChatMessageType 열거형 수정
  - [ ] 투표 API 타입 정의 (신규 방식 사용)
  
- [ ] **공통 모듈 호환성 검증**
  - [ ] WebSocket 메시지 타입 실제 테스트
  - [ ] API 클라이언트 실제 백엔드 연동 테스트
  - [ ] 게임 생성 → 참여 → 시작 플로우 테스트

- [ ] **의존성 충돌 해결**
  - [ ] Mantine vs shadcn/ui 스타일 격리 전략 수립
  - [ ] Styled Components 사용 범위 정의
  - [ ] Tailwind CSS 우선순위 설정

## 🚀 1단계 권장 시작 전략

### 병렬 진행 가능 작업
1. **API 타입 수정** (frontend-developer)
2. **shadcn/ui 컴포넌트 설정** (ui-ux-designer)  
3. **애니메이션 시스템 설계** (frontend-developer)

### 순차 진행 필요 작업
1. API 타입 수정 → 백엔드 연동 테스트
2. 기본 컴포넌트 구축 → 게임 페이지 구현
3. WebSocket 타입 검증 → 실시간 기능 통합

## ⏱️ 수정된 일정 예상

| 우선순위 | 작업 | 예상 시간 | 담당자 |
|---------|------|-----------|--------|
| P1 | API 타입 정의 수정 | 1일 | frontend-developer |
| P1 | 채팅 타입 수정 | 0.5일 | frontend-developer |
| P2 | 백엔드 연동 테스트 | 1일 | test-engineer |
| P3 | UI 라이브러리 충돌 해결 | 0.5일 | ui-ux-designer |

**총 추가 소요 시간**: 3일  
**기존 1단계 예상 기간**: 5-7일  
**수정된 1단계 예상 기간**: 8-10일

## 🎯 결론 및 권고사항

### ✅ 프로젝트 진행 가능성: 높음
- 기존 Light 버전의 아키텍처가 견고하여 Main 버전 개발에 유리
- 필요한 기술 스택이 이미 준비되어 있어 추가 설정 작업 최소화
- 공통 모듈 재사용으로 개발 효율성 극대화 가능

### ⚠️ 즉시 조치 필요사항
1. **백엔드 API 명세 불일치 해결** - 개발 시작 전 필수
2. **타입 안전성 강화** - 런타임 오류 방지를 위해 우선순위 높음
3. **UI 라이브러리 통합 전략** - 일관된 디자인 시스템 구축 필요

### 🚀 1단계 진행 준비 완료
API 타입 정의 수정 작업 완료 후 1단계(아키텍처 설정) 진행 권장합니다.
