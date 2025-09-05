# 치명적 구문 에러 - 1단계

**우선순위**: 치명적 (반드시 먼저 수정)
**예상 소요시간**: 1-2시간
**에러 개수**: 6개의 컴파일을 막는 구문 에러

## 개요

이러한 구문 에러들은 TypeScript 컴파일을 방해하므로 다른 수정 작업이 효과를 발휘하기 전에 반드시 해결해야 합니다.

## 영향받는 파일

1. `/d/workspaces/kotlin_liargame/frontend/src/test/hooks/hooks.test.ts` - 6개 구문 에러
2. `/d/workspaces/kotlin_liargame/frontend/src/versions/main/components/game/chat-system.tsx` - 다수의 구문 문제

## Claude Code를 위한 프롬프트

```
컴파일을 방해하는 치명적인 TypeScript 구문 에러를 수정해주세요. 다음 구체적인 문제들에 집중해주세요:

1. **hooks.test.ts 구문 에러 수정**:
   - `/d/workspaces/kotlin_liargame/frontend/src/test/hooks/hooks.test.ts` 파일을 읽어주세요
   - TS1005, TS1128, TS1161 에러를 찾아서 수정해주세요
   - 테스트 파일에 적절한 TypeScript 구문을 확보해주세요
   - 종료되지 않은 정규식을 수정해주세요
   - 누락된 선언문을 추가해주세요

2. **chat-system.tsx 구문 문제 수정**:
   - `/d/workspaces/kotlin_liargame/frontend/src/versions/main/components/game/chat-system.tsx`를 읽어주세요
   - 컴파일을 방해하는 모든 구문 에러를 해결해주세요
   - 잘못된 JSX나 TypeScript 구문을 수정해주세요

3. **컴파일 확인**:
   - 각 수정 후 `npm run typecheck`를 실행해주세요
   - TypeScript 컴파일러가 더 이상 구문 에러를 보고하지 않는지 확인해주세요
   - TS1005, TS1128, TS1161 에러 없이 파일들이 파싱될 수 있는지 확인해주세요

**요구사항**:
- 구문 에러만 수정하고, 로직이나 기능은 변경하지 마세요
- 기존 코드 구조와 의도를 보존해주세요
- 수정된 모든 파일이 구문 에러 없이 컴파일되도록 확보해주세요
- 테스트 파일에는 TypeScript 모범 사례를 사용해주세요

**성공 기준**:
- TS1005 (예상 토큰) 에러 없음
- TS1128 (선언 예상) 에러 없음
- TS1161 (종료되지 않은 정규식) 에러 없음
- TypeScript 컴파일러가 모든 파일을 구문 문제 없이 파싱 가능
```

## 검증 단계

프롬프트 실행 후:

1. 컴파일 확인 실행:
   ```bash
   npm run typecheck
   ```

2. 특정 파일 컴파일 확인:
   ```bash
   npx tsc --noEmit frontend/src/test/hooks/hooks.test.ts
   npx tsc --noEmit frontend/src/versions/main/components/game/chat-system.tsx
   ```

3. 남은 구문 에러 확인:
   ```bash
   npx tsc --noEmit | grep -E "TS(1005|1128|1161)"
   ```

## 예상 결과

- 모든 구문 에러 (TS1005, TS1128, TS1161) 해결
- TypeScript 컴파일러가 모든 파일을 파싱 가능
- 2단계 (테스트 설정)로 진행 준비 완료

## 문제 해결

에러가 지속되는 경우:
- 숨겨진 문자나 인코딩 문제 확인
- 적절한 줄 끝 (LF vs CRLF) 확인
- 누락된 대괄호, 괄호, 인용부호가 없는지 확인
- 불완전한 import/export 문 찾기

## 다음 단계

구문 에러가 해결되면 [02-test-framework-configuration.md](./02-test-framework-configuration.md)로 진행하세요