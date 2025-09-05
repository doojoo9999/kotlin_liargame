# 의존성 해결 - 3단계

**우선순위**: 높음 (7개 에러 - 전체의 15%)
**예상 소요시간**: 1-2시간
**에러 유형**: 누락된 의존성 및 모듈 해결 문제

## 개요

누락된 의존성과 잘못된 import 경로로 인한 모듈 해결 에러입니다. 이런 문제들은 적절한 컴파일과 개발 워크플로를 방해합니다.

## 에러 상세 정보

- **TS2307**: 다음 모듈들을 찾을 수 없음:
  - `@react-buddy/ide-toolbox`
  - `dayjs`
  - `../components/AdvancedPlayerCard`
  - CSS 모듈들 (`./app/styles/globals.css`, `./app/styles/global.css`)

## 영향받는 파일

1. `/d/workspaces/kotlin_liargame/frontend/main/src/dev/palette.tsx`
2. `/d/workspaces/kotlin_liargame/frontend/main/src/shared/ui/ChatMessage.tsx`
3. 다수의 데모 및 스타일 파일들
4. 잘못된 상대 import를 가진 다양한 컴포넌트들

## Claude Code를 위한 프롬프트

```
누락된 의존성을 설치하고 import 경로를 수정하여 모든 모듈 해결 에러를 해결해주세요.

1. **누락된 의존성 식별**:
   - 누락된 모듈의 import를 코드베이스에서 검색해주세요:
     ```bash
     grep -r "@react-buddy/ide-toolbox" frontend/
     grep -r "dayjs" frontend/
     ```

2. **누락된 개발 의존성 설치**:
   ```bash
   npm install --save-dev @react-buddy/ide-toolbox
   npm install dayjs
   ```

3. **CSS 모듈 import 수정**:
   - 실패하는 CSS import를 검색해주세요:
     ```bash
     grep -r "styles/globals.css" frontend/
     grep -r "styles/global.css" frontend/
     ```
   - 예상 경로에 CSS 파일이 존재하는지 확인해주세요
   - 누락된 경우 CSS 파일을 생성하거나 import 경로를 업데이트해주세요
   - 필요한 경우 CSS 모듈 타입 선언을 추가해주세요

4. **컴포넌트 import 경로 수정**:
   - AdvancedPlayerCard import 에러가 있는 파일을 읽어주세요
   - 실제 AdvancedPlayerCard 컴포넌트를 검색해주세요:
     ```bash
     find frontend -name "*AdvancedPlayerCard*" -type f
     ```
   - 올바른 상대 또는 절대 경로를 사용하도록 import 경로를 업데이트해주세요
   - 더 깔끔한 import를 위해 경로 별칭(@/) 사용을 고려해주세요

5. **경로 별칭이 설정되어 있는지 확인**:
   - 경로 별칭 설정을 위해 `vite.config.ts` 또는 `tsconfig.json`을 읽어주세요
   - `@/` 별칭이 `src/` 디렉토리를 가리키는지 확인해주세요
   - 일관된 경로 별칭을 사용하도록 import 문을 업데이트해주세요

6. **누락된 타입 선언 추가**:
   - CSS 모듈을 위해 필요한 경우 `types/globals.d.ts`를 생성해주세요:
     ```typescript
     declare module '*.css' {
       const content: { [className: string]: string };
       export default content;
     }
     
     declare module '*.module.css' {
       const classes: { [key: string]: string };
       export default classes;
     }
     ```

7. **코드베이스 전체 import 업데이트**:
   - 깊은 상대 import(`../../../`)를 경로 별칭으로 교체해주세요
   - 모든 컴포넌트 import가 올바른 경로를 사용하는지 확인해주세요
   - 프로젝트 전체에서 import 스타일을 표준화해주세요

8. **모든 import 해결 확인**:
   - `npm run typecheck`를 실행해서 남은 TS2307 에러를 확인해주세요
   - 개발 서버가 모듈 해결 에러 없이 시작되는지 테스트해주세요
   - TypeScript가 모든 import를 해결할 수 있는지 확인해주세요

**성공 기준**:
- TS2307 "모듈을 찾을 수 없음" 에러 없음
- 모든 의존성이 적절히 설치됨
- import 경로가 일관되고 올바름
- 개발 서버가 모듈 에러 없이 시작
- TypeScript가 모든 import를 해결 가능
```

## 대안 접근법: 깔끔한 Import 전략

많은 import 경로를 수정해야 하는 경우:

```
체계적인 import 정리 전략을 구현해주세요:

1. **모든 import 감사**:
   ```bash
   grep -r "import.*from" frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
   ```

2. **import 유형별 분류**:
   - 외부 라이브러리 (npm 패키지)
   - 내부 컴포넌트 (상대 경로)
   - 유틸리티 함수들
   - 타입 정의

3. **import 규칙 설정**:
   - 모든 내부 import에 `@/` 사용
   - 상대 import는 인근 파일에만 사용 (같은 디렉토리)
   - 타입별로 import 그룹화 (외부, 내부, 타입)

4. **체계적으로 import 수정**:
   - 가장 많이 import되는 컴포넌트부터 시작
   - 한 번에 하나의 컴포넌트씩 업데이트
   - 각 주요 컴포넌트 수정 후 테스트

5. **경로 별칭 설정 업데이트**:
   - tsconfig.json에 적절한 baseUrl과 paths가 있는지 확인
   - 번들러(Vite/Webpack)를 같은 별칭으로 설정
   - 필요한 경우 더 구체적인 별칭 추가 (예: @components/, @utils/)
```

## 검증 단계

프롬프트 실행 후:

1. 모듈 해결 확인:
   ```bash
   npm run typecheck
   ```

2. 개발 서버 테스트:
   ```bash
   npm run dev
   ```

3. 특정 import가 작동하는지 확인:
   ```bash
   npx tsc --noEmit | grep "TS2307"
   ```

4. 빌드 프로세스 테스트:
   ```bash
   npm run build
   ```

## 예상 결과

- 모든 누락된 의존성이 설치되어 사용 가능
- TS2307 모듈 해결 에러 없음
- 코드베이스 전체에서 일관된 import 경로
- 개발 서버가 모듈 에러 없이 시작
- 4단계(타입 미스매치)로 진행 준비 완료

## 문제 해결

에러가 지속되는 경우:
- node_modules에서 설치된 패키지 확인
- TypeScript가 타입 정의를 찾을 수 있는지 확인
- 파일 경로의 대소문자 구분 확인
- CSS 파일이 예상 위치에 존재하는지 확인
- 경로 별칭 설정이 올바른지 확인

## 다음 단계

[04-type-mismatches.md](./04-type-mismatches.md)로 진행하세요