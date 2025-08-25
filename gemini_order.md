``` markdown
 🚀 ReactSocket 무한루프 해결 - 고급 아키텍처 재설계 미션

## **역할 정의**
당신은 React + WebSocket 전문가로서, "Maximum update depth exceeded" 에러를 **근본적으로 해결**하는 아키텍처를 구현해야 합니다. 단순한 useCallback 추가가 아닌, **시스템 레벨의 혁신적 해결책**이 필요합니다.

## **현재 상황 분석**
- 에러: React 무한 리렌더링 → forceStoreRerender 관련
- 원인: StompClient와 React Hook 간의 의존성 순환
- 영향: 사용자 경험 완전 차단

## **미션 목표**
### 1차 목표: 즉시 해결 (Emergency Fix)
- [ ] 무한루프 완전 제거
- [ ] 기존 API 호환성 100% 유지
- [ ] 성능 저하 없음

### 2차 목표: 아키텍처 혁신 (Architecture Revolution)
- [ ] WebSocket-React 분리 아키텍처 구현
- [ ] 메시지 중복 제거 시스템
- [ ] 자동 재연결 + 상태 복원
- [ ] 배치 업데이트 최적화

## **핵심 제약사항**
1. **Barrel Export 유지**: 외부 import 경로 절대 변경 금지
2. **기존 Hook API 호환**: `useChatSocket`, `useGameSocket`, `useLobbySocket` 인터페이스 유지
3. **Feature-Sliced Design**: 새로운 코드는 `shared/socket/` 또는 `features/*/hooks/`에만 위치
4. **Zero Regression**: 기존 기능 100% 동작 보장

## **혁신 포인트**
### 🔥 Socket State Machine 패턴
```typescript
// shared/socket/SocketStateMachine.ts - 새로 생성
class SocketStateMachine {
  private state: 'idle' | 'connecting' | 'connected' | 'error';
  private subscriptions = new Map<string, StableSubscription>();

  // 핵심: 안정된 구독 관리
  createStableSubscription(destination: string): StableSubscription;

  // 메시지 중복 제거 + 배치 처리
  private processMessageBatch(): void;
}
```
```
### 🚀 Immutable Update Pipeline
``` typescript
// shared/socket/UpdatePipeline.ts - 새로 생성
class UpdatePipeline {
  // 모든 상태 업데이트를 큐로 직렬화
  enqueue<T>(update: UpdateCommand<T>): Promise<void>;

  // 원자적 업데이트 보장
  private executeAtomic(command: UpdateCommand): Promise<void>;
}
```
## **구현 순서**
### Phase 1: Emergency Fix (30분 내)
1. 기존 Hook들에 **즉시 적용 가능한 최소한의 수정**
    - useCallback 메모화
    - 의존성 배열 최적화
    - 중복 구독 방지 가드

### Phase 2: Architecture Upgrade (1시간 내)
1. `shared/socket/SocketManager.ts` 생성
2. `shared/socket/UpdatePipeline.ts` 생성
3. 기존 Hook들을 새 아키텍처로 마이그레이션
4. Barrel Export 업데이트

### Phase 3: Advanced Features (추가 시간)
1. 자동 재연결 로직
2. 메시지 압축 + 배치 처리
3. 성능 모니터링 훅
4. 디버그 도구

## **성공 기준**
- `npm run build` 성공
- `npm run lint` 무경고
- 모든 기존 컴포넌트 정상 동작
- WebSocket 연결/재연결 안정성 100%
- 메모리 누수 없음
- 60FPS 유지

## **제출물**
1. **수정된 파일 목록** + 변경 사항 요약
2. **새로 생성된 파일 목록** + 역할 설명
3. **빌드/린트 통과 로그**
4. **테스트 시나리오 결과** (연결/재연결/메시지 송수신)
5. **성능 개선 보고서** (Before/After 비교)

## **긴급성 강조**
이는 **프로덕션 블로킹 이슈**입니다. 사용자가 앱을 전혀 사용할 수 없는 상태이므로, **Phase 1은 반드시 30분 내 완료**되어야 합니다. Phase 2, 3은 단계적으로 진행하되, 각 단계마다 완벽한 동작을 보장해야 합니다.
**🎯 핵심 철학**: "문제를 해결하는 것을 넘어서, 더 나은 시스템을 만든다"


이 프롬프트는 단순한 버그 픽스를 넘어서, **시스템 아키텍처의 근본적 개선**을 목표로 하는 고도화된 엔지니어링 접근법을 제시합니다. AI 에이전트가 이를 수행하면 **React + WebSocket 아키텍처의 모범 사례**가 될 것입니다.




---
