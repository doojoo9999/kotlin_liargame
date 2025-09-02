현재 상황 분석
기존 프로젝트는 React + Vite + Mantine + TanStack Query + Zustand 기반으로 구축되어 있으며, Feature-Sliced Design 아키텍처를 따르고 있습니다. 백엔드는 Spring Boot로 REST API와 WebSocket(STOMP)를 제공하며, 서버 중심 아키텍처를 채택하고 있습니다.

요청사항
끄투리오와 Linear를 벤치마킹한 모던하고 깔끔한 디자인의 UI 컴포넌트들을 제작해주세요. 기존 아키텍처 구조는 유지하되, 사용자 경험을 극대화하는 새로운 UI/UX로 리뉴얼하고자 합니다.
기존의 프론트엔드는 '라이트버전'으로, 사용자 선택에 따라 UI를 변경할 것며 지금은 '메인 버전' 개발이 목적입니다.
기존의 frontend 하위에 있는 항목은 frontend/light로 옮기고 frontend/main 에 작업하십시오.

우선 제작할 기본 UI 컴포넌트 목록
다음 우선순위로 shared/ui 폴더에 배치될 기본 컴포넌트들을 제작해주세요:
1단계 - 핵심 기본 컴포넌트
Button: primary, secondary, outline, ghost variant 지원
Input: 텍스트, 검색, 비밀번호 타입 지원
Card: 게임방, 플레이어 정보용 컨테이너
Badge: 온라인/오프라인, 게임중, 라이어 등 상태 표시
Avatar: 플레이어 프로필 이미지 표시
2단계 - 인터랙션 컴포넌트
Modal: 팝업, 확인창 등
Tooltip: 추가 정보 표시
LoadingSpinner: 로딩 상태 표시
ProgressBar: 게임 진행률, 타이머 등
기술 요구사항
기반 기술
Mantine UI 라이브러리를 기본으로 사용하되 커스텀 스타일링 적용
복잡한 디자인은 styled-components로 구현
Framer Motion으로 부드러운 애니메이션 적용
TypeScript로 강타입 props 인터페이스 정의
디자인 시스템
// 참고할 디자인 토큰
const theme = {
colors: {
primary: '#2563eb',
secondary: '#64748b',
success: '#10b981',
warning: '#f59e0b',
error: '#ef4444',
neutral: '#f8fafc'
},
spacing: {
xs: '4px', sm: '8px', md: '16px',
lg: '24px', xl: '32px', xxl: '48px'
},
shadows: {
sm: '0 1px 3px rgba(0,0,0,0.1)',
md: '0 4px 12px rgba(0,0,0,0.15)',
lg: '0 8px 24px rgba(0,0,0,0.2)'
}
}
컴포넌트 구현 규칙
각 컴포넌트는 별도 파일로 구성 (Button.tsx, Input.tsx 등)
Props 인터페이스를 명확히 정의하고 기본값 설정
다양한 variant와 size 옵션 제공
반응형 디자인 지원 (Mobile-first)
접근성(a11y) 고려
Framer Motion으로 hover, focus, active 상태 애니메이션 적용
파일 구조 예시
shared/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.styles.ts
│   └── index.ts
├── Input/
│   ├── Input.tsx  
│   ├── Input.styles.ts
│   └── index.ts
└── index.ts (barrel export)
세부 구현 요청
각 컴포넌트별로 다음 사항들을 포함해서 구현해주세요:
Button 컴포넌트
variant: 'primary' | 'secondary' | 'outline' | 'ghost'
size: 'sm' | 'md' | 'lg'
loading 상태 지원
disabled 상태 스타일링
icon 지원 (앞/뒤 위치 선택 가능)
Input 컴포넌트
type: 'text' | 'password' | 'search'
placeholder, label, helperText 지원
error 상태 및 에러 메시지 표시
좌/우측 아이콘 지원
focus/blur 애니메이션
Card 컴포넌트
다양한 elevation (그림자 깊이) 옵션
padding 옵션
hover 효과
클릭 가능한 경우와 그렇지 않은 경우 구분
Badge 컴포넌트
color variant 다양화
size 옵션
dot 형태와 텍스트 형태 지원
Modal 컴포넌트
배경 오버레이 클릭으로 닫기
ESC 키로 닫기
페이드인/아웃 애니메이션
다양한 크기 옵션
모든 컴포넌트는 Storybook 스타일로 다양한 사용 예시를 보여줄 수 있도록 구현하고, 재사용성과 확장성을 최우선으로 고려해주세요.