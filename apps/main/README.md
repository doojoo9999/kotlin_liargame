# Party Games Hub

메인 페이지 SPA로 모든 게임 프로젝트의 진입점을 제공합니다.  
환경 변수로 각 게임의 URL을 제어하며, 기본값은 로컬 개발 포트(5173/5273/5373/5473)를 사용합니다.

## 빠른 실행
```bash
cd apps/main
npm install
npm run dev
```

## 환경 변수
`.env` 또는 `.env.local`에 다음 값을 설정해 배포 환경에 맞는 URL을 연결하세요.

```
VITE_LIAR_GAME_URL=https://example.com/liar
VITE_NEMONEMO_URL=https://example.com/nemonemo
VITE_ROULETTE_URL=https://example.com/roulette
VITE_SADARI_GAME_URL=https://example.com/sadari
```

필요 시 더 많은 앱을 추가하려면 `src/App.tsx`의 `gameLinks` 배열을 확장하면 됩니다.
