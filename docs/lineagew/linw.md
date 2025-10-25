1) 핵심 개념과 흐름(요약)

보스 처치(BossKill) → 아이템 획득(Item)

판매(Sale): (총액–수수료–세금)=정산원금(net)

분배 규칙 스냅샷(DistributionRule): 1/N 또는 가중치(가산비율), 라운딩/잔액 정책, 가점/감점(주간 참여도 보정) 적용

개별 분배(Payout) 생성 → 혈비(ClanFund) 턱걸이 잔액/조정 반영

리포트: 일정산(일자×혈원), 멤버 히스토리, 참여도/가점 로그

2) 정규화된 스키마(논리 설계)

PK는 (id) 단일 증가키(또는 UUID). FK는 →로 표기. 금액은 정수(원) 저장, 소수 필요 시 DECIMAL(18,2).

2.1 마스터/기본

Member(혈원)

id, name(UNIQUE), status(ACTIVE/INACTIVE), role(USER/ADMIN), joined_at, memo

인덱스: name, status

Boss

id, name(UNIQUE), tier(난이도), memo

2.2 보스 처치 & 참여

BossKill

id, boss_id → Boss, killed_at(DATE/TIMESTAMP), notes

인덱스: boss_id, killed_at

BossKillParticipant

id, boss_kill_id → BossKill, member_id → Member, base_weight(기본 1.0), attendance_flag(참여 인정)

복합 UNIQUE: (boss_kill_id, member_id)

인덱스: member_id, boss_kill_id

주간 참여도 계산의 원천 데이터가 바로 BossKillParticipant.

2.3 아이템/인벤토리

Item

id, name, grade(일반/고급/희귀/전설…), acquired_at, source_boss_kill_id → BossKill (NULL 허용),
status(IN_STOCK/RESERVED/SOLD), note

인덱스: status, grade, acquired_at

ItemTag(옵션)

아이템 검색 보조 테이블. item_id → Item, tag

2.4 판매/정산

Sale

id, item_id → Item (UNIQUE), sold_at, buyer, gross_amount, fee_amount, tax_amount,
net_amount(서버계산/검증), state(DRAFT/FINALIZED/CANCELED)

인덱스: sold_at, state

상태머신: DRAFT → FINALIZED → (관리자만) CANCELED

DistributionRule (정산 시점 스냅샷; 분배 옵션)

id, sale_id → Sale (UNIQUE)

mode(EQUAL_SPLIT/WEIGHTED)

rounding_mode(FLOOR/ROUND/CEIL)

remainder_policy(TO_CLAN_FUND/HIGHEST_WEIGHT/OLDEST_MEMBER/MANUAL_MEMBER)

manual_remainder_member_id → Member (NULL 허용)

가점/감점 관련:

participation_bonus_enabled(BOOL)

bonus_window(WEEK/2WEEKS/4WEEKS 등 가중기간 단위)

bonus_curve(LINEAR/STEP/LOGISTIC) ← 보정 곡선

bonus_base(기본 0, % 단위가 아닌 가중치 승수로 설계 권장. 예: 1.0=변화없음)

bonus_cap_multiplier(예: 1.3 → 최대 +30%)

penalty_floor_multiplier(예: 0.7 → 최소 -30%)

decay_policy(NONE/EXP_DECAY) & decay_half_life_days

인덱스: sale_id

DistributionParticipant (정산 시점의 참여자/가중치 “스냅샷”)

id, distribution_rule_id → DistributionRule

member_id → Member

base_weight(기본 1.0)

bonus_multiplier(보정 결과, 0.0~∞; 1.0=변화없음)

final_weight(= base_weight * bonus_multiplier) ← 계산값 저장

복합 UNIQUE: (distribution_rule_id, member_id)

인덱스: member_id

Payout (개별 분배액)

id, sale_id → Sale, member_id → Member, amount, created_at

복합 UNIQUE: (sale_id, member_id)

인덱스: member_id, sale_id

2.5 혈비(공동자금)

ClanFund

id (단일행 혹은 기간분리), balance

ClanFundTxn

id, occurred_at, type(INCOME/EXPENSE/ADJUST), amount, title, memo, related_sale_id → Sale (NULL), created_by → Member

인덱스: occurred_at, type, related_sale_id

2.6 정수(별도 재고)

Essence

id, name(UNIQUE), qty, memo

EssenceTxn(입출 로그 원하면)

id, essence_id → Essence, occurred_at, delta_qty, reason, memo

2.7 리포트/집계용(뷰/머티리얼라이즈)

vw_daily_settlement(일자×혈원)
date, member_id, amount, row_total, col_total

vw_member_summary(누적 분배, 최근 활동일, 참여횟수 등)

vw_participation_window(주간/월간 참여 카운트, 보정용 지표)

2.8 감사/안전

AuditLog

id, actor_member_id → Member, action(CREATE_SALE/SETTLE/ROLLBACK/EDIT_RULE…), object_type(SALE/ITEM/CLAN_FUND…),
object_id, before_json, after_json, occurred_at

IdempotencyKey(중복요청 방지; API 차원에서 필요 시)

idempotency_key(UNIQUE), endpoint, created_at

3) 분배 엔진: 계산 규칙(정밀)
   3.1 기본

net = gross_amount - fee_amount - tax_amount

모드별 “이론 분배액”:

EQUAL_SPLIT: theoretical_i = net / N

WEIGHTED:

참여자별 final_weight_i를 합산 → W = Σ final_weight_i

theoretical_i = net * (final_weight_i / W)

3.2 라운딩 & 잔액

라운딩 함수 R(x)는 rounding_mode에 따름(원 단위/혹은 DECIMAL).

amount_i = R(theoretical_i)

remainder = net - Σ amount_i (음/양 모두 가능. 보통 0~N-1원 범위)

remainder_policy에 따라 처리:

TO_CLAN_FUND(기본): 잔액 전액을 혈비 INCOME으로 편입

HIGHEST_WEIGHT: final_weight가 가장 높은 멤버에게 잔액 몰아주기(잔액 부호 고려)

OLDEST_MEMBER: 참여자 중 가입일이 가장 오래된 멤버에게

MANUAL_MEMBER: manual_remainder_member_id 지정한 멤버에게

3.3 주간 참여도 보정(가점/감점)

핵심: “%를 직접 더/빼는 것”보다 **가중치 승수(bonus_multiplier)**로 반영하는 게 안전하고 투명함.

윈도우 정의

bonus_window: 예) WEEK → [정산일 기준 -7일, 정산일] 구간의 참여 카운트

participation_count(member) = 구간 내 BossKillParticipant(attendance_flag=true) 건수

보정 곡선 선택

STEP(계단형) 예:

0회: 0.85, 1~2회: 1.00, 3~4회: 1.10, 5회+: 1.20

LINEAR(선형) 예:

bonus_multiplier = clamp( a * participation_count + b, penalty_floor, bonus_cap )

예: a=0.05, b=0.90 → 0회=0.90, 2회=1.00, 6회=1.20(캡)

LOGISTIC(완만한 S-곡선) 예:

bonus_multiplier = penalty_floor + (bonus_cap - penalty_floor) / (1 + e^(-k*(count - x0)))

감쇠(Decay) 옵션

decay_policy=EXP_DECAY면, 과거 참여에 가중치: weight = e^(-ln(2)*days/half_life)

participation_score = Σ weight → 곡선에 입력값으로 활용

최종

final_weight = base_weight * bonus_multiplier

캡/바닥: bonus_cap_multiplier, penalty_floor_multiplier로 안전장치

로그 기록: DistributionParticipant에 bonus_multiplier 저장 + 별도 ParticipationBonusLog(옵션)로

sale_id, member_id, window, raw_count, score, curve_params, multiplier

장점: 로직이 완전 재현 가능(스냅샷 저장), 분배 이슈 발생 시 근거 제시가 쉬움.

3.4 예외/제외 규칙(옵션)

AFK/낮은 기여도 제외: attendance_flag=false면 참여에서 제외

최소 자격 조건: 예) 최근 4주 참여 합 ≥ T or 최근 N회 연속 결석 시 감점 강화

수동 가중치: 특정 역할(탱/힐/샷콜러)에 base_weight 상향

4) 상태머신 & 무결성

Item.status

IN_STOCK → RESERVED → SOLD (정산 확정 시 SOLD 고정)

Sale.state

DRAFT → FINALIZED (→ CANCELED: 관리자만, 감사 로그 필수)

정산 확정(Settle) 트랜잭션:

Sale의 net 검증

DistributionRule/Participants 스냅샷 확정(LOCK)

Payout N건 생성(합=net±잔액 처리 후 일치)

remainder 정책 처리(혈비 Txn 생성 또는 특정 멤버 가산)

Item.status=SOLD, Sale.state=FINALIZED

AuditLog 기록

정산 롤백(Cancel):

Payout/Txn 되돌림, 상태 DRAFT 복귀, AuditLog 남김

이미 외부 지급 완료 시 롤백 제한/보정 ADJUST만 허용 등 가드레일 가능

5) 리포트 & 조회 성능

일정산 뷰: 기간/멤버/보스 필터, 합계 행열, CSV/엑셀 내보내기

구현: Payout과 Sale.sold_at을 날짜로 피벗

대용량 대응: 머티리얼라이즈드 뷰 + 새벽 리프레시 또는 증분 업데이트

참여도 패널: 주차별 히트맵(멤버×주차), 가점 승수 타임라인

추적성: Payout → DistributionParticipant → DistributionRule 파고들며 “왜 이 금액인가?”를 한 화면에서 설명

6) 업로드/마이그레이션 가이드(스프레드시트 → DB)

혈원(4.혈원) → Member(name, status, memo)

보스킬 & 참여: 재구성 필요

같은 날짜/보스 묶음으로 BossKill 생성 → 참여자 열 플래그를 BossKillParticipant로 변환

인벤토리(1.재고) → Item (+ 출처 있으면 source_boss_kill_id)

판매 정보가 행에 섞여 있으면 → Sale로 분리(총액/수수료/세금/일자)

정산(2.정산, 6.일정산): 검증용 참고만 하고, 실제 분배는 Sale/Payout로 재계산

혈비(3.혈비) → ClanFundTxn으로 변환

정수(5.정수) → Essence(+옵션으로 EssenceTxn)

업로드는 “미리보기 → 매핑 확인 → 커밋” 3단계. 중복 멤버/품목 이름 병합 규칙 명확화.

7) 규칙 구성(관리 화면에서 바꿀 수 있게)

Global Policy(단일 레코드 설정 테이블 추천)

기본 라운딩 모드, 기본 잔액 정책

기본 보정 곡선/파라미터(a, b, cap, floor, logistic k/x0 등)

기본 보스별 base_weight 가중치(난이도 보정) 옵션

정책 버전 기록(변경 시점부터 새 판매에만 적용)

Sale별 오버라이드: DistributionRule 레벨에서 개별 설정 덮어쓰기

정책 변경 히스토리와 적용 범위를 감사 가능하게 저장

8) 안정장치/운영 포인트

동시확정 방지: Sale별 뮤텍스/낙관적 락(버전)

금액 정확성: 금액 = 정수(원) 저장, 합산/라운딩의 총합 검증

검증쿼리: FINALIZED Sale 합계 = Σ Payout + remainder 처리가 항상 일치해야 함

권한 분리: 정산 확정/혈비 조정은 관리자만

Idempotency: 정산 API는 같은 payload+키로 중복 확정 불가

9) Codex용 “구현 지시 프롬프트” (스택 미지정, DB/로직 중심)

아래 블록을 그대로 전달하면 됨.

목표: '보스 처치→아이템→판매→분배' 스프레드시트를 대체하는 웹앱의 서버 모델을 구현한다.
요구사항:
1) 본 지시문 상단의 'DB 스키마(논리)'와 '분배 엔진 계산 규칙'을 기준으로 영속 모델/마이그레이션을 생성하고,
   엔드포인트와 서비스 레이어를 구성한다. (스택은 현재 프로젝트 환경을 재사용)
2) 분배 로직:
    - net = gross - fee - tax
    - mode=EQUAL_SPLIT 또는 WEIGHTED(final_weight 기반)
    - final_weight = base_weight * bonus_multiplier
    - bonus_multiplier는 주간 참여도 보정 규칙으로 계산(윈도우/곡선/캡/바닥/감쇠 포함)
    - rounding_mode에 따라 개별 금액 라운딩, remainder는 remainder_policy에 따라 처리
3) 정산 확정 트랜잭션:
    - DistributionRule/Participants 스냅샷 저장
    - Payout 생성(합 일치 검증)
    - Item/Sale 상태 업데이트, ClanFundTxn 생성(필요시)
    - AuditLog 기록
4) 리포트:
    - 일정산: 날짜×멤버 피벗 API
    - 참여도: 기간/윈도우별 참여 카운트/보정 승수 API
5) 업로드:
    - 기존 시트 CSV/XLSX → Member, BossKill, BossKillParticipant, Item, Sale, ClanFundTxn, Essence로 매핑
    - 미리보기→매핑확인→커밋
6) 테스트:
    - 1/N, 가중치, 라운딩/잔액, 보정 곡선/감쇠, 확정/롤백, 보고서 피벗 검증
      출력물: 마이그레이션 스키마, 도메인 엔티티, 서비스/리포지토리, API 계약서(YAML/문서), 테스트.
      주의: 금액은 정수(원) 저장 권장. 모든 정책 값은 스냅샷 및 감사 가능해야 함.

10) 구현 산출물 요약

- 백엔드: `org.example.lineagew` 패키지 신규 구성 (엔티티, 서비스, API 컨트롤러, 업로드 도구, 감사/정책/레포트 모듈). `KotlinLiargameApplication`은 `org.example.lineagew`를 스캔하도록 확장.
- 테스트: `SaleServiceIntegrationTest` 로 분배 엔진 가중치 및 잔액 정합성 검증.
- 프런트엔드: `apps/lineagew-admin` Vite/React 콘솔. 멤버/보스/보스킬/인벤토리/세일/클랜펀드/정책/리포트/업로드 전 기능 검사 UI. 기본 base path는 `/linw/`로, 배포 시 Nginx 등에 `location /linw/ { try_files $uri /linw/index.html; }` 형태로 정적 호스팅하면 `https://zzirit.kr/linw`에서 동작한다.
- API 명세: `docs/lineagew/api-contract.yaml` (OpenAPI 3.0) 수록.
