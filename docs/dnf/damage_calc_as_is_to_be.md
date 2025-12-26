# 던파 데미지 계산 로직 변경 요약 (As-Is vs To-Be)

본 문서는 2025 중천 시즌 기준, 던전앤파이터 데미지 계산 로직의 변경 사항을 As-Is/To-Be 형식으로 정리한 문서입니다.

## 1) 피해증가 + 추가데미지 합산 → 곱연산 분리

**As-Is**
- 피해증가와 추가데미지를 합산 처리
- 수식: `(1 + damageIncrease + additionalDamage)`
- 위치: `src/main/kotlin/org/example/dnf_raid/service/DnfPowerCalculator.kt`

**To-Be**
- 피해증가와 추가데미지를 서로 다른 Lane으로 곱연산 처리
- 수식: `(1 + damageIncrease) * (1 + additionalDamage)`
- 변경 반영: `damageIncreaseMultiplier` 및 `mDmgInc` 계산

## 2) 스킬 사용 횟수 계산: 40초 고정 → 43초 + 시전시간 고려

**As-Is**
- 고정 40초 창에서 `floor(40 / realCd) + 1`
- 시전시간(casting time) 미고려

**To-Be**
- 43초 창 사용 (`SKILL_TIME_WINDOW_SECONDS = 43.0`)
- 시전시간을 포함한 간이 시뮬레이션 적용
- 수식:  
  `effectiveCooldown = realCd + castingTime`  
  `castCount = floor((window - castingTime) / effectiveCooldown) + 1`
- 변경 반영: `simulateCastCount(...)`

## 3) 방어력/방무: 고정 0 → 콘텐츠별 방어율 적용

**As-Is**
- `MONSTER_DEFENSE = 0.0` 고정
- 방어력/방무가 결과에 반영되지 않음

**To-Be**
- 콘텐츠별 방어력 테이블 도입
- 방어율 공식:  
  `defenseRate = defense / (defense + 200 * attackerLevel)`
- 방무 적용: `defenseRate * (1 - defensePenetration)`
- 최종 배율: `1 - effectiveDefenseRate`
- 적용 대상: `calculateDefenseMultiplier(...)`
- `DungeonType` 추가:
  - `NORMAL(25000.0)`
  - `ANCIENT(150000.0)`
  - `RAID_OZMA(200000.0)`
  - `SANDBAG(0.0)`

## 4) 주스탯 선택: max(STR, INT) → 직업 키워드 매핑 + fallback

**As-Is**
- `mainStat = max(str, int)`

**To-Be**
- 직업/전직명 키워드로 물리/마법 주스탯 선택
- 매칭 실패 시 `max(str, int)` fallback
- 적용 함수: `resolveMainStat(...)`
- 키워드 목록:
  - 마법 주스탯: `MAGICAL_MAIN_STAT_KEYWORDS`
  - 물리 주스탯: `PHYSICAL_MAIN_STAT_KEYWORDS`

## 5) 스킬 계수 정규화: 100 이하 값 처리 수정

**As-Is**
- `toSkillCoefficient`가 100 이하 값은 그대로 사용
- 예: 50% → 계수 50.0 (과대평가)

**To-Be**
- 모든 값에 대해 `/ 100.0` 적용
- 예: 50% → 계수 0.5
- 변경 반영: `src/main/kotlin/org/example/dnf_raid/service/SkillCalculationService.kt`
- 테스트 추가: `SkillCalculationServiceTest#normalizes small percent values`

## 6) 기본 버프/상황 보너스 기본값 조정

**As-Is**
- `DEFAULT_SITUATIONAL_BONUS = 0.25`

**To-Be**
- 기본값 0.0으로 변경 (버프/시너지 별도 처리 전제)

## 7) 스킬 정의: 시전시간 필드 추가

**As-Is**
- 스킬 정의에 시전시간(castingTime) 미포함

**To-Be**
- `SkillDefinition`에 `castingTime` 추가
- `NormalizedLevelRow.castingTime`에서 값 취득

---

## 변경 요약 (파일 기준)
- `src/main/kotlin/org/example/dnf_raid/service/DnfPowerCalculator.kt`
  - 피해증가/추가데미지 곱연산 분리
  - 43초 + 시전시간 기반 스킬 횟수 계산
  - 방어율 공식 및 방무 반영
  - 직업별 주스탯 매핑
  - 기본 상황 보너스 0.0으로 변경
  - `DungeonType`, `castingTime` 추가

- `src/main/kotlin/org/example/dnf_raid/service/SkillCalculationService.kt`
  - 스킬 계수 정규화: 항상 `/100.0`

- `src/test/kotlin/org/example/dnf_raid/service/SkillCalculationServiceTest.kt`
  - 50% 정규화 테스트 추가
