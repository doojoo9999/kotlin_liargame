# Junie Project Guidelines

이 문서는 코딩 에이전트 Junie가 본 프로젝트에서 안정적으로 개발/리팩토링을 수행하기 위한 규칙과 절차를 정의합니다.
목표: 외부 API/동작/경로 안정성 유지, 작은 단위 작업, 일관된 구조, 자동 검증(빌드/린트/테스트).

## 1) 기술 스택 및 기본 규칙
- FE: React 18, Vite 5, MUI v5, @tanstack/react-query v5, react-window, Zustand
- 패키지 관리자: npm
- 환경변수: 반드시 Vite 표준 사용
  - import.meta.env.DEV / import.meta.env.PROD
  - VITE_* 접두어(.env.* 파일)
- 로깅: utils/logger 사용, 개발 모드에서만 상세 로그

## 2) 프로젝트 구조(요지)
- src/
  - pages/   (페이지 컨테이너, index.jsx를 공개 API로)
  - components/ (공용/복합 컴포넌트, index.js로 배포)
  - hooks/   (재사용 훅)
  - utils/   (상태/문자열/포맷/상수)
  - styles/  (테마/스타일 헬퍼)
  - stores/  (Zustand 등 상태)
- 원칙: 폴더별 “Barrel(공개 API) = index.js(x)”만 외부에서 import.
  - 예) import { ChatMessageList } from '@components' // OK
  - 예) import MessageItem from '@components/chat-message-list/components/MessageItem' // 금지

## 3) Barrel Export(공용 진입점) 정책
- 각 최상위 폴더/기능 폴더는 반드시 index.(js|jsx)를 제공하고, 외부는 오직 이 배럴만 import.
- 내부 파일·서브컴포넌트 경로로의 직접 import 금지.
- 세분화/재배치 시에도 외부 import 경로가 불변이 되도록 유지.

## 4) Import 경로 & Alias
- Vite alias 설정(예: @, @components, @pages, @hooks, @utils)을 사용.
- jsconfig/tsconfig paths 일치.
- 외부 import는 항상 alias + barrel을 통해서만.

## 5) 네이밍 & 파일 규칙
- JSX 포함 파일: .jsx (JSX를 .js에 사용 금지)
- 유틸/훅/아이콘/스타일 접미사:
  - *.utils.js, *.hook.js, *.icons.js, *.styles.js
- 컴포넌트 내부 구조(권장):
  - Feature/
    - index.jsx (공개 API)
    - components/* (내부)
    - hooks/* (내부)
    - utils/* (내부)
    - styles.(js|css-in-js)
    - README.md (선택)

## 6) 리팩토링 원칙(작업 단위/체인지 버짓)
- 한 번에 1 스코프(1 파일 또는 1 폴더)만 수정.
- 변경 파일 수 ≤ 10, 라인 수는 꼭 필요한 범위로 제한.
- 외부 공개 API/경로/동작/문구는 변경 금지(필요 시 별도 태스크로 분리).

## 7) 품질 가드(필수 실행)
- 빌드: npm run build (무오류)
- 린트: npm run lint (무경고 권장)
- 테스트: 도입 시 npm test (또는 명시된 스크립트)
- 접근성/성능 체크리스트(필요 시):
  - role/aria-live/aria-label 유지
  - react-window itemKey, overscan 점검
  - sx 객체 메모화/정적화
  - react-query 옵션(staleTime/gcTime/refetchOnWindowFocus)

## 8) ESLint 규칙(권장)
- import/no-internal-modules: 에러. 허용 목록에 배럴만 등록.
- react/jsx-filename-extension: ['error', { extensions: ['.jsx'] }]
- 환경 분기: process.env.* 사용 금지 → import.meta.env.*

## 9) 커밋/PR 체크리스트(DoD)
- [ ] 공개 API(배럴) 외부 경로 불변
- [ ] 내부 파일 세분화/이동은 배럴로 캡슐화
- [ ] 빌드/린트 통과 로그 첨부
- [ ] 변경 요약(무엇을 분리/추출/메모화 했는지)
- [ ] 회귀 위험/추가 제안(간단)

## 10) 로깅/ENV 표준
- logger.debugLog/infoLog/warnLog/errorLog/… 사용
- 상세 로그는 import.meta.env.DEV에서만 노출

## 11) 성능/안정성 체크리스트(샘플)
- 오토스크롤/리사이즈 옵저버: cleanup 보장
- WebSocket: connect→subscribe→handle→unsubscribe→disconnect 수명주기 명시
- react-query: setQueryData로 부분 갱신, 필요 시 invalidate
- 대형 리스트: memo, itemKey, styles 상수화

## 12) Junie 작업용 프롬프트 템플릿
다음 템플릿을 사용해 1 스코프씩 진행합니다.

역할: React 18/Vite 프로젝트의 구조/성능/안정성 개선. 외부 API/경로/동작 변경 금지. 대상: <상대 경로 또는 폴더> 목표: <관심사 분리/성능/접근성/표준화 등 구체 목표> 지침:
- Barrel(index.js) 공개 API만 수정/유지. 내부 파일은 자유롭게 세분화.
- import/no-internal-modules 위반 금지(배럴만 import/export).
- .jsx에서만 JSX 사용, Vite ENV 표준(import.meta.env.*) 준수.
- 빌드/린트 무오류/무경고. 산출물:
- 변경/신규 파일 목록 + 변경 요약
- 빌드/린트 통과 로그
- 간단 스모크 결과(기능/성능/접근성 체크) DoD:
- 외부 경로 불변, 배럴 경유, 품질 가드 통과

## 13) FAQ
- “파일 수가 너무 많아져요” → 외부에 보이는 것은 배럴 하나입니다. 내부는 자유롭게 세분화하세요.
- “JSX 파싱 에러” → JSX는 .jsx에서만. .js에서는 React.createElement 사용.
- “ENV/로그” → Vite 표준(import.meta.env) + logger 유틸.

---
본 문서는 리포지토리 변경 시 업데이트하세요. 세부 규칙이 바뀌면 PR 템플릿과 ESLint 설정도 동기화하십시오.