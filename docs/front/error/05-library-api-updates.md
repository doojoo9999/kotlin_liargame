# 라이브러리 API 업데이트 - 5단계

**우선순위**: 중간 (3개 에러 - 전체의 6%)
**예상 소요시간**: 1-2시간
**에러 유형**: 구식 라이브러리 사용 패턴 및 API 변경

## 개요

구식 라이브러리 API를 사용하거나 잘못된 속성 이름으로 인한 에러입니다. 라이브러리가 발전하면서 이러한 에러들은 코드가 현재 API 사양에 맞게 업데이트되어야 함을 나타냅니다.

## 에러 상세 정보

- **TS2769**: FixedSizeList (react-window)에 필수 'width' 속성 누락
- **TS2724**: @tabler/icons-react에서 존재하지 않는 'IconInfo' export
- **TS2353**: 테마 설정에서 알 수 없는 'colorScheme' 속성

## 영향받는 파일

1. `/d/workspaces/kotlin_liargame/frontend/main/src/features/chat/components/ChatSystem.tsx`
2. `/d/workspaces/kotlin_liargame/frontend/main/src/shared/ui/ActionButtons.tsx`
3. `/d/workspaces/kotlin_liargame/frontend/main/src/app/styles/theme.ts`

## Claude Code를 위한 프롬프트

```
현재 API 사양에 맞게 구식 라이브러리 사용 패턴을 업데이트하고 라이브러리 호환성 에러를 해결해주세요.

1. **react-window FixedSizeList 누락 width 속성 수정**:
   - `frontend/main/src/features/chat/components/ChatSystem.tsx`를 읽어주세요
   - FixedSizeList 컴포넌트 사용을 찾아주세요
   - FixedSizeList에 필수 'width' 속성을 추가해주세요:
     ```typescript
     // ❌ width 속성 누락
     <FixedSizeList
       height={400}
       itemCount={items.length}
       itemSize={50}
     />
     
     // ✅ 필수 width 속성 추가
     <FixedSizeList
       height={400}
       width="100%" // 또는 특정 픽셀 값
       itemCount={items.length}
       itemSize={50}
     />
     ```
   - 다른 필수 속성에 대한 react-window 문서 확인

2. **@tabler/icons-react export 문제 수정**:
   - `frontend/main/src/shared/ui/ActionButtons.tsx`를 읽어주세요
   - 현재 @tabler/icons-react 버전을 확인해주세요:
     ```bash
     npm list @tabler/icons-react
     ```
   - IconInfo의 올바른 아이콘 이름을 찾아주세요:
     ```bash
     # 사용 가능한 info 아이콘 검색
     npm run dev -- --help | grep -i info
     # 또는 패키지를 직접 확인
     node -e "console.log(Object.keys(require('@tabler/icons-react')).filter(k => k.toLowerCase().includes('info')))"
     ```
   - 올바른 아이콘 이름을 사용하도록 import 업데이트:
     ```typescript
     // ❌ 존재하지 않는 export
     import { IconInfo } from '@tabler/icons-react';
     
     // ✅ 올바른 이름 확인 (일반적인 대안들)
     import { IconInfoCircle } from '@tabler/icons-react';
     // 또는
     import { IconInfoSquare } from '@tabler/icons-react';
     // 또는
     import { IconInfoTriangle } from '@tabler/icons-react';
     ```

3. **테마 설정 colorScheme 속성 수정**:
   - `frontend/main/src/app/styles/theme.ts`를 읽어주세요
   - 사용 중인 테마 라이브러리를 식별해주세요 (Mantine, Chakra UI, Material-UI 등)
   - 컬러 스킴에 대한 올바른 속성 이름을 확인해주세요:
     ```typescript
     // ❌ 알 수 없는 'colorScheme' 속성
     const theme = {
       colorScheme: 'dark', // 잘못된 속성 이름일 수 있음
       // ...기타 속성들
     };
     
     // ✅ 일반적인 올바른 패턴들:
     // Mantine용:
     const theme = {
       colorScheme: 'dark', // Mantine의 경우 이것이 올바를 수 있음
       // 하지만 현재 버전 확인
     };
     
     // Chakra UI용:
     const theme = {
       config: {
         initialColorMode: 'dark',
         useSystemColorMode: false,
       }
     };
     
     // Material-UI용:
     const theme = {
       palette: {
         mode: 'dark',
       }
     };
     ```

4. **라이브러리 버전 및 호환성 확인**:
   - 라이브러리 버전을 package.json에서 확인해주세요:
     ```bash
     npm list react-window @tabler/icons-react
     ```
   - 크게 구식인 경우 라이브러리를 업데이트해주세요:
     ```bash
     npm update react-window @tabler/icons-react
     ```
   - 라이브러리 변경 로그에서 주요 변경사항을 확인해주세요

5. **코드베이스 전체에서 유사한 패턴 검색**:
   - 다른 react-window 사용을 찾아주세요:
     ```bash
     grep -r "FixedSizeList" frontend/main/src --include="*.tsx"
     grep -r "VariableSizeList" frontend/main/src --include="*.tsx"
     ```
   - 다른 @tabler/icons import를 확인해주세요:
     ```bash
     grep -r "@tabler/icons-react" frontend/main/src --include="*.tsx"
     ```
   - 다른 테마 설정을 찾아주세요:
     ```bash
     grep -r "colorScheme\|theme" frontend/main/src --include="*.ts" --include="*.tsx"
     ```

6. **모든 인스턴스를 일관되게 업데이트**:
   - 누락된 속성으로 모든 FixedSizeList 컴포넌트 수정
   - 올바른 이름을 사용하도록 모든 @tabler/icons import 업데이트
   - 앱 전체에서 테마 설정 표준화

7. **라이브러리 기능 테스트**:
   - FixedSizeList를 사용한 채팅 시스템이 올바르게 렌더링되는지 확인
   - 액션 버튼에 올바른 아이콘이 표시되는지 확인
   - 테마가 앱 전체에 적절히 적용되는지 확인

8. **모든 수정 사항 검증**:
   - `npm run typecheck`를 실행해서 TS2769, TS2724, TS2353 에러가 해결되었는지 확인
   - 개발 환경에서 영향받는 컴포넌트 테스트
   - 사용 중단된 API에 대한 런타임 경고를 콘솔에서 확인

**성공 기준**:
- TS2769 누락 속성 에러 없음
- TS2724 존재하지 않는 export 에러 없음
- TS2353 알 수 없는 속성 에러 없음
- 모든 라이브러리 컴포넌트가 올바르게 렌더링 및 작동
- 액션 버튼에 아이콘이 적절히 표시
- 테마 설정이 예상대로 작동
```

## 라이브러리별 업데이트 패턴

### react-window 업데이트
```typescript
// 현재 버전에 필요한 일반적인 속성들:
<FixedSizeList
  height={400}
  width="100%" // 새로운 버전에서 필수
  itemCount={items.length}
  itemSize={50}
  itemData={items} // 아이템에 데이터 전달
>
  {Row}
</FixedSizeList>
```

### @tabler/icons-react 일반적인 아이콘 이름들
```typescript
// 실제 사용 가능한 export 확인:
import {
  IconInfoCircle,    // 가장 일반적인 info 아이콘
  IconInfoSquare,
  IconInfoTriangle,
  IconAlertCircle,   // info/alert 대안
  IconQuestionMark,  // 도움말/info 대안
} from '@tabler/icons-react';
```

### 테마 설정 패턴
```typescript
// Mantine 테마 (Mantine 사용 시):
import { MantineTheme } from '@mantine/core';

const theme: Partial<MantineTheme> = {
  colorScheme: 'dark',
  primaryColor: 'blue',
};

// 커스텀 테마 객체:
const theme = {
  mode: 'dark', // colorScheme 대신
  colors: {
    primary: '#007bff',
  },
};
```

## 검증 단계

프롬프트 실행 후:

1. 특정 라이브러리 에러 확인:
   ```bash
   npx tsc --noEmit | grep -E "TS(2769|2724|2353)"
   ```

2. 영향받는 컴포넌트 테스트:
   ```bash
   npm run dev
   # 채팅 시스템 스크롤링 테스트
   # 액션 버튼 아이콘 표시 확인
   # 테마 적용 확인
   ```

3. 라이브러리 기능 검증:
   ```bash
   npm run build
   # 라이브러리 호환성 경고 없이 빌드되어야 함
   ```

## 예상 결과

- 모든 라이브러리 API 에러 해결
- 컴포넌트가 현재 라이브러리 API를 올바르게 사용
- UI에 아이콘이 적절히 표시
- 테마 설정이 예상대로 작동
- 6단계(코드 품질 개선)로 진행 준비 완료

## 문제 해결

에러가 지속되는 경우:
- 현재 API에 대한 라이브러리 문서 확인
- 라이브러리 버전이 호환되는지 확인
- 주요 버전 변경에 대한 마이그레이션 가이드 찾기
- API가 크게 변경된 경우 대체 라이브러리 고려

## 다음 단계

[06-code-quality-improvements.md](./06-code-quality-improvements.md)로 진행하세요