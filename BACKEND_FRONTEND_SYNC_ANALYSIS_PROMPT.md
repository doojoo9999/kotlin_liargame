# 백엔드-프론트엔드 동기화 분석 프롬프트

## 목표
백엔드(Kotlin/Spring Boot)와 프론트엔드(TypeScript/React) 간의 API 통신에서 발생하는 불일치 문제를 체계적으로 분석하고 해결합니다.

## 분석 대상

### 1. 핵심 데이터 타입 및 Enum 불일치 분석
다음 항목들의 백엔드-프론트엔드 간 일치성을 검증하세요:

#### A. 게임 상태 관련
- **GameState** (백엔드 enum vs 프론트엔드 타입)
- **GamePhase** (백엔드 enum vs 프론트엔드 타입)  
- **PlayerState** (백엔드 enum vs 프론트엔드 타입)
- **PlayerRole** (백엔드 enum vs 프론트엔드 타입)
- **GameMode** (백엔드 enum vs 프론트엔드 타입)

#### B. 채팅 관련
- **ChatMessageType** (백엔드 enum vs 프론트엔드 타입)
- **ChatMessage** 구조체 필드명

#### C. API 응답/요청 구조
- **GameStateResponse** 필드명과 타입
- **PlayerResponse** 필드명과 타입
- **ChatMessageResponse** 필드명과 타입
- 각종 Request DTO들의 필드명

### 2. 분석 방법론

#### 단계 1: 백엔드 정의 수집
```
1. src/main/kotlin/**/enum/*.kt 파일들의 모든 enum 값 추출
2. src/main/kotlin/**/dto/response/*.kt 파일들의 데이터 클래스 필드 추출  
3. src/main/kotlin/**/dto/request/*.kt 파일들의 데이터 클래스 필드 추출
4. src/main/kotlin/**/model/*.kt 파일들의 엔티티 클래스 필드 추출
```

#### 단계 2: 프론트엔드 정의 수집
```
1. frontend/src/**/types/*.ts 파일들의 interface/type 정의 추출
2. frontend/src/**/api/*.ts 파일들의 API 호출 파라미터/응답 타입 추출
3. frontend/src/**/stores/*.ts 파일들의 상태 관리 타입 추출
4. 컴포넌트에서 사용되는 props 타입 추출
```

#### 단계 3: 불일치 항목 식별
각 데이터 타입에 대해:
- enum 값이 정확히 일치하는가?
- 필드명이 camelCase/snake_case 규칙을 따르는가?
- 필드 타입이 호환되는가? (string vs number, boolean vs string 등)
- 옵셔널 필드 처리가 일치하는가? (null vs undefined vs optional)

#### 단계 4: 매핑 로직 검증
- 백엔드에서 Response DTO로 변환하는 `from()` 메서드들 검증
- 프론트엔드에서 API 응답을 파싱하는 로직 검증
- WebSocket 메시지 포맷 일치성 검증

### 3. 구체적인 검사 항목

#### A. GamePhase 불일치 검사
현재 확인된 문제:
- 백엔드: `VOTING_FOR_LIAR`, `DEFENDING`, `VOTING_FOR_SURVIVAL`, `GUESSING_WORD`, `GAME_OVER`
- 프론트엔드: `VOTE`, `DEFENSE`, `FINAL_VOTE`, `LIAR_GUESS`, `ENDED`

**검사 명령:**
```
1. grep_search로 백엔드의 모든 GamePhase enum 값 찾기
2. file_search로 프론트엔드의 phase 관련 타입 정의 찾기
3. switch/case 문에서 사용되는 모든 phase 값들 비교
4. 불일치 항목들의 매핑 테이블 생성
```

#### B. API Response 필드명 불일치 검사
**검사 방법:**
```
1. GameStateResponse.kt의 모든 필드명 추출
2. 프론트엔드 GameStateResponse 타입의 모든 필드명 추출  
3. 필드별 타입 호환성 검사 (예: LocalDateTime vs string)
4. 누락된 필드나 추가된 필드 식별
```

#### C. WebSocket 메시지 포맷 검사
**검사 항목:**
```
1. 백엔드에서 전송하는 WebSocket 메시지 구조
2. 프론트엔드에서 기대하는 WebSocket 메시지 구조
3. 메시지 타입 식별자 일치성
4. 페이로드 구조 일치성
```

### 4. 해결 방안 우선순위

#### 높은 우선순위 (즉시 수정 필요)
- 게임 플로우를 방해하는 enum 불일치
- API 응답에서 누락되거나 잘못된 타입의 필드
- WebSocket 메시지 파싱 실패를 야기하는 구조 불일치

#### 중간 우선순위 (점진적 개선)
- 일관성 없는 네이밍 컨벤션
- 옵셔널 필드 처리 방식 통일
- 타입 안전성 개선

#### 낮은 우선순위 (리팩토링 시 개선)
- 더 나은 타입 정의 구조
- 코드 중복 제거
- 문서화 개선

### 5. 예상 출력 형식

분석 결과를 다음 형식으로 제공해주세요:

```markdown
## 불일치 항목 분석 결과

### 1. Enum 불일치
| 백엔드 Enum | 백엔드 값 | 프론트엔드 타입 | 프론트엔드 값 | 상태 |
|-------------|-----------|-----------------|---------------|------|
| GamePhase   | VOTING_FOR_LIAR | GamePhase | VOTE | ❌ 불일치 |

### 2. API Response 필드 불일치  
| Response 클래스 | 백엔드 필드 | 백엔드 타입 | 프론트엔드 필드 | 프론트엔드 타입 | 상태 |
|----------------|-------------|-------------|-----------------|-----------------|------|
| GameStateResponse | turnOrder | List<String>? | turnOrder | string[]? | ✅ 일치 |

### 3. 수정 계획
1. **즉시 수정 (게임 기능 영향)**
   - [ ] GamePhase enum 값 통일
   - [ ] PlayerState enum 값 통일
   
2. **단계적 수정 (호환성 유지)**
   - [ ] API Response 필드명 통일
   - [ ] WebSocket 메시지 구조 표준화

3. **장기 개선**
   - [ ] 타입 정의 자동 생성 도구 도입
   - [ ] API 스키마 검증 자동화
```

### 6. 구현 가이드라인

분석 후 수정 작업 시:
1. **하위 호환성 유지**: 기존 API를 깨뜨리지 않고 점진적 마이그레이션
2. **타입 안전성 강화**: TypeScript의 엄격한 타입 체크 활용
3. **테스트 보강**: API 통신 테스트 케이스 추가
4. **문서화**: 변경사항을 BACKEND_API_DOCUMENTATION.md에 반영

### 7. 분석 실행 명령

이 프롬프트를 사용하여 분석을 실행할 때:
```
이 프롬프트의 지침에 따라 백엔드-프론트엔드 간 불일치 문제를 체계적으로 분석하고, 
우선순위에 따른 수정 계획을 제시한 후, 높은 우선순위 항목부터 순차적으로 수정해주세요.
```
