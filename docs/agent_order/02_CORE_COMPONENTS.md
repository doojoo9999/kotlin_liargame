# 2단계: 핵심 UI 컴포넌트 개발

## 🎯 목표
게임에 필요한 핵심 UI 컴포넌트들을 현대적 디자인으로 구현

## 🔧 주요 작업

### 2.1 기본 UI 컴포넌트 개선
- [ ] **PlayerCard**: 플레이어 정보 카드 (아바타, 닉네임, 상태 표시)
- [ ] **GameCard**: 게임방 정보 카드 (참여자, 설정 표시)
- [ ] **StatusBadge**: 플레이어/게임 상태 뱃지 (애니메이션 포함)
- [ ] **ProgressBar**: 게임 진행도 표시
- [ ] **Timer**: 단계별 타이머 컴포넌트

**담당 에이전트**: `frontend-developer` + `ui-ux-designer`

**기술 스택**: shadcn/ui + Framer Motion

**예상 작업 시간**: 2-3일

### 2.2 게임 전용 컴포넌트
- [ ] **TurnIndicator**: 턴 순서 표시 컴포넌트
- [ ] **HintDisplay**: 힌트 표시 및 히스토리
- [ ] **VoteInterface**: 투표 UI (플레이어 선택)
- [ ] **ChatBox**: 실시간 채팅 인터페이스
- [ ] **DefensePanel**: 변론 입력/표시 패널

**담당 에이전트**: `game-designer` + `frontend-developer`

**예상 작업 시간**: 3-4일

### 2.3 레이아웃 컴포넌트
- [ ] **GameLayout**: 게임 화면 전용 레이아웃
- [ ] **LobbyLayout**: 로비 화면 레이아웃
- [ ] **Sidebar**: 게임 정보 사이드바
- [ ] **Header**: 네비게이션 헤더
- [ ] **Modal**: 공통 모달 컴포넌트

**담당 에이전트**: `ui-ux-designer` + `frontend-developer`

**예상 작업 시간**: 2일

### 2.4 애니메이션 컴포넌트
- [ ] **PageTransition**: 페이지 전환 애니메이션
- [ ] **StageTransition**: 게임 단계 전환 효과
- [ ] **CountdownAnimation**: 카운트다운 애니메이션
- [ ] **VoteReveal**: 투표 결과 공개 애니메이션
- [ ] **NotificationToast**: 알림 토스트

**담당 에이전트**: `frontend-developer`

**기술 스택**: Framer Motion

**예상 작업 시간**: 2-3일

## 📋 컴포넌트별 세부 요구사항

### PlayerCard
```typescript
interface PlayerCardProps {
  player: Player;
  isCurrentTurn?: boolean;
  showRole?: boolean;
  onVote?: (playerId: number) => void;
  size?: 'sm' | 'md' | 'lg';
}
```
- 플레이어 상태별 시각적 구분
- 턴 강조 애니메이션
- 투표 가능/불가능 상태 표시

### VoteInterface
```typescript
interface VoteInterfaceProps {
  players: Player[];
  onVote: (playerId: number) => void;
  disabled?: boolean;
  votedFor?: number;
}
```
- 플레이어 선택 인터페이스
- 투표 확정 전 미리보기
- 중복 투표 방지

### HintDisplay
```typescript
interface HintDisplayProps {
  hints: Hint[];
  currentPlayer?: string;
  showTimestamp?: boolean;
  compact?: boolean;
}
```
- 힌트 히스토리 타임라인
- 현재 발언자 강조
- 스크롤 최적화

## 📱 반응형 디자인 요구사항
- **Desktop**: 3컬럼 레이아웃 (사이드바, 메인, 채팅)
- **Tablet**: 2컬럼 레이아웃 (메인, 오버레이 채팅)
- **Mobile**: 1컬럼 레이아웃 (탭 기반 전환)

## 🎨 디자인 시스템
- **색상**: 게임 단계별 테마 색상 정의
- **타이포그래피**: Pretendard 폰트 사용
- **간격**: 8px 그리드 시스템
- **애니메이션**: 300ms ease-out 기본

## 📋 완료 조건
- [ ] 모든 컴포넌트 Storybook 등록
- [ ] TypeScript 타입 안전성 확보
- [ ] 반응형 디자인 검증
- [ ] 접근성 검수 완료

## 🔄 다음 단계
`03_GAME_PAGES.md` - 게임 페이지 구현