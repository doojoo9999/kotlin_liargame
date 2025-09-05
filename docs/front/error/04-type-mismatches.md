# 타입 미스매치 - 4단계

**우선순위**: 중간 (3개 에러 - 전체의 6%)
**예상 소요시간**: 1시간
**에러 유형**: 애니메이션 및 불린 로직의 타입 호환성 문제

## 개요

애니메이션과 불린 로직에서 호환되지 않는 타입으로 인한 타입 미스매치 에러입니다. 주로 라이브러리 API 변경이나 잘못된 타입 가정 때문에 발생합니다.

## 에러 상세 정보

- **TS2322**: 다음에 대한 타입 미스매치 에러:
  - 애니메이션 variant 타입 비호환성 (Framer Motion)
  - 불린 타입 비호환성 (`boolean | 0` vs `boolean`)

## 영향받는 파일

1. `/d/workspaces/kotlin_liargame/frontend/main/src/features/game/components/GameBoard.tsx`
2. `/d/workspaces/kotlin_liargame/frontend/main/src/shared/ui/GameStatusPanel.tsx`

## Claude Code를 위한 프롬프트

```
게임 컴포넌트의 애니메이션 및 불린 로직과 관련된 타입 미스매치 에러를 수정해주세요.

1. **GameBoard 애니메이션 문제 분석**:
   - `frontend/main/src/features/game/components/GameBoard.tsx`를 읽어주세요
   - Framer Motion 애니메이션 variant 타입 미스매치를 식별해주세요
   - 구체적인 TS2322 에러 위치와 예상 vs 실제 타입을 확인해주세요

2. **Framer Motion 타입 문제 수정**:
   - package.json에서 현재 Framer Motion 버전을 확인해주세요
   - 현재 API에 맞게 애니메이션 variant 정의를 업데이트해주세요:
     ```typescript
     // 에러를 일으킬 수 있는 기존 패턴:
     const variants = {
       visible: { opacity: 1, scale: 1 },
       hidden: { opacity: 0, scale: 0.8 }
     }
     
     // 적절한 타입이 포함된 업데이트된 패턴:
     const variants: Variants = {
       visible: { opacity: 1, scale: 1 },
       hidden: { opacity: 0, scale: 0.8 }
     }
     
     // 또는 명시적인 모션 컴포넌트 props와 함께:
     <motion.div
       variants={variants}
       initial="hidden"
       animate="visible"
       exit="hidden"
     />
     ```

3. **GameStatusPanel 불린 문제 분석**:
   - `frontend/main/src/shared/ui/GameStatusPanel.tsx`를 읽어주세요
   - 불린 타입 미스매치(`boolean | 0` vs `boolean`)를 식별해주세요
   - 미스매치를 일으키는 구체적인 속성이나 표현식을 찾아주세요

4. **불린 타입 호환성 수정**:
   - 일반적인 수정 패턴들:
     ```typescript
     // 문제: 0을 거짓 불린으로 사용
     const isActive = someCondition ? true : 0; // ❌
     
     // 해결책: 적절한 불린 사용
     const isActive = Boolean(someCondition); // ✅
     // 또는
     const isActive = !!someCondition; // ✅
     
     // 문제: 혼합 타입을 가진 조건문
     const status = isReady && gameState || 0; // ❌
     
     // 해결책: 일관된 불린 반환 보장
     const status = Boolean(isReady && gameState); // ✅
     ```

5. **관련 애니메이션 및 상태 로직 확인**:
   - 같은 문제를 가질 수 있는 다른 파일에서 유사한 패턴을 찾아주세요
   - 다른 Framer Motion 사용처를 검색해주세요:
     ```bash
     grep -r "motion\." frontend/main/src --include="*.tsx"
     grep -r "variants" frontend/main/src --include="*.tsx"
     ```

6. **필요한 곳에 타입 주석 업데이트**:
   - 애니메이션 variants에 명시적 타입 주석 추가
   - 불린 표현식이 일관된 타입을 반환하도록 보장
   - 필요한 경우 적절한 TypeScript 유틸리티 타입 사용

7. **애니메이션 기능 테스트**:
   - 타입 수정 후에도 애니메이션이 예상대로 작동하는지 확인
   - 불린 로직이 올바른 UI 동작을 생성하는지 확인
   - 타입 변경으로 인한 성능 저하가 없는지 확인

8. **수정 사항 검증**:
   - `npm run typecheck`를 실행해서 TS2322 에러가 해결되었는지 확인
   - 컴포넌트가 올바르게 렌더링되는지 확인
   - 게임 보드와 상태 패널 기능을 테스트

**성공 기준**:
- TS2322 타입 할당 에러 없음
- Framer Motion 애니메이션이 올바른 타입으로 작동
- 불린 로직이 일관된 타입을 반환
- 게임 컴포넌트가 수정된 타입으로 올바르게 렌더링 및 작동
- 모든 타입 미스매치 해결
```

## 일반적인 타입 미스매치 패턴 및 수정

### Framer Motion Variants
```typescript
// ❌ 일반적인 에러 패턴
const variants = {
  enter: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 }
};

// ✅ 적절히 타입이 지정됨
import { Variants } from 'framer-motion';

const variants: Variants = {
  enter: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 }
};
```

### 불린 표현식 수정
```typescript
// ❌ 혼합 반환 타입
const isReady = condition ? true : 0;

// ✅ 일관된 불린
const isReady = Boolean(condition);

// ❌ 거짓 값 혼동
const hasData = data && data.length || 0;

// ✅ 명시적 불린 변환
const hasData = Boolean(data?.length);
```

## 검증 단계

프롬프트 실행 후:

1. 특정 파일 타입 확인:
   ```bash
   npx tsc --noEmit frontend/main/src/features/game/components/GameBoard.tsx
   npx tsc --noEmit frontend/main/src/shared/ui/GameStatusPanel.tsx
   ```

2. 남은 타입 미스매치 확인:
   ```bash
   npx tsc --noEmit | grep "TS2322"
   ```

3. 영향받은 컴포넌트 테스트:
   ```bash
   npm run dev
   # 게임 보드와 상태 패널로 이동
   # 애니메이션과 불린 상태가 올바르게 작동하는지 확인
   ```

## 예상 결과

- 모든 TS2322 타입 할당 에러 해결
- Framer Motion 애니메이션이 적절히 타입 지정되고 작동
- 불린 표현식이 일관된 타입을 반환
- 게임 컴포넌트가 수정된 타입으로 올바르게 작동
- 5단계(라이브러리 API 업데이트)로 진행 준비 완료

## 문제 해결

에러가 지속되는 경우:
- Framer Motion 버전 호환성 확인
- 애니메이션 타입을 위한 import 문 확인
- undefined 값으로 인한 타입 문제 찾기
- 혼합 타입을 반환하는 조건 표현식 확인

## 다음 단계

[05-library-api-updates.md](./05-library-api-updates.md)로 진행하세요