# Frontend Demo 통합 및 정리 작업 계획서

## 📋 개요

현재 프로젝트에는 **9개의 분산된 데모 파일들**이 존재하며, 이 중 `LinearStyleDemo`만이 정상적으로 작동하고 있습니다. 이 문서는 모든 데모를 하나의 통합된 데모 페이지로 합치고 불필요한 파일들을 정리하는 작업 계획을 다룹니다.

## 🎯 목표

- **단일 통합 데모 페이지** 구축 (`/main/demo`)
- **중복 코드 제거** 및 **프로젝트 구조 정리**
- **LinearStyleDemo의 우수한 디자인** 활용
- **모든 유용한 기능들** 통합

## 📊 현재 상황 분석

### 라우터에 연결된 데모들

1. **`/main/design`** (`LinearStyleDemo`) ✅ **정상 작동**
   - Linear.app 스타일 다크 테마
   - 사이드바 네비게이션
   - 플레이어 카드, 채팅 UI, 투표 패널
   - CSS-in-JS 방식으로 Tailwind 의존성 없음

2. **`/main/demo`** (`GameComponentsDemo`) ❌ **CSS 문제**
   - shadcn/ui 컴포넌트 쇼케이스
   - 버튼, 뱃지, 카드, 프로그레스 등 UI 요소들
   - Tailwind v3/v4 버전 충돌로 스타일링 안됨

3. **`/main/demo-full`** (`Phase4Demo`) ❌ **CSS 문제**
   - 고급 기능 시뮬레이션 (제스처, 키보드 네비게이션)
   - 메모리 최적화 데모
   - Tailwind CSS 미적용

### 기타 데모 파일들

- `main-demo.tsx` (별도 엔트리포인트)
- `IntegratedVersionDemo.tsx`
- `main-phase4-demo.tsx` (별도 엔트리포인트)
- `ComponentDemo.tsx`
- `SimpleComponentDemo.tsx` 
- `ComponentDemoPage.tsx`

## 🏗️ 통합 계획

### 1. 통합 데모 컴포넌트 개발

**새 파일**: `src/features/demo/IntegratedGameDemo.tsx`

**베이스**: `LinearStyleDemo` (유일하게 정상 작동하는 데모)

**통합할 기능들**:
- ✅ **LinearStyleDemo의 디자인 시스템**
  - 다크 테마 (Linear.app 스타일)
  - 사이드바 네비게이션 구조
  - CSS-in-JS 방식 스타일링
  
- ✅ **GameComponentsDemo의 UI 컴포넌트 쇼케이스**
  - 버튼 변형들 (primary, secondary, danger, ghost)
  - 뱃지 및 상태 표시기
  - 카드 레이아웃
  - 프로그레스 바
  
- ✅ **실제 게임 로직 시뮬레이션**
  - 타이머 기능
  - 플레이어 상태 관리
  - 투표 시스템
  - 게임 페이즈 전환

### 2. 섹션 구성

```
📂 사이드바 네비게이션
├── 🔍 Overview        → 게임 개요 및 현재 상태
├── 🧩 Components      → UI 컴포넌트 라이브러리
├── 👥 Players         → 플레이어 카드 및 역할 표시  
├── 💬 Chat           → 채팅 인터페이스 데모
├── 🗳️ Voting         → 투표 시스템 시뮬레이션
└── 🎮 Game Logic     → 게임 진행 로직 및 페이즈 관리
```

#### Overview 섹션
- 게임 상태 대시보드
- 현재 페이즈 표시
- 플레이어 수 및 생존자 수
- 타이머 및 진행률

#### Components 섹션  
- **버튼 컴포넌트**: Primary, Secondary, Danger, Ghost 변형
- **카드 컴포넌트**: 기본, 플레이어, 투표 카드
- **뱃지 컴포넌트**: 역할, 상태, 투표 뱃지
- **프로그레스**: 게임 진행률, 타이머 바
- **입력 컴포넌트**: 텍스트, 검색, 선택

#### Players 섹션
- 플레이어 그리드 레이아웃
- 아바타 및 그래디언트 배경
- 역할 표시 (시민/라이어)
- 생존/탈락 상태
- 투표 수 및 상태

#### Chat 섹션
- 실시간 채팅 UI
- 사용자/시스템 메시지 구분
- 메시지 타임스탬프
- 스크롤 및 자동 업데이트

#### Voting 섹션
- 플레이어 선택 인터페이스
- 투표 진행률 표시
- 실시간 투표 결과
- 투표 완료 처리

#### Game Logic 섹션
- 페이즈 관리 (토론, 투표, 결과)
- 타이머 및 자동 전환
- 게임 상태 변경
- 승리 조건 체크

## 🗑️ 삭제 대상 파일들

```bash
# 중복 및 불필요한 데모 파일들
src/features/demo/GameComponentsDemo.tsx
src/features/demo/Phase4Demo.tsx  
src/main-demo.tsx
src/main-phase4-demo.tsx
src/versions/main/demo/ComponentDemo.tsx
src/versions/main/demo/SimpleComponentDemo.tsx
src/versions/main/pages/ComponentDemoPage.tsx
src/features/demo/IntegratedVersionDemo.tsx

# 베이스로 사용 후 삭제
src/features/demo/LinearStyleDemo.tsx
```

## 🔧 기술적 구현 사항

### CSS 및 스타일링
- **방식**: CSS-in-JS (Tailwind 의존성 제거)
- **테마**: Linear.app 다크 테마
- **색상 팔레트**: 
  ```javascript
  colors: {
    background: 'rgb(9, 9, 11)',     // gray-950
    surface: 'rgb(39, 39, 42)',      // gray-800  
    border: 'rgb(63, 63, 70)',       // gray-700
    text: 'rgb(244, 244, 245)',      // gray-100
    accent: 'rgb(59, 130, 246)',     // blue-500
    success: 'rgb(34, 197, 94)',     // green-500
    danger: 'rgb(239, 68, 68)',      // red-500
  }
  ```

### 레이아웃 구조
```jsx
<div className="integrated-game-demo">
  <aside className="sidebar">
    <nav className="navigation">
      {/* 섹션 버튼들 */}
    </nav>
  </aside>
  <main className="content-area">
    {/* 동적 콘텐츠 */}
  </main>
</div>
```

### 상태 관리
```typescript
interface DemoState {
  activeSection: string;
  gamePhase: 'discussion' | 'voting' | 'results';
  players: Player[];
  timer: number;
  votes: Record<string, string>;
  chatMessages: ChatMessage[];
}
```

## 📋 작업 순서

### Phase 1: 베이스 구축
1. **IntegratedGameDemo.tsx 생성**
   - LinearStyleDemo 복사하여 시작
   - 기본 사이드바 구조 유지
   - CSS-in-JS 스타일링 확보

### Phase 2: 컴포넌트 통합
2. **Components 섹션 구축**
   - GameComponentsDemo에서 UI 컴포넌트 추출
   - 버튼, 카드, 뱃지 쇼케이스 추가
   - 인터랙티브 예제 구현

### Phase 3: 기능 강화
3. **게임 로직 섹션 추가**
   - 타이머 및 페이즈 관리
   - 플레이어 상태 시뮬레이션
   - 투표 시스템 구현

### Phase 4: 정리 및 최적화
4. **파일 정리**
   - 불필요한 데모 파일들 삭제
   - 라우터 설정 단순화
   - import 구문 정리

### Phase 5: 테스트 및 검증
5. **품질 확인**
   - 모든 섹션 동작 테스트
   - 반응형 레이아웃 검증
   - 브라우저 호환성 확인

## 🔄 라우터 설정 변경

### 변경 전
```typescript
// MainRouter.tsx
<Route path="/demo" element={<GameComponentsDemo />} />
<Route path="/demo-full" element={<Phase4Demo />} />  
<Route path="/design" element={<LinearStyleDemo />} />
```

### 변경 후  
```typescript
// MainRouter.tsx
<Route path="/demo" element={<IntegratedGameDemo />} />
```

## 📈 예상 효과

### 개발 효율성
- **파일 수 감소**: 9개 → 1개
- **중복 코드 제거**: ~70% 코드 중복 해소
- **유지보수성 향상**: 단일 데모 파일 관리

### 사용자 경험
- **일관된 디자인**: Linear.app 스타일 통일
- **완전한 기능**: 모든 게임 요소 한 곳에서 확인
- **직관적 네비게이션**: 사이드바 기반 섹션 이동

### 기술적 안정성
- **CSS 의존성 해결**: Tailwind 버전 충돌 회피
- **로딩 성능**: 단일 컴포넌트 lazy loading
- **코드 품질**: TypeScript 타입 안전성

## 🎯 성공 기준

- [ ] 단일 데모 URL (`/main/demo`)에서 모든 기능 접근 가능
- [ ] 6개 섹션 모두 정상 작동 
- [ ] Linear.app 스타일 디자인 일관성 유지
- [ ] 반응형 레이아웃 지원
- [ ] TypeScript 타입 에러 없음
- [ ] 9개 → 1개 데모 파일로 정리 완료

## 📅 예상 소요 시간

- **Phase 1**: 30분 (베이스 구축)
- **Phase 2**: 45분 (컴포넌트 통합) 
- **Phase 3**: 60분 (기능 강화)
- **Phase 4**: 15분 (파일 정리)
- **Phase 5**: 30분 (테스트)

**총 예상 시간**: 3시간

---

이 계획서를 따라 작업하면 깔끔하고 통합된 데모 페이지를 구축할 수 있으며, 프로젝트의 유지보수성과 사용자 경험을 크게 개선할 수 있습니다.