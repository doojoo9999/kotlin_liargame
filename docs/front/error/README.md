# TypeScript 에러 해결 가이드

이 디렉토리는 프론트엔드 코드베이스의 약 300개 TypeScript 에러를 체계적으로 해결하기 위한 프롬프트들을 포함하고 있습니다.

## 에러 개요

종합적인 분석을 통해 다음과 같이 에러를 분류했습니다:

- **긴급**: 6개의 컴파일을 막는 구문 에러
- **높은 우선순위**: 24개의 설정 및 의존성 에러 (51%)
- **중간 우선순위**: 6개의 라이브러리 API 및 타입 미스매치 에러 (13%)
- **낮은 우선순위**: 코드 품질 개선

## 실행 순서

최적의 결과를 위해 다음 순서로 프롬프트를 실행하세요:

### 1단계: 긴급 수정 (반드시 먼저 수정)
1. **[01-critical-syntax-errors.md](./01-critical-syntax-errors.md)** - 컴파일을 막는 구문 에러 수정
2. **[02-test-framework-configuration.md](./02-test-framework-configuration.md)** - Jest/Vitest 설정 표준화

### 2단계: 인프라 수정
3. **[03-dependency-resolution.md](./03-dependency-resolution.md)** - 누락된 의존성 설치 및 import 수정
4. **[04-type-mismatches.md](./04-type-mismatches.md)** - 타입 호환성 문제 해결

### 3단계: 라이브러리 업데이트
5. **[05-library-api-updates.md](./05-library-api-updates.md)** - 구식 라이브러리 사용 패턴 업데이트

### 4단계: 코드 품질
6. **[06-code-quality-improvements.md](./06-code-quality-improvements.md)** - 타입 안전성 및 코드 표준 개선

## 성공 기준

모든 프롬프트 실행 후:
- [ ] TypeScript 컴파일이 에러 없이 성공
- [ ] 모든 테스트가 타입 에러 없이 실행
- [ ] 암시적 `any` 타입이 남아있지 않음
- [ ] 코드베이스 전체에서 import 경로가 일관성 있음
- [ ] 라이브러리 API가 최신이며 적절히 타입이 지정됨

## 검증 명령어

각 단계 후에 실행:
```bash
npm run typecheck
npm run lint
npm run build
npm test
```

## 예상 소요 시간

- **1단계**: 1-2시간 (긴급 수정)
- **2단계**: 2-3시간 (인프라)
- **3단계**: 1-2시간 (라이브러리 업데이트)
- **4단계**: 2-3시간 (코드 품질)

**총 시간**: 완전한 해결을 위해 6-10시간

## 주의사항

- 각 프롬프트 파일에는 Claude Code를 위한 구체적인 지시사항이 포함되어 있습니다
- 순서를 엄격히 따르세요 - 이후 단계가 이전 수정에 의존합니다
- 다음 단계로 진행하기 전에 각 단계를 철저히 테스트하세요
- 의존성이 수정되면서 일부 에러가 자동으로 해결될 수 있습니다