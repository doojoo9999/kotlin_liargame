# Nemonemo Web Client

Vite + React + TypeScript 기반의 네모네모로직 프론트엔드 워크스페이스입니다. `docs/nemonemo/DEVELOPMENT_PLAN.md`에 정의된 기능 트랙을 구현하기 위한 스캐폴드를 포함합니다.

## 주요 스택

- React 18 + React Router 7
- TanStack Query 5 (데이터 동기화)
- Zustand + Immer (게임/알림 전역 상태)
- Tailwind CSS 3 + Radix UI (스타일/컴포넌트)
- i18next (다국어), Konva 플레이 캔버스 플러그인 준비

## 실행 방법

```bash
cd apps/nemonemo
npm install
npm run dev
```

환경 변수:

- `VITE_API_BASE_URL` (기본: `http://localhost:8080/api/v2/nemonemo`)

## 디렉터리 구조

```
src/
  components/        # 공용 UI 컴포넌트 (Layout, Toast 등)
  features/          # React Query 훅, 도메인 기능 모듈
  hooks/             # 커스텀 훅 (예: 게스트 subject key)
  lib/               # axios 클라이언트, i18n, queryClient, queryKeys
  routes/            # 페이지/라우팅 구성
  store/             # Zustand 스토어 (게임 진행, 알림 등)
```

## 다음 단계

- Konva/Pixi 기반 플레이 캔버스 구현
- TanStack Query와 백엔드 API 연동
- Vitest + Testing Library로 컴포넌트 테스트 작성
- Storybook 또는 Chromatic으로 UI 문서화
- Tailwind design tokens → design-tokens.json 싱크
