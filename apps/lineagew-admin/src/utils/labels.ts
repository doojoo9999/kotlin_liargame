import {
  BonusCurveType,
  BonusWindow,
  ClanFundTxnType,
  DistributionMode,
  ItemGrade,
  ItemStatus,
  MemberRole,
  MemberStatus,
  PayoutStatus,
  RemainderPolicy,
  RoundingStrategy,
  SaleState,
  DecayPolicy,
} from "../types";

const ITEM_GRADE_LABELS: Record<ItemGrade, string> = {
  [ItemGrade.COMMON]: "일반",
  [ItemGrade.UNCOMMON]: "고급",
  [ItemGrade.RARE]: "희귀",
  [ItemGrade.EPIC]: "영웅",
  [ItemGrade.LEGENDARY]: "전설",
};

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.IN_STOCK]: "보관 중",
  [ItemStatus.RESERVED]: "예약됨",
  [ItemStatus.SOLD]: "판매 완료",
};

const SALE_STATE_LABELS: Record<SaleState, string> = {
  [SaleState.DRAFT]: "초안",
  [SaleState.FINALIZED]: "정산 완료",
  [SaleState.CANCELED]: "취소됨",
};

const DISTRIBUTION_MODE_LABELS: Record<DistributionMode, string> = {
  [DistributionMode.EQUAL_SPLIT]: "균등 분배",
  [DistributionMode.WEIGHTED]: "가중치 분배",
};

const ROUNDING_STRATEGY_LABELS: Record<RoundingStrategy, string> = {
  [RoundingStrategy.FLOOR]: "내림",
  [RoundingStrategy.ROUND]: "반올림",
  [RoundingStrategy.CEIL]: "올림",
};

const REMAINDER_POLICY_LABELS: Record<RemainderPolicy, string> = {
  [RemainderPolicy.TO_CLAN_FUND]: "잔액 혈비 적립",
  [RemainderPolicy.HIGHEST_WEIGHT]: "최고 가중치 혈원",
  [RemainderPolicy.OLDEST_MEMBER]: "최고참 혈원",
  [RemainderPolicy.MANUAL_MEMBER]: "지정 혈원",
};

const BONUS_WINDOW_LABELS: Record<BonusWindow, string> = {
  [BonusWindow.WEEK]: "1주",
  [BonusWindow.TWO_WEEKS]: "2주",
  [BonusWindow.FOUR_WEEKS]: "4주",
};

const BONUS_CURVE_LABELS: Record<BonusCurveType, string> = {
  [BonusCurveType.STEP]: "계단형",
  [BonusCurveType.LINEAR]: "선형",
  [BonusCurveType.LOGISTIC]: "로지스틱",
};

const DECAY_POLICY_LABELS: Record<DecayPolicy, string> = {
  [DecayPolicy.NONE]: "미적용",
  [DecayPolicy.EXP_DECAY]: "지수 감소",
};

const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "활동",
  [MemberStatus.INACTIVE]: "비활성",
};

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.USER]: "일반",
  [MemberRole.ADMIN]: "관리자",
};

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  [PayoutStatus.PENDING]: "대기",
  [PayoutStatus.PAID]: "지급 완료",
};

const CLAN_FUND_TYPE_LABELS: Record<ClanFundTxnType, string> = {
  [ClanFundTxnType.INCOME]: "입금",
  [ClanFundTxnType.EXPENSE]: "출금",
  [ClanFundTxnType.ADJUST]: "조정",
};

export const getItemGradeLabel = (grade: ItemGrade): string => ITEM_GRADE_LABELS[grade] ?? grade;
export const getItemStatusLabel = (status: ItemStatus): string => ITEM_STATUS_LABELS[status] ?? status;
export const getSaleStateLabel = (state: SaleState): string => SALE_STATE_LABELS[state] ?? state;
export const getDistributionModeLabel = (mode: DistributionMode): string => DISTRIBUTION_MODE_LABELS[mode] ?? mode;
export const getRoundingStrategyLabel = (strategy: RoundingStrategy): string => ROUNDING_STRATEGY_LABELS[strategy] ?? strategy;
export const getRemainderPolicyLabel = (policy: RemainderPolicy): string => REMAINDER_POLICY_LABELS[policy] ?? policy;
export const getBonusWindowLabel = (window: BonusWindow): string => BONUS_WINDOW_LABELS[window] ?? window;
export const getBonusCurveLabel = (curve: BonusCurveType): string => BONUS_CURVE_LABELS[curve] ?? curve;
export const getDecayPolicyLabel = (policy: DecayPolicy): string => DECAY_POLICY_LABELS[policy] ?? policy;
export const getMemberStatusLabel = (status: MemberStatus): string => MEMBER_STATUS_LABELS[status] ?? status;
export const getMemberRoleLabel = (role: MemberRole): string => MEMBER_ROLE_LABELS[role] ?? role;
export const getPayoutStatusLabel = (status: PayoutStatus): string => PAYOUT_STATUS_LABELS[status] ?? status;
export const getClanFundTypeLabel = (type: ClanFundTxnType): string => CLAN_FUND_TYPE_LABELS[type] ?? type;
