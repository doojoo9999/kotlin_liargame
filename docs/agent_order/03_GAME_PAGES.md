# 3단계: 게임 페이지 구현

## 🎯 목표
게임의 모든 단계별 페이지를 구현하여 완전한 게임 플로우 구축

## 🔧 주요 작업

### 3.1 로비 및 게임 설정 페이지

#### LobbyPage (메인 로비)
- [ ] 활성 게임방 목록 표시
- [ ] 게임방 검색/필터링 기능
- [ ] 실시간 게임방 상태 업데이트
- [ ] 게임 생성 플로팅 버튼

**담당 에이전트**: `frontend-developer`

#### GameCreatePage (게임 생성)
- [ ] 게임 설정 폼 (참여자 수, 라이어 수, 라운드 수)
- [ ] 게임 모드 선택 (LIARS_KNOW vs LIARS_DIFFERENT_WORD)
- [ ] 주제 선택 인터페이스 (개별 선택 vs 랜덤)
- [ ] 설정 미리보기 및 검증

**담당 에이전트**: `ui-ux-designer` + `frontend-developer`

**예상 작업 시간**: 3-4일

### 3.2 게임방 대기실

#### GameWaitingRoom
- [ ] 참여자 목록 실시간 표시
- [ ] 게임 설정 정보 표시
- [ ] 채팅 인터페이스 (자유 채팅)
- [ ] 게임 시작 버튼 (방장 전용)
- [ ] 나가기/강퇴 기능

**핵심 기능**:
```typescript
interface GameWaitingRoomProps {
  game: Game;
  players: Player[];
  isOwner: boolean;
  onStartGame: () => void;
  onLeaveGame: () => void;
}
```

**담당 에이전트**: `frontend-developer`

**예상 작업 시간**: 2-3일

### 3.3 게임 진행 페이지들

#### GamePlayPage (메인 게임 화면)
- [ ] 단계별 컴포넌트 렌더링
- [ ] 게임 상태 표시 (라운드, 단계, 타이머)
- [ ] 플레이어 목록 및 상태
- [ ] 채팅 영역
- [ ] 개인 정보 패널 (역할, 단어)

**레이아웃 구조**:
```
┌─────────────┬─────────────────┬─────────────┐
│   Players   │   Game Stage    │    Chat     │
│   Sidebar   │     Content     │   Sidebar   │
│             │                 │             │
│             ├─────────────────┤             │
│             │   Game Info     │             │
└─────────────┴─────────────────┴─────────────┘
```

**담당 에이전트**: `game-designer` + `frontend-developer`

**예상 작업 시간**: 5-6일

### 3.4 게임 단계별 컴포넌트

#### WaitingForPlayersStage
- [ ] 게임 시작 카운트다운
- [ ] 준비 상태 확인
- [ ] 마지막 설정 변경 기회

#### SpeechStage (힌트 제공)
- [ ] 현재 발언자 강조 표시
- [ ] 턴 순서 인디케이터
- [ ] 힌트 입력 인터페이스 (발언자용)
- [ ] 힌트 히스토리 표시
- [ ] 발언 시간 타이머

```typescript
interface SpeechStageProps {
  currentPlayer: Player;
  turnOrder: Player[];
  currentTurnIndex: number;
  hints: Hint[];
  onSubmitHint: (hint: string) => void;
  timeRemaining: number;
}
```

**담당 에이전트**: `game-designer`

#### VotingForLiarStage (라이어 투표)
- [ ] 플레이어 선택 인터페이스
- [ ] 투표 현황 실시간 표시 (익명)
- [ ] 투표 확정 인터페이스
- [ ] 투표 마감 타이머

**담당 에이전트**: `frontend-developer`

#### DefendingStage (변론)
- [ ] 지목된 플레이어 강조
- [ ] 변론 입력 인터페이스 (지목자용)
- [ ] 변론 내용 표시
- [ ] 변론 시간 타이머
- [ ] 변론 즉시 종료 버튼

**담당 에이전트**: `frontend-developer`

#### VotingForSurvivalStage (최종 투표)
- [ ] 처형/생존 투표 인터페이스
- [ ] 투표 현황 표시
- [ ] 투표 결과 공개 애니메이션
- [ ] 다음 단계 안내

**담당 에이전트**: `frontend-developer`

#### GuessingWordStage (라이어 추측)
- [ ] 라이어 전용 단어 입력
- [ ] 추측 결과 즉시 표시
- [ ] 게임 종료 처리

**담당 에이전트**: `frontend-developer`

**예상 작업 시간**: 6-7일

### 3.5 결과 페이지

#### GameResultPage
- [ ] 승리 팀 및 이유 표시
- [ ] 플레이어별 역할 공개
- [ ] 게임 통계 (플레이 시간, 점수 등)
- [ ] 다음 라운드/새 게임 버튼
- [ ] 로비로 돌아가기

**담당 에이전트**: `ui-ux-designer`

**예상 작업 시간**: 2일

## 📱 모바일 최적화

### 모바일 전용 컴포넌트
- [ ] **BottomSheet**: 모바일용 정보 표시
- [ ] **TabNavigation**: 게임 정보 탭 전환
- [ ] **FloatingActionButton**: 주요 액션 버튼
- [ ] **SwipeGesture**: 스와이프 인터랙션

**담당 에이전트**: `frontend-developer`

### 터치 최적화
- [ ] 최소 터치 영역 44px 보장
- [ ] 스와이프 제스처 지원
- [ ] 드래그 앤 드롭 인터페이스
- [ ] 햅틱 피드백 (지원 디바이스)

## 🎮 게임 UX 개선사항

### 실시간성 강화
- [ ] WebSocket 연결 상태 표시
- [ ] 네트워크 지연 시 로딩 표시
- [ ] 오프라인 모드 대응
- [ ] 재연결 자동화

### 접근성 개선
- [ ] 키보드 내비게이션 지원
- [ ] 스크린 리더 호환성
- [ ] 고대비 모드 지원
- [ ] 텍스트 크기 조절 지원

**담당 에이전트**: `frontend-developer`

## 📋 페이지별 라우팅 구조
```
/main/
├── /lobby                    # 메인 로비
├── /create                   # 게임 생성
├── /game/:gameNumber
│   ├── /waiting             # 대기실
│   ├── /play                # 게임 진행
│   └── /result              # 결과
└── /profile                 # 사용자 프로필
```

## ⚠️ 리스크 및 대응방안

### 백엔드 연동 리스크
- **API 명세 불일치**: `API_DTO_SPECIFICATION.md` 기준 철저한 검증
- **투표 API 선택**: 신규 `/cast-vote` API 사용 결정 및 테스트
- **채팅 타입**: `NORMAL` → `DISCUSSION` 변경사항 반영
- **WebSocket 대역폭**: 대용량 메시지 처리 최적화

### 복잡도 관리 전략
- **게임 단계 방식**: 단계별 컴포넌트 점진적 개발
- **에러 처리**: WebSocket 연결 끊김/재연결 시나리오 대응
- **상태 동기화**: 실시간 게임 상태와 UI 상태 불일치 방지

## 🤝 에이전트 협업 최적화

### 병렬 개발 가능 영역
1. **로비 페이지** (`frontend-developer`) + **게임 선이바이션** (`game-designer`) 동시
2. **모바일 최적화** (`frontend-developer`) + **접근성** (`ui-ux-designer`) 독립
3. **게임 단계별 컴포넌트** 병렬 개발 (단계별 전담 에이전트)

### MVP 우선순위 정리

#### Phase 1 (MVP - 핵심 기능)
- [ ] LobbyPage, GameCreatePage 기본 기능
- [ ] GameWaitingRoom 참여자 관리
- [ ] SpeechStage, VotingForLiarStage 핵심 로직
- [ ] 기본 게임 플로우 부분

#### Phase 2 (Enhancement)
- [ ] DefendingStage, VotingForSurvivalStage 고도화
- [ ] GuessingWordStage, GameResultPage 완성형
- [ ] 모바일 최적화 및 접근성
- [ ] 고급 애니메이션 및 UX 개선

## 📋 완료 조건
- [ ] **MVP 게임 단계 100% 작동**
- [ ] **백엔드 API 연동 정상 동작**
- [ ] WebSocket 실시간 통신 안정성 확보
- [ ] 기본 모바일 반응형 디자인 완성
- [ ] 게임 플로우 통합 테스트 통과

## 🔄 다음 단계
`04_REALTIME_INTEGRATION.md` - WebSocket 및 실시간 기능 통합

**다음 단계 준비사항**:
- [ ] 모든 페이지 컴포넌트 완성 후 WebSocket 통합 시작
- [ ] API 연동 테스트 결과를 4단계에 반영