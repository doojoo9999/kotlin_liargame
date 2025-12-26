# 던전앤파이터 데미지 계산 로직 점검 (현재 코드 기준)

이 문서는 현재 코드에 구현된 데미지 계산 흐름과 API 매핑을 정리한 점검용 문서입니다.

## 1. 근거 코드 범위
- 계산 로직: `src/main/kotlin/org/example/dnf_raid/service/DnfPowerCalculator.kt`
- 스킬 계수 계산: `src/main/kotlin/org/example/dnf_raid/service/SkillCalculationService.kt`
- 스킬 데이터 정규화: `src/main/kotlin/org/example/dnf_raid/service/SkillNormalization.kt`
- DNF API 연동: `src/main/kotlin/org/example/dnf_raid/service/DnfApiClient.kt`
- 스킬 카탈로그 동기화: `src/main/kotlin/org/example/dnf_raid/service/DnfSkillCatalogService.kt`
- 캐릭터 계산/저장: `src/main/kotlin/org/example/dnf_raid/service/DnfCharacterService.kt`
- 계산 결과 저장: `src/main/kotlin/org/example/dnf_raid/service/DnfDamageCalculationService.kt`
- 모델: `src/main/kotlin/org/example/dnf_raid/model/DnfCalculationModels.kt`
- 공식 레퍼런스 문서: `docs/dnf/damage_formula_2025.md`

## 2. 처리 흐름 요약
1. 캐릭터 조회/캐시 갱신
2. Neople DNF API로 풀 스테이터스 수집
3. 장비/세트/크리쳐/패시브/스킬을 통해 Lane 합산
4. 스킬 계수 및 쿨타임 반영 후 Top 7 스킬 합산
5. 계산 결과를 `dnf_calculated_damages.calc_json`에 저장

## 3. API 매핑과 데미지 참고 데이터
Base URL: `https://api.neople.co.kr/df`

### 3.1 캐릭터/기본 정보
| API | 사용 데이터 | 데미지 계산 반영 여부 |
| --- | --- | --- |
| `GET /servers/{serverId}/characters?characterName=...` | characterId, jobName, jobGrowName, fame, adventureName | 검색/캐싱용 (계산 직접 사용 X) |
| `GET /servers/{serverId}/characters/{characterId}` | 기본 캐릭터 정보 | 캐싱용 (계산 직접 사용 X) |
| `GET /servers/{serverId}/characters/{characterId}/status` | STR/INT/VIT/SPR, 물/마/독공, 속성 강화 | 기본 공격력/주스탯/속성 계산에 사용 |

### 3.2 장비/옵션/세트
| API | 사용 데이터 | 데미지 계산 반영 여부 |
| --- | --- | --- |
| `GET /servers/{serverId}/characters/{characterId}/equip/equipment` | itemId, explain, itemRarity, setItemId, reinforce, amplificationName, fusionOption | 장비 옵션/세트포인트/테아 보너스 계산에 사용 |
| `GET /items/{itemId}` | itemExplain, itemFlavorText, itemFixedOption.explain, itemStatus, levelOptions, setItemId | SkillAtk/공증/피증/추뎀/최종/크증/쿨감/속성/방무/레벨옵션 파싱에 사용 |
| `GET /setitems/{setItemId}` | setItemBonus(status/explain) | 세트 보너스 Lane 합산에 사용 |

### 3.3 스킬/스타일
| API | 사용 데이터 | 데미지 계산 반영 여부 |
| --- | --- | --- |
| `GET /servers/{serverId}/characters/{characterId}/skill/style` | skillId, level, enhancement/evolution | 스킬 필터링/레벨 결정/강화옵션 반영에 사용 |
| `GET /jobs` | 직업 목록 | 스킬 카탈로그 동기화에 사용 |
| `GET /skills/{jobId}?jobGrowId=...` | 스킬 목록 | 스킬 카탈로그 동기화에 사용 |
| `GET /skills/{jobId}/{skillId}` | optionDesc/optionValue/levelInfo 등 | 스킬 계수/쿨타임 계산에 사용 |

### 3.4 기타 장착물
| API | 사용 데이터 | 데미지 계산 반영 여부 |
| --- | --- | --- |
| `GET /servers/{serverId}/characters/{characterId}/equip/avatar` | 엠블렘 텍스트 | 버프 점수 계산에 사용 |
| `GET /servers/{serverId}/characters/{characterId}/equip/creature` | explain, artifacts | 버프 점수 + 딜 Lane(피증) 보너스 계산 |
| `GET /servers/{serverId}/characters/{characterId}/equip/talisman` | 탈리스만/룬 | 현재 딜 계산에 반영하지 않음 |

### 3.5 로드아웃 캐시 전용 (현재 계산 미반영)
`/timeline`, `/equip/flag`, `/equip/mist-assimilation`, `/skill/buff/equip/*` 등은
`DnfCharacterLoadoutService`에서 JSON으로 저장만 하며 딜 계산에는 반영되지 않습니다.

## 4. Lane(카테고리) 정의와 합산 규칙
`LaneTotals` 필드(퍼센트는 0.1 = 10%):
- `skillAtk` (스킬 공격력 증가)
- `attackIncrease` (공격력 증가)
- `damageIncrease` (피해/데미지 증가)
- `additionalDamage` (추가 피해/추가 데미지)
- `finalDamage` (최종 데미지)
- `criticalDamage` (크리티컬 데미지)
- `elementalAttackBonus` (모든 속성 강화)
- `defensePenetration` (방어 무시)
- `cooldownReduction`, `cooldownRecovery`

합산 규칙:
- `skillAtk`, `finalDamage`는 곱연산 합산: `(1+a)*(1+b)-1`
- `cooldownReduction`도 곱연산 합산: `1-(1-a)*(1-b)`
- 나머지(`attackIncrease`, `damageIncrease`, `additionalDamage`, `criticalDamage`, `elementalAttackBonus`)는 단순 합산

## 5. 딜러 계산 공식 (코드 반영형)
### 5.1 기본 스탯
- `BaseAttack = max(물공, 마공, 독공)`
- `MainStat = max(STR, INT)`
- `StatMultiplier = 1 + MainStat / 250`
- `ElementalAttack = max(화/수/명/암) + elementalAttackBonus`
- `ElementalMultiplier = 1.05 + 0.0045 * ElementalAttack`
- `DefenseMultiplier = 1 - (def / (def + 1.0))`
  - 현재 `MONSTER_DEFENSE = 0`이므로 DefenseMultiplier는 항상 1.0

### 5.2 스킬 계수(스킬별)
`DnfSkillEntity.optionDesc`와 `levelInfo.rows.optionValue`를 사용:
1) 템플릿 기반 합산
- `SkillCalculationService.calculateTotalDamagePercent()`
- 데미지 관련 키워드가 있는 라인만 추출
- `x`, `*`, `+` 계산 후 합산

2) 구성요소 기반 합산 (히트/스택 파싱)
- `calculateComponentDamageSum()`
- `{valueX}` 주변 문맥에서 Damage/Hit/Stack을 분류
- `sum( (damage/100) * hits * stacks )`

3) 최종 계수 선택
- `max(templateCoeff, measuredCoeff, fallbackCoeff)`
- `templateCoeff`는 `toSkillCoefficient()`로 변환

4) 강화/개화 반영
- `skill/style`에서 강화 타입을 확인
- 강화 옵션의 `스킬공격력/최종/피해`는 coeff multiplier로 반영
- 강화 옵션의 쿨감은 base CD에 반영

### 5.3 최종 단일 데미지
```
SingleDamage = BaseAttack * SkillCoeff
             * (1 + attackIncrease)
             * (1 + damageIncrease + additionalDamage)
             * (1 + skillAtk) * (1 + finalDamage)
             * [1.5 * (1 + criticalDamage)]
             * (1 + situationalBonus)
             * (1 + partySynergyBonus)
             * StatMultiplier
             * ElementalMultiplier
             * DefenseMultiplier
```

### 5.4 쿨타임/시전 횟수
- `totalCdr = stack(equipment.cooldownReduction + passive.cooldownReduction)`
- `specificCdr = stack(levelOption.cdr)`
- `combinedCdr = stack(totalCdr + specificCdr)` 그리고 최대 0.7로 제한
- `realCd = baseCd * max(1 - combinedCdr, 0.3) / (1 + cooldownRecovery)`
- 시전 횟수: `floor(40 / realCd) + 1`
- 스킬 점수 = `SingleDamage * 시전 횟수`
- 상위 7개 스킬 점수 합이 딜러 점수

## 6. 버퍼 점수 계산
버퍼 직업만 적용:
```
bufferStat = max(INT, VIT, SPR)
statIncrease = (buffPower / 20) * (1 + bufferStat / 6000)
attackIncrease = (buffPower / 200) * (1 + bufferStat / 6000)
finalStat = 25250 + statIncrease
finalAtk = 3000 + attackIncrease
score = (finalStat/25250) * (finalAtk/3000) * 30750 * setMultiplier
```
- `setMultiplier`: `SetEffectTable.getBuffMultiplier(totalSetPoints)`
- 버프 파워 합산: 장비 buff + 아바타 엠블렘 + 크리쳐 설명문

## 7. 계산 결과 저장 구조
- `dnf_calculated_damages`에 저장
  - `dealer_score`, `buffer_score`, `calc_json`
- `calc_json`에는 Top7 스킬 및 계산 breakdown 포함

## 8. 값 불일치 가능 지점 (코드 기준)
1. **추뎀/피증 합산 방식**
   - `additionalDamage`가 `damageIncrease`와 같은 Lane으로 합산됨
   - 실제 공식이 `(1+피증)*(1+추뎀)`이면 현재는 과소 평가

2. **속성 계산 단순화**
   - `ElementalMultiplier = 1.05 + 0.0045 * Elem` 고정
   - 몬스터 속저/저항 및 `monsterResist`는 미반영

3. **방어력/방무 미반영**
   - `MONSTER_DEFENSE = 0`이라 방무/방깎은 실질 효과 없음

4. **주스탯 선택 방식**
   - `max(STR, INT)` 사용 (직업별 스탯 구분 없음)

5. **스킬 계수 정규화 이슈 가능성**
   - `toSkillCoefficient()`는 합산 값이 100 이하일 경우 /100을 하지 않음
   - 옵션 값이 50(=50%)일 때 coeff가 50으로 반영될 위험

6. **스킬 히트/스택 파싱 휴리스틱**
   - 문맥 인식 실패 시 DAMAGE로 간주
   - 다단/지속형 스킬에서 과대/과소 가능

7. **탈리스만/룬/버프 장비 미반영**
   - talisman/flag/mist/buff gear 등은 캐싱만 하고 계산에는 반영하지 않음

8. **세트/테아 보너스 휴리스틱**
   - 세트 발동은 `N세트` 문자열 파싱에 의존
   - 테아 보너스는 `1% * 강화수치`로 가정 (근거 불명)

9. **쿨타임 시전 횟수 계산**
   - 40초 창에서 `floor(40/realCd)+1` 로 계산
   - CD가 40초인 경우 2회로 잡히는 등 Dundam과 차이 가능

10. **크리티컬 확정 가정**
   - 항상 `1.5 * (1 + criticalDamage)` 적용 (치명타 확률 고려 없음)

---

필요하면 위 항목을 기준으로 실제 유저 캐릭터 1~2개의 샘플을 잡아
API 원본값 vs 계산 중간값(`calc_json` breakdown) 비교표를 추가로 만들 수 있습니다.
