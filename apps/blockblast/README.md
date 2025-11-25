# Block Blast (Web)

Initial scaffolding for the R3F-based Block Blast clone outlined in `docs/blockblast`.

## What is here
- Vite + React + TypeScript setup with Tailwind and ESLint.
- Three.js / @react-three/fiber scene with interactive 16x16 board, 안개/조명/스파클 이펙트(`lowSpec`시 비활성).
- Zustand store for grid, tray, scoring, combo tracking, refresh/reset, combo 최고 기록.
- Grid utilities (placement, line clearing, rotation) with starter Vitest specs.
- HTML 트레이 선택/회전 + use-gesture 기반 드래그·드롭 오버레이, 햅틱/사운드 피드백, 선택 블록 3D 미니 트레이.
- UI 오버레이 (HUD, 설정: 뮤트/로우스펙/고스트 토글, 튜토리얼, 리더보드 API 연동, 게임오버 모달).

## Running
```bash
cd apps/blockblast
npm install
npm run dev
# npm test
```
Base path is `/blockblast/` with dev server on port `5178` (see `vite.config.ts`).

## Notes / Next steps
- 점수 제출/리더보드 호출은 `/api/blockblast/score`, `/api/blockblast/leaderboard` 상대 경로. 응답 스키마가 다르면 `useLeaderboard` 매핑을 조정하세요.
- 사운드는 내장 톤(`src/assets/sounds`)으로 연결돼 있으며 필요 시 `useAudio.setSources`로 교체 가능합니다.
- 후속: 포스트프로세싱/파티클 강화, 온보딩 오버레이, 모바일 터치 정밀도 보정, 아이템 UX(폭탄/리프레시/회전) 확장.
