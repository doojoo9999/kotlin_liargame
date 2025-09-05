# 0단계: 프리플라이트 분석 및 준비

## 🎯 목표
Main Version 개발 시작 전 현 상황을 정확히 파악하고, 잠재적 위험 요소를 미리 식별하여 성공적인 개발 진행을 위한 기반 마련

## 🔧 주요 작업

### 0.1 Light 버전 코드 상세 분석

#### 기존 아키텍처 조사
- [ ] `src/versions/light/` 디렉토리 구조 완전 분석
- [ ] 사용 중인 기술 스택 및 라이브러리 버전 확인
- [ ] 컴포넌트 설계 패턴 및 상태 관리 방식 파악
- [ ] 라우팅 구조 및 페이지 구성 분석

#### 기존 공통 모듈 호환성 확인
- [ ] `src/shared/` 디렉토리 API 클라이언트 분석
- [ ] Zustand 스토어 구조 및 상태 관리 방식 확인
- [ ] WebSocket 구현 및 연결 방식 검증
- [ ] 공통 유틸리티 함수 및 타입 정의 검토

```typescript
// 기존 공통 모듈 구조 분석 예시
interface SharedModuleAnalysis {
  apiClient: {
    baseUrl: string;
    authMethods: string[];
    existingEndpoints: string[];
  };
  storeStructure: {
    gameStore: any;
    userStore: any;
    uiStore?: any;
  };
  webSocketConfig: {
    connectionManager: any;
    messageTypes: string[];
    subscriptionPattern: any;
  };
}
```

**담당 에이전트**: `frontend-developer` + `code-reviewer`

**예상 작업 시간**: 1일

### 0.2 백엔드 API 최신 명세 검증 ⚠️

#### API 엔드포인트 실제 동작 확인
- [ ] `API_DTO_SPECIFICATION.md`의 모든 엔드포인트 실제 테스트
- [ ] 게임 생성 API Response 타입 확인 (객체 vs 숫자)
- [ ] 투표 API 양쪽 버전 동작 테스트 (`/vote` vs `/cast-vote`)
- [ ] 채팅 API 메시지 타입 실제 확인 (`NORMAL` vs `DISCUSSION`)

#### WebSocket 메시지 타입 검증
- [ ] 실제 WebSocket 연결하여 메시지 포맷 확인
- [ ] 게임 상태 변경 시 브로드캐스트 메시지 분석
- [ ] 채팅 메시지 실시간 전송/수신 테스트
- [ ] 연결 끊김/재연결 시나리오 동작 확인

#### API 문서와 실제 구현 차이점 문서화
- [ ] 발견된 모든 불일치 사항 정리
- [ ] 권장 사용법 및 대안 API 선택 기준 수립
- [ ] 프론트엔드에서 처리해야 할 예외 상황 목록화

**담당 에이전트**: `api-documenter` + `test-engineer`

**예상 작업 시간**: 1일

### 0.3 개발 환경 세팅 검증

#### 패키지 의존성 분석
- [ ] 기존 `package.json` 분석 및 충돌 가능성 확인
- [ ] shadcn/ui, Radix UI 호환성 사전 검증
- [ ] Framer Motion과 기존 애니메이션 라이브러리 충돌 검사
- [ ] TypeScript 버전 및 설정 호환성 확인

#### 빌드 시스템 점검
- [ ] Vite 설정 및 플러그인 호환성 확인
- [ ] ESLint, Prettier 설정과 새 기술 스택 호환성
- [ ] 테스트 환경 (Jest/Vitest) 준비 상태 점검
- [ ] 환경 변수 및 설정 파일 구조 분석

**담당 에이전트**: `deployment-engineer`

**예상 작업 시간**: 0.5일

### 0.4 잠재적 리스크 평가 및 대응 전략 수립

#### 기술적 리스크 분석
- [ ] Light 버전과 Main 버전 간 충돌 가능성 평가
- [ ] 백엔드 API 변경 빈도 및 영향도 분석
- [ ] 새로운 기술 스택 도입에 따른 학습 곡선 평가
- [ ] 성능 저하 위험 요소 식별 (번들 크기, 렌더링 성능)

#### 일정 리스크 대응 계획
- [ ] 각 단계별 최소 완성 기준 (MVP) 정의
- [ ] 백엔드 API 지연 시 프론트엔드 독립 개발 방안
- [ ] 기술적 난관 발생 시 대안 기술 스택 준비
- [ ] 테스트 실패율 예상 및 버퍼 시간 확보 계획

```typescript
// 리스크 매트릭스 예시
interface RiskAssessment {
  technicalRisks: {
    probability: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    mitigation: string;
  }[];
  scheduleRisks: {
    delayProbability: number; // days
    criticalPath: string[];
    bufferStrategies: string[];
  };
}
```

**담당 에이전트**: `task-decomposition-expert` + `project-manager`

**예상 작업 시간**: 0.5일

## 🎯 핵심 결과물

### 분석 보고서 작성
1. **현황 분석 보고서**: Light 버전 분석 및 공통 모듈 호환성
2. **API 검증 보고서**: 백엔드 명세 정확성 및 불일치 사항
3. **환경 검증 보고서**: 개발 환경 준비 상태 및 필요한 조치
4. **리스크 관리 계획서**: 식별된 위험 요소 및 대응 전략

### 개발 가이드라인 수립
- [ ] Main 버전 코딩 컨벤션 및 스타일 가이드
- [ ] 공통 모듈 사용법 및 확장 가이드라인
- [ ] API 클라이언트 구현 패턴 및 에러 처리 방식
- [ ] 컴포넌트 설계 원칙 및 재사용성 고려사항

## ⚠️ 중요 체크포인트

### Go/No-Go 결정 기준
다음 조건이 충족되지 않으면 1단계 진행을 연기하고 문제 해결 우선:

- [ ] **API 명세 정확성 95% 이상 확인**
- [ ] **기존 공통 모듈과 신규 기술 스택 호환성 확인**
- [ ] **개발 환경 완전 준비 완료**
- [ ] **리스크 대응 계획 승인 완료**

### 조기 경고 신호
다음 상황 발생 시 즉시 전략 재검토:

- 백엔드 API 명세와 실제 구현 차이 20% 초과
- 기존 공통 모듈과 신규 기술 스택 근본적 충돌
- 개발 환경 세팅에 2일 초과 소요
- 예상치 못한 고위험 기술적 장벽 발견

## 🤝 에이전트 협업 전략

### 병렬 작업 최적화
1. **코드 분석** (`frontend-developer`) + **API 검증** (`api-documenter`) 동시 진행
2. **환경 점검** (`deployment-engineer`) + **리스크 분석** (`task-decomposition-expert`) 독립 수행

### 결과물 통합 및 검토
- [ ] 각 에이전트 결과물 통합 리뷰 회의
- [ ] `code-reviewer`를 통한 분석 결과 검증
- [ ] 1단계 진행 여부 최종 결정 및 조치사항 도출

## 📋 완료 조건

- [ ] Light 버전 아키텍처 100% 이해 완료
- [ ] 백엔드 API 실제 동작 검증 완료
- [ ] 개발 환경 완전 준비 완료
- [ ] 모든 식별된 리스크에 대한 대응 계획 수립
- [ ] 1단계 진행 승인 및 팀 공유 완료

## 🔄 다음 단계

`01_ARCHITECTURE_SETUP.md` - 아키텍처 설정 (분석 결과 기반)

**1단계 시작 전 필수 확인사항**:
- [ ] API 명세 정확성 보고서 1단계 팀에 전달
- [ ] 개발 환경 설정 가이드 문서화 완료
- [ ] 리스크 모니터링 체크리스트 준비 완료