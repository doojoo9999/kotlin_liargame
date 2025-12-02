# Analytics (GA4)

- 모든 프런트엔드 앱(main, liar-game, blockblast, nemonemo, roulette, pinball, sadari-game, lineagew-admin)에서 GA4 스크립트를 자동 로드합니다.
- 기본 Measurement ID는 `G-LN9LN30S0S`로 설정되어 있으며, 환경별로 덮어쓰려면 `.env` 또는 실행 환경에 `VITE_GA_MEASUREMENT_ID=G-...`를 지정하세요.
- SPA 라우터에서 클라이언트 내 페이지 이동 시에는 `window.gtag('config', measurementId, {page_path: location.pathname})`를 함께 호출해 페이지뷰를 전송하세요.
- 여러 도메인/서브도메인을 쓸 경우 GA4 데이터 스트림의 도메인 구성에서 cross-domain 설정을 추가해 세션 단절을 줄일 수 있습니다.
