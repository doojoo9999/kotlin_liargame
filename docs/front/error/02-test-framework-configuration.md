# 테스트 프레임워크 설정 - 2단계

**우선순위**: 높음 (17개 에러 - 전체의 36%)
**예상 소요시간**: 2-3시간
**에러 유형**: Jest/Vitest 설정 충돌

## 개요

코드베이스에 테스트 프레임워크가 혼재되어 있습니다 - Vitest 환경에서 Jest 구문을 사용하고 있어 17개의 TypeScript 에러가 발생하며 테스트 전역 변수들이 누락되었습니다.

## 에러 상세 정보

- **TS2304**: 'jest', 'expect'를 찾을 수 없음 (10회 발생)
- **TS2582**: 'describe', 'it'을 찾을 수 없음 (7회 발생)

## 영향받는 파일

주요 에러 파일:
- `frontend/main/src/features/game/components/__tests__/AdvancedPlayerCard.test.tsx`

Jest 전역 변수를 사용하는 추가 테스트 파일들:
- 모든 `.test.tsx` 및 `.test.ts` 파일

## 선택 필요

다음 중 하나의 접근 방식을 선택하세요:

### 옵션 A: Vitest로 표준화 (권장)
### 옵션 B: Jest로 전환

## Claude Code를 위한 프롬프트 - 옵션 A (Vitest)

```
테스트 프레임워크를 Vitest로 표준화하고 모든 테스트 프레임워크 TypeScript 에러를 해결해주세요.

1. **현재 테스트 설정 분석**:
   - `package.json`을 읽어서 현재 테스트 의존성을 확인해주세요
   - `vite.config.ts`를 읽어서 Vitest 설정을 확인해주세요
   - 모든 테스트 파일을 검색해주세요: `find frontend -name "*.test.*" -o -name "*.spec.*"`

2. **Vitest 적절히 설정**:
   - `vitest`가 의존성으로 설치되어 있는지 확인해주세요
   - `vite.config.ts`를 적절한 Vitest 설정으로 업데이트해주세요:
     ```typescript
     /// <reference types="vitest" />
     import { defineConfig } from 'vite'
     
     export default defineConfig({
       test: {
         globals: true,
         environment: 'jsdom',
       },
     })
     ```

3. **누락된 테스트 의존성 설치**:
   ```bash
   npm install --save-dev vitest @vitest/ui jsdom
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   ```

4. **TypeScript 설정 업데이트**:
   - `tsconfig.json`을 읽어주세요
   - compilerOptions.types에 Vitest 타입을 추가해주세요:
     ```json
     {
       "compilerOptions": {
         "types": ["vitest/globals", "jest-dom"]
       }
     }
     ```

5. **테스트 파일 수정**:
   - `frontend/main/src/features/game/components/__tests__/AdvancedPlayerCard.test.tsx`를 읽어주세요
   - Jest 전용 구문을 Vitest 동등물로 교체해주세요:
     - `import { jest } from '@jest/globals'`가 있으면 제거해주세요
     - 모킹에 `jest.fn()` 대신 `vi.fn()` 사용
     - `jest.mock()` 대신 `vi.mock()` 사용
   - 모든 테스트 전역 변수(`describe`, `it`, `expect`)가 사용 가능한지 확인해주세요

6. **모든 테스트 파일 업데이트**:
   - Jest 전용 import를 검색해서 Vitest 동등물로 교체해주세요
   - 코드베이스 전체에서 모킹 구문을 업데이트해주세요
   - 일관된 테스트 패턴을 확보해주세요

7. **설정 검증**:
   - `npm run typecheck`를 실행해서 더 이상 TS2304/TS2582 에러가 없는지 확인해주세요
   - `npm test`를 실행해서 테스트가 제대로 실행되는지 확인해주세요
   - 모든 테스트 전역 변수가 TypeScript에서 인식되는지 확인해주세요

**성공 기준**:
- 테스트 전역 변수(jest, expect, describe, it)에 대한 TS2304 에러 없음
- 테스트 함수명에 대한 TS2582 에러 없음
- 모든 테스트 파일이 타입 체크를 성공적으로 통과
- 프레임워크 관련 에러 없이 테스트 실행
```

## Claude Code를 위한 프롬프트 - 옵션 B (Jest)

```
테스트 프레임워크를 Jest로 표준화하고 모든 테스트 프레임워크 TypeScript 에러를 해결해주세요.

1. **Jest 의존성 설치**:
   ```bash
   npm install --save-dev jest @types/jest ts-jest
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   ```

2. **Jest 설정 생성**:
   - `jest.config.js`를 생성해주세요:
     ```javascript
     module.exports = {
       preset: 'ts-jest',
       testEnvironment: 'jsdom',
       setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
       moduleNameMapping: {
         '^@/(.*)$': '<rootDir>/src/$1',
       },
     }
     ```

3. **TypeScript 설정 업데이트**:
   - `tsconfig.json`을 읽어주세요
   - Jest 타입을 추가해주세요:
     ```json
     {
       "compilerOptions": {
         "types": ["jest", "@testing-library/jest-dom"]
       }
     }
     ```

4. **package.json 스크립트 업데이트**:
   - 테스트 스크립트를 Jest를 사용하도록 변경해주세요:
     ```json
     {
       "scripts": {
         "test": "jest",
         "test:watch": "jest --watch"
       }
     }
     ```

5. **테스트 파일 확인 및 수정**:
   - 모든 테스트 파일이 Jest 전역 변수에 접근할 수 있는지 확인해주세요
   - `npm run typecheck`를 실행해서 에러 해결을 확인해주세요
   - `npm test`를 실행해서 Jest 설정이 작동하는지 확인해주세요

**성공 기준**:
- Jest가 TypeScript와 적절히 설정됨
- 테스트 전역 변수에 대한 TS2304/TS2582 에러 없음
- Jest로 모든 테스트가 성공적으로 실행
```

## 검증 단계

선택한 프롬프트 실행 후:

1. TypeScript 컴파일 확인:
   ```bash
   npm run typecheck
   ```

2. 테스트 실행:
   ```bash
   npm test
   ```

3. 테스트 프레임워크 에러가 남아있지 않은지 확인:
   ```bash
   npx tsc --noEmit | grep -E "TS(2304|2582)"
   ```

## 예상 결과

- 17개의 테스트 프레임워크 설정 에러 모두 해결
- 코드베이스 전체에서 일관된 테스트 프레임워크
- TypeScript 에러 없이 테스트가 성공적으로 실행
- 3단계(의존성 해결)로 진행 준비 완료

## 다음 단계

[03-dependency-resolution.md](./03-dependency-resolution.md)로 진행하세요