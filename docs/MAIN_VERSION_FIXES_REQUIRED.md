# Main Version 수정 필요 항목 정리

> **테스트 날짜**: 2025-01-03  
> **Phase 상태**: Phase 3 완료 (75%) - 수정 작업 필요  
> **총 발견 이슈**: 89개 (심각 21개, 중간 42개, 낮음 26개)

---

## 🚨 **우선순위 1: 긴급 수정 필요** 

### 1. 컴포넌트 Export/Import 오류
```
❌ src/versions/main/components/ui/button.tsx - Button export 누락
❌ src/versions/main/demo/SimpleComponentDemo.tsx - Button import 실패
❌ src/versions/main/pages/ComponentDemoPage.tsx - 다중 컴포넌트 import 실패
```

### 2. 경로 매핑 설정 미완료
```
❌ vite.config.ts - '@/' 경로 alias 설정 누락
❌ tsconfig.json - paths 매핑 누락
❌ Node.js 모듈 타입 정의 누락 (path, __dirname)
```

### 3. 페이지 컴포넌트 누락
```
❌ src/versions/main/pages/MainLobbyPage.tsx - 파일 없음
❌ src/versions/main/pages/MainGameRoomPage.tsx - 파일 없음  
❌ src/versions/main/pages/MainGamePlayPage.tsx - 파일 없음
❌ src/features/demo/GameComponentsDemo.tsx - 파일 없음
```

---

## ⚠️ **우선순위 2: 타입 안전성 개선**

### 4. TypeScript 엄격 모드 위반 (26건)
```
⚠️ type-only import 규칙 위반
⚠️ verbatimModuleSyntax 설정으로 인한 import 오류들
⚠️ interface 확장 시 타입 불일치 
```

### 5. 컴포넌트 Props 타입 불일치
```
⚠️ Badge 컴포넌트 - variant 타입 불일치 (8건)
⚠️ Progress 컴포넌트 - animated 속성 없음
⚠️ Button 컴포넌트 - variant 확장 타입 문제
```

### 6. Store 관련 타입 오류
```
⚠️ auth.store.ts - refreshToken 타입 충돌
⚠️ game.store.ts - GamePhase 타입 누락
⚠️ version.store.ts - Navigator API 타입 문제
```

---

## 📋 **우선순위 3: 코드 품질 개선**

### 7. 사용되지 않는 변수/Import (26건)
```
📝 사용되지 않는 import 정리
📝 선언만 되고 사용되지 않는 변수 정리
📝 중복 속성 정리
```

### 8. Deprecated API 사용
```
📝 React Query v5 - cacheTime → gcTime 변경
📝 Zod - errorMap 속성 문제
📝 Framer Motion - duration 속성 위치 수정
```

---

## 📊 **수정 난이도 및 예상 소요시간**

| 우선순위 | 항목 | 난이도 | 예상시간 |
|---------|------|--------|----------|
| 1 | 컴포넌트 Export 수정 | 쉬움 | 30분 |
| 1 | 경로 매핑 설정 | 중간 | 1시간 |
| 1 | 페이지 컴포넌트 생성 | 중간 | 2시간 |
| 2 | 타입 Import 수정 | 쉬움 | 1시간 |
| 2 | Props 타입 수정 | 중간 | 1시간 |
| 2 | Store 타입 수정 | 어려움 | 2시간 |
| 3 | 코드 정리 | 쉬움 | 1시간 |
| 3 | API 업데이트 | 중간 | 30분 |

**총 예상 소요시간: 약 9시간**

---

## ✅ **수정 완료 기준**

1. **타입 검사 통과**: `npm run type-check` 오류 0개
2. **빌드 성공**: `npm run build` 성공
3. **기본 데모 실행**: ComponentDemo 페이지 정상 렌더링
4. **라우팅 동작**: 모든 페이지 경로 정상 접근

---

## 🔄 **다음 단계**

수정 작업 완료 후:
1. **Phase 4: 고급 기능 및 완성도** 진행
2. **게임 특화 애니메이션** 구현
3. **성능 최적화** 적용
4. **접근성 개선** 작업

---

*이 문서는 Main Version 통합 테스트 결과를 바탕으로 작성되었습니다.*