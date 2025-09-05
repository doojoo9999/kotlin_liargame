# 코드 품질 개선 - 6단계

**우선순위**: 낮음 (품질 개선 및 남은 문제들)
**예상 소요시간**: 2-3시간
**에러 유형**: 암시적 `any` 타입 및 코드 품질 개선

## 개요

마지막 단계는 암시적 `any` 타입을 제거하고, import 패턴을 표준화하며, 코드베이스 전체에 TypeScript 모범 사례를 구현하여 코드 품질을 개선하는 데 중점을 둡니다.

## 해결할 문제들

- **TS7006**: 매개변수가 암시적으로 'any' 타입 (1개 에러)
- **명시적 `any` 타입 108회** 33개 파일에 걸쳐
- **깊은 상대 import 43회** (`../../..`)
- **비일관적인 import 패턴** 코드베이스 전체

## 영향받는 영역

- 테마 설정 파일들
- 타입 주석이 누락된 유틸리티 함수들
- 깊은 import 경로를 가진 컴포넌트들
- 명시적 `any` 사용이 있는 파일들

## Claude Code를 위한 프롬프트

```
암시적 any 타입을 제거하고, 명시적 any 사용을 줄이며, 코드베이스 전체에서 import 패턴을 표준화하여 코드 품질을 개선해주세요.

1. **암시적 any 매개변수 에러 수정**:
   - TypeScript 컴파일러를 실행해서 구체적인 TS7006 에러를 식별해주세요:
     ```bash
     npx tsc --noEmit | grep "TS7006"
     ```
   - 영향받는 파일을 읽고 적절한 타입 주석을 추가해주세요:
     ```typescript
     // ❌ 암시적 any 매개변수
     function handleTheme(theme) {
       // ...
     }
     
     // ✅ 명시적 타입 주석
     function handleTheme(theme: Theme) {
       // ...
     }
     
     // ✅ 또는 인터페이스와 함께
     interface ThemeHandler {
       (theme: ThemeConfig): void;
     }
     ```

2. **명시적 any 사용 감사**:
   - 모든 명시적 any 타입을 검색해주세요:
     ```bash
     grep -r ": any\|<any>" frontend/main/src --include="*.ts" --include="*.tsx"
     ```
   - 다수의 any가 있는 파일들을 우선순위로 정해주세요
   - 집중할 카테고리들:
     - 이벤트 핸들러: `(event: any) => void`
     - API 응답: `data: any`
     - 누락된 인터페이스가 있는 props: `props: any`

3. **any 타입을 적절한 타입으로 교체**:
   - 이벤트 핸들러:
     ```typescript
     // ❌ any 사용
     const handleClick = (event: any) => {
       event.preventDefault();
     };
     
     // ✅ 적절한 타입 지정
     import { MouseEvent } from 'react';
     const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
       event.preventDefault();
     };
     ```
   
   - API 응답:
     ```typescript
     // ❌ any 사용
     const [data, setData] = useState<any>(null);
     
     // ✅ 적절한 인터페이스 생성
     interface ApiResponse {
       id: string;
       name: string;
       status: 'active' | 'inactive';
     }
     const [data, setData] = useState<ApiResponse | null>(null);
     ```

   - 알 수 없는 데이터 구조:
     ```typescript
     // ❌ 알 수 없는 데이터에 any 사용
     const processData = (data: any) => {
       return data.someProperty;
     };
     
     // ✅ unknown과 타입 가드 사용
     const processData = (data: unknown): string | undefined => {
       if (data && typeof data === 'object' && 'someProperty' in data) {
         return (data as { someProperty: string }).someProperty;
       }
       return undefined;
     };
     ```

4. **import 패턴 표준화**:
   - 깊은 상대 import가 있는 파일을 찾아주세요:
     ```bash
     grep -r "\.\./\.\./\.\." frontend/main/src --include="*.ts" --include="*.tsx"
     ```
   - 설정된 경로 별칭으로 교체해주세요:
     ```typescript
     // ❌ 깊은 상대 import
     import { GameBoard } from '../../../features/game/components/GameBoard';
     import { ChatSystem } from '../../../features/chat/components/ChatSystem';
     
     // ✅ 경로 별칭 사용
     import { GameBoard } from '@/features/game/components/GameBoard';
     import { ChatSystem } from '@/features/chat/components/ChatSystem';
     ```

5. **누락된 타입 정의 생성**:
   - 일반적으로 사용되는 패턴에 대한 타입 정의를 추가해주세요:
     ```typescript
     // types/common.ts 생성
     export interface BaseComponent {
       id: string;
       className?: string;
       children?: React.ReactNode;
     }
     
     export type Status = 'loading' | 'success' | 'error';
     
     export interface ApiError {
       message: string;
       code: number;
       details?: Record<string, unknown>;
     }
     ```

6. **컴포넌트 prop 타입 지정 개선**:
   - 누락된 prop 인터페이스가 있는 컴포넌트를 찾아주세요:
     ```bash
     grep -r "props: any\|FC<any>" frontend/main/src --include="*.tsx"
     ```
   - 적절한 prop 인터페이스를 생성해주세요:
     ```typescript
     // ❌ Any props
     const MyComponent: FC<any> = (props) => {
       return <div>{props.title}</div>;
     };
     
     // ✅ 적절한 인터페이스
     interface MyComponentProps {
       title: string;
       optional?: boolean;
     }
     const MyComponent: FC<MyComponentProps> = ({ title, optional }) => {
       return <div>{title}</div>;
     };
     ```

7. **더 엄격한 TypeScript 규칙 활성화**:
   - `tsconfig.json`을 읽고 더 엄격한 설정을 고려해주세요:
     ```json
     {
       "compilerOptions": {
         "strict": true,
         "noImplicitAny": true,
         "noImplicitReturns": true,
         "noUnusedLocals": true,
         "noUnusedParameters": true
       }
     }
     ```
   - 엄격한 규칙으로 인해 발생하는 새로운 에러들을 수정해주세요

8. **개선 사항 검증**:
   - strict 모드에서 `npm run typecheck` 실행
   - 암시적 any 에러가 남아있지 않은지 확인
   - 명시적 any 사용이 크게 줄었는지 확인 (목표 <20회)
   - 모든 컴포넌트가 여전히 올바르게 작동하는지 테스트

**성공 기준**:
- TS7006 암시적 any 에러 없음
- 명시적 any 사용이 크게 감소 (목표 <20회)
- 코드베이스 전체에서 일관된 import 패턴
- 일반적인 패턴에 대한 적절한 타입 정의
- 모든 컴포넌트에 적절한 prop 인터페이스
- 가능한 경우 더 엄격한 TypeScript 설정
```

## 타입 교체 패턴

### 일반적인 이벤트 타입들
```typescript
// React 이벤트들
import { 
  MouseEvent, 
  KeyboardEvent, 
  ChangeEvent, 
  FormEvent 
} from 'react';

// 버튼 클릭
const handleClick = (event: MouseEvent<HTMLButtonElement>) => {};

// Input 변경
const handleChange = (event: ChangeEvent<HTMLInputElement>) => {};

// Form 제출
const handleSubmit = (event: FormEvent<HTMLFormElement>) => {};
```

### API 응답 타입들
```typescript
// 일반적인 API 응답
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// 구체적인 게임 데이터
interface GameState {
  id: string;
  players: Player[];
  currentPhase: 'waiting' | 'playing' | 'ended';
  startedAt: Date;
}
```

### 유틸리티 타입들
```typescript
// 부분적으로 타입이 지정된 객체용
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 문자열 키를 가진 객체용
type StringRecord = Record<string, unknown>;

// 설정 객체용
interface ConfigOptions {
  theme: 'light' | 'dark';
  language: string;
  features: string[];
}
```

## Import 표준화

### 경로 별칭 설정
```typescript
// tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@features/*": ["features/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

### 일관된 Import 순서
```typescript
// 1. React 및 외부 라이브러리
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. 내부 컴포넌트 및 유틸리티
import { GameBoard } from '@/features/game/components/GameBoard';
import { useGameState } from '@/hooks/useGameState';

// 3. 타입들
import type { GameState, Player } from '@/types/game';

// 4. 상대 import (같은 디렉토리만)
import './Component.css';
```

## 검증 단계

프롬프트 실행 후:

1. 남은 any 타입 확인:
   ```bash
   grep -r ": any\|<any>" frontend/main/src --include="*.ts" --include="*.tsx" | wc -l
   ```

2. 암시적 any 에러가 없는지 확인:
   ```bash
   npx tsc --noEmit | grep "TS7006"
   ```

3. 더 엄격한 TypeScript로 테스트:
   ```bash
   npx tsc --noEmit --strict
   ```

4. Import 일관성 확인:
   ```bash
   grep -r "\.\./\.\./\.\." frontend/main/src --include="*.ts" --include="*.tsx" | wc -l
   ```

## 예상 결과

- 모든 암시적 `any` 에러 제거
- 명시적 `any` 사용이 크게 감소
- 경로 별칭을 사용한 일관된 import 패턴
- 일반적인 패턴에 대한 적절한 타입 정의
- 코드베이스 전체에서 더 나은 타입 안전성
- 더 깔끔하고 유지 관리 가능한 코드

## 최종 검증

전체 테스트 스위트 실행:
```bash
npm run typecheck
npm run lint
npm run build
npm test
```

모든 명령이 TypeScript 에러 없이 통과해야 합니다.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\uae30\uc874 \uc601\ubb38 \ubb38\uc11c\ub97c \ud55c\uae00\ub85c \ubc88\uc5ed", "status": "completed", "activeForm": "\uae30\uc874 \uc601\ubb38 \ubb38\uc11c\ub97c \ud55c\uae00\ub85c \ubc88\uc5ed"}, {"content": "README.md\ub97c \ud55c\uae00\ub85c \uc7ac\uc791\uc131", "status": "completed", "activeForm": "README.md\ub97c \ud55c\uae00\ub85c \uc7ac\uc791\uc131"}, {"content": "\uac01 \uc5d0\ub7ec \uce74\ud14c\uace0\ub9ac \ubb38\uc11c\ub97c \ud55c\uae00\ub85c \uc7ac\uc791\uc131", "status": "completed", "activeForm": "\uac01 \uc5d0\ub7ec \uce74\ud14c\uace0\ub9ac \ubb38\uc11c\ub97c \ud55c\uae00\ub85c \uc7ac\uc791\uc131"}]