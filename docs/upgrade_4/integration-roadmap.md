# Frontend-Backend Integration Roadmap

## 개요

대형 통합 프롬프트를 Claude 4 Sonnet이 효율적으로 처리할 수 있도록 6개의 단계별 프롬프트로 분할했습니다.

## 단계별 진행 순서

### Phase 1: API Infrastructure Setup
**파일**: `phase-1-api-infrastructure.md`
**소요 시간**: 2-3시간
**목표**: 기본 HTTP 클라이언트와 API 서비스 레이어 구축

**주요 작업**:
- Axios 기반 API 클라이언트 설정
- 요청/응답 인터셉터 구현
- 오류 처리 시스템 구축
- 기본 타입 정의
- API 엔드포인트 설정

**전제 조건**: 없음
**산출물**: 완전한 API 서비스 레이어

---

### Phase 2: Authentication System
**파일**: `phase-2-authentication.md`
**소요 시간**: 1-2시간
**목표**: 세션 기반 인증 시스템 구현

**주요 작업**:
- AuthService 클래스 구현
- AuthStore 수정 (패스워드 인증 추가)
- 세션 관리 및 자동 갱신
- 보호된 라우팅 설정
- 로그인 페이지 연동

**전제 조건**: Phase 1 완료
**산출물**: 완전한 인증 시스템

---

### Phase 3: Game Management APIs
**파일**: `phase-3-game-management.md`
**소요 시간**: 2-3시간
**목표**: 게임방 관리 API 연동

**주요 작업**:
- GameService 클래스 구현
- 게임 생성/참여/나가기 API 연동
- GameStore 수정
- GameRoomsSection 컴포넌트 연동
- 게임방 목록 관리

**전제 조건**: Phase 1, 2 완료
**산출물**: 완전한 게임방 관리 시스템

---

### Phase 4: WebSocket Real-time Communication
**파일**: `phase-4-websocket-realtime.md`
**소요 시간**: 3-4시간
**목표**: SockJS + STOMP 기반 실시간 통신 구현

**주요 작업**:
- SockJS + STOMP 클라이언트 설정
- WebSocketService 클래스 구현
- 재연결 로직 구현
- 게임 이벤트 구독/발행
- 실시간 상태 동기화

**전제 조건**: Phase 1, 2, 3 완료
**산출물**: 완전한 실시간 통신 시스템

---

### Phase 5: Game Flow Implementation
**파일**: `phase-5-game-flow.md`
**소요 시간**: 4-5시간
**목표**: 게임 진행 로직 API 연동

**주요 작업**:
- 게임 시작 API 연동
- 힌트 제공 시스템
- 투표 시스템 구현
- 변론 시스템 구현
- 게임 결과 처리
- 채팅 시스템 연동

**전제 조건**: Phase 1, 2, 3, 4 완료
**산출물**: 완전한 게임플레이 시스템

---

### Phase 6: Advanced Features & Testing
**파일**: `phase-6-advanced-features.md`
**소요 시간**: 2-3시간
**목표**: 고급 기능 구현 및 테스트 코드 작성

**주요 작업**:
- 단위 테스트 작성
- 통합 테스트 구현
- E2E 테스트 설정
- 성능 최적화
- 오류 시나리오 처리
- 프로덕션 준비

**전제 조건**: Phase 1-5 모두 완료
**산출물**: 프로덕션 준비 완료된 시스템

## 의존성 다이어그램

```
Phase 1 (API Infrastructure)
    ↓
Phase 2 (Authentication)
    ↓
Phase 3 (Game Management)
    ↓
Phase 4 (WebSocket)
    ↓
Phase 5 (Game Flow)
    ↓
Phase 6 (Testing & Polish)
```

## 각 단계별 성공 기준

### Phase 1 ✅
- [ ] API 클라이언트 정상 동작
- [ ] 오류 처리 시스템 동작
- [ ] 타입 정의 완료

### Phase 2 ✅
- [ ] 로그인/로그아웃 동작
- [ ] 세션 관리 동작
- [ ] 보호된 라우팅 동작

### Phase 3 ✅
- [ ] 게임방 생성 동작
- [ ] 게임방 참여 동작
- [ ] 게임방 목록 조회 동작

### Phase 4 ✅
- [ ] WebSocket 연결 성공
- [ ] 실시간 이벤트 수신 동작
- [ ] 재연결 로직 동작

### Phase 5 ✅
- [ ] 게임 시작부터 종료까지 완전 동작
- [ ] 모든 게임 단계 정상 진행
- [ ] 채팅 시스템 동작

### Phase 6 ✅
- [ ] 테스트 커버리지 80% 이상
- [ ] 성능 요구사항 만족
- [ ] 프로덕션 배포 준비 완료

## 주의사항

1. **순서대로 진행**: 각 단계는 이전 단계의 완료를 전제로 합니다
2. **테스트 우선**: 각 단계 완료 후 반드시 동작 테스트를 진행하세요
3. **점진적 통합**: 한 번에 모든 것을 바꾸지 말고 단계별로 진행하세요
4. **오류 처리**: 각 단계마다 적절한 오류 처리를 구현하세요

## 예상 총 소요 시간

- **개발**: 14-20시간
- **테스트**: 6-8시간
- **총계**: 20-28시간 (약 3-4일)

각 프롬프트는 Claude 4 Sonnet이 효율적으로 처리할 수 있는 크기(200-400라인)로 설계되었습니다.