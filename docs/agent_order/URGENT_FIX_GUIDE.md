# 🚨 긴급 수정 가이드

**우선순위**: 🔴 CRITICAL  
**예상 소요시간**: 1-2일  
**목표**: 배포 가능한 상태로 복구

---

## 🎯 긴급 수정 목록

### 1. TypeScript 컴파일 에러 수정

#### 문제 1: screen-reader.ts 파일 JSX 구문 오류
```bash
# 파일명 변경
mv src/versions/main/accessibility/screen-reader.ts src/versions/main/accessibility/screen-reader.tsx
```

**수정 내용**:
```typescript
// screen-reader.tsx 파일에서 React import 추가
import React from 'react';

// 기존 코드는 그대로 유지
```

#### 문제 2: keyboard-navigation.ts 메서드 미완성
**위치**: `src/versions/main/accessibility/keyboard-navigation.ts:228`

**수정 내용**:
```typescript
// 228라인에서 미완성된 메서드 완성
private handleEnter() {
  const activeElement = document.activeElement as HTMLElement;

  if (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button') {
    activeElement.click();
  }
}

private handleSpace() {
  const activeElement = document.activeElement as HTMLElement;

  // 체크박스, 라디오 버튼, 버튼에 대한 스페이스 처리
  if (activeElement.tagName === 'INPUT' &&
      ['checkbox', 'radio'].includes((activeElement as HTMLInputElement).type)) {
    (activeElement as HTMLInputElement).checked = !(activeElement as HTMLInputElement).checked;
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (activeElement.getAttribute('role') === 'button') {
    activeElement.click();
  }
}

// 추가 메서드들 완성
private handleVote() {
  const activeElement = document.activeElement as HTMLElement;
  const voteButton = activeElement.closest('[data-action="vote"]') as HTMLElement;
  if (voteButton) {
    voteButton.click();
  }
}

private handleHelp() {
  // 도움말 모달 표시
  const helpModal = document.querySelector('[data-help-modal]') as HTMLElement;
  if (helpModal) {
    helpModal.style.display = 'block';
    helpModal.focus();
  }
}

// cleanup 메서드
cleanup() {
  this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
  this.container.removeEventListener('focusin', this.handleFocusIn.bind(this));
  this.keyMap.clear();
  this.focusableElements = [];
}
```

### 2. Import 경로 수정

#### 문제: 모듈 경로 불일치
**영향받는 파일들**:
- `src/versions/main/accessibility/components.tsx`
- `src/versions/main/components/enhanced/EnhancedPlayerCard.tsx`
- `src/versions/main/components/enhanced/EnhancedGameBoard.tsx`
- `src/versions/main/optimization/rendering.tsx`

**수정 방법**:
```typescript
// 잘못된 경로들
import { cn } from "../../lib/utils";              // ❌
import { interactionManager } from "../../../shared/interactions/manager"; // ❌

// 올바른 경로들
import { cn } from "@/lib/utils";                  // ✅
import { interactionManager } from "@/shared/interactions/manager"; // ✅
```

### 3. TypeScript 설정 개선

#### tsconfig.json path mapping 추가
```json
{
  "compilerOptions": {
    // 기존 설정 유지
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/*": ["./src/versions/main/lib/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/main/*": ["./src/versions/main/*"],
      "@/light/*": ["./src/versions/light/*"]
    }
  }
}
```

### 4. Vite 설정 수정

#### vite.config.ts terserOptions 수정
```typescript
// 잘못된 설정
terserOptions: {
  compress: {
    drop_console: false, // ❌ 'compress' 속성이 잘못됨
    drop_debugger: true,
  },
}

// 올바른 설정
terserOptions: {
  compress: {
    drop_console: false,
    drop_debugger: true,
  },
  mangle: true,
}
```

### 5. Vitest 설정 개선

#### vitest.config.ts 경로 매핑 추가
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/versions/main/lib'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/main': path.resolve(__dirname, './src/versions/main'),
      '@/light': path.resolve(__dirname, './src/versions/light'),
    },
  },
})
```

---

## 🔧 실행 순서

### Step 1: 파일 구조 수정 (10분)
```bash
cd frontend
mv src/versions/main/accessibility/screen-reader.ts src/versions/main/accessibility/screen-reader.tsx
```

### Step 2: TypeScript 에러 수정 (30분)
1. `screen-reader.tsx`에 React import 추가
2. `keyboard-navigation.ts`에서 미완성 메서드들 완성

### Step 3: Import 경로 일괄 변경 (20분)
```bash
# 모든 상대경로를 절대경로로 변경
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|"../../lib/utils"|"@/lib/utils"|g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|"../../../shared/interactions/manager"|"@/shared/interactions/manager"|g'
```

### Step 4: 설정 파일 수정 (15분)
1. `tsconfig.json`에 path mapping 추가
2. `vite.config.ts` terserOptions 수정
3. `vitest.config.ts` 경로 매핑 추가

### Step 5: 검증 (15분)
```bash
# TypeScript 타입 체크
npm run type-check

# 빌드 테스트
npm run build

# 기본 테스트 실행
npm test
```

---

## 🚀 성공 기준

### ✅ 완료 확인 사항
- [ ] `npm run type-check` 에러 0개
- [ ] `npm run build` 성공
- [ ] `npm test` 최소 1개 테스트 성공
- [ ] 개발 서버 정상 실행 (`npm run dev`)

### 📊 예상 결과
- **TypeScript 컴파일**: ✅ 성공
- **프로덕션 빌드**: ✅ 성공
- **기본 테스트**: ✅ 실행 가능
- **개발 서버**: ✅ 정상 작동

---

## 🆘 문제 발생 시

### 만약 여전히 에러가 발생한다면:

1. **노드 모듈 재설치**
```bash
rm -rf node_modules package-lock.json
npm install
```

2. **캐시 정리**
```bash
npm run clean  # 빌드 캐시 정리
rm -rf dist
```

3. **개별 파일 확인**
```bash
# 특정 파일의 TypeScript 에러 확인
npx tsc --noEmit src/versions/main/accessibility/screen-reader.tsx
```

---

## 📞 추가 지원

이 가이드로 해결되지 않는 문제가 있다면:
1. [PHASE5_POST_COMPLETION_ANALYSIS.md](./PHASE5_POST_COMPLETION_ANALYSIS.md) 참조
2. 각 에러 메시지를 정확히 기록하여 추가 분석 요청

**목표**: 이 가이드를 통해 1-2일 내에 배포 가능한 상태로 복구 완료