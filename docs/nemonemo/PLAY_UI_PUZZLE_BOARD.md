# Puzzle Board Layout Spec (행/열 힌트 통합)

## 배경
- 현재 `PuzzlePlayPage`에서는 캔버스와 힌트 요약이 분리되어 있어 사용자가 행/열 힌트를 확인하려면 오른쪽 패널을 계속 확인해야 함.
- 전통적인 네모네모 UI처럼 행/열 힌트를 캔버스와 한 덩어리로 배치해 직관성을 높이려는 요구가 있었음.

## 목표 UX
1. **통합 배치**: 상단(열 힌트)과 좌측(행 힌트)이 퍼즐 셀과 같은 좌표계에 붙어 있는 ㄱ자 형태.
2. **완료 상태 시각화**: 각 행/열 힌트는 해당 줄이 완성되면 흐린 회색, 미완료면 기본 색.
3. **포커스 연동**: 사용자가 셀에 hover/포커스할 때 해당 행/열 힌트도 강조 표시.
4. **스크롤/줌 대응**: 힌트 영역은 고정, 셀 영역만 스크롤/핀치-줌이 가능하도록 여지 확보(이번 단계에서는 고정 배율, 차후 확장 예정).

## 구현 계획
- 새 컴포넌트 `PuzzleBoard`를 추가하여 힌트+셀을 한 레이어에서 그리도록 구성.
- `PuzzleBoard`는 `width`, `height`, `rowHints`, `colHints`와 store에서 가져온 `grid` 정보를 props로 받는다.
- 레이아웃은 CSS Grid로 구성:
  - `grid-template-columns`: `[corner] auto [colHints] repeat(width)` 구조.
  - `grid-template-rows`: `[corner] auto [rowHints] repeat(height)` 구조.
  - 좌상단 코너는 빈 공간, 상단 행은 열 힌트를, 좌측 열은 행 힌트를, 나머지는 셀 버튼을 배치.
- 힌트 렌더링:
  - 각 힌트 칸은 `flex` column으로 숫자를 아래→위(열), 오른쪽→왼쪽(행) 순으로 정렬해 가독성을 유지.
  - 완료 여부 판단은 `grid.cells`와 정답 힌트 비교 대신 단순히 현재 입력에서 각 행/열이 요구 수만큼 채워졌는지 계산(추후 solver 기반 검증은 별도 이슈로 남김).
- 포커스/hover 연동:
  - `PuzzleBoard` 내부에서 `onMouseEnter`/`onMouseLeave`로 현재 hover 중인 행/열 index를 state로 들고, 해당 index 힌트와 셀에 강조 클래스 적용.
- 접근성:
  - 기존 `button` gridcell 구조 유지. 힌트 요소에도 `aria-label`을 추가해 스크린리더가 정보를 읽을 수 있게 함.

## 컴포넌트/상태 영향
- `PuzzleCanvas`를 `PuzzleBoard`로 대체하되, store 형태(`grid.cells`, `updateCell`)는 그대로 활용.
- `PuzzlePlayPage`는 API에서 받아온 `data.hints.rows/cols`를 `PuzzleBoard`에 전달.
- 향후 힌트 완료 여부 계산 위한 util(`calculateHintBlocks(cells, width, height)`) 추가 예정.

## 테스트 전략
1. **단위 테스트**: 기존에 없는 영역이라 우선 Storybook/Playwright 중심으로 커버. 컴포넌트 단에서는 React Testing Library로 행/열 힌트 개수, 셀 렌더링 갯수 체크.
2. **Playwright**: autosave E2E에 `data-testid="puzzle-board"`를 추가하고, 힌트 텍스트가 화면에 있는지 검증.
3. **접근성**: `aria-label`, `role="grid"` 유지 여부를 RTL 스냅샷으로 확인.

## 추후 과제
- 반응형(모바일)에서 힌트 영역을 접거나 축소하는 토글 추가.
- 힌트 완료 상태를 서버 정답/실시간 solver 결과 기반으로 체크하는 기능.
