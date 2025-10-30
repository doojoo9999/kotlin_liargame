export interface MemberResponse {
  id: number;
  name: string;
  status: MemberStatus;
  role: MemberRole;
  joinedAt: string | null;
  lastActiveAt: string | null;
  memo: string | null;
}

export interface BossResponse {
  id: number;
  name: string;
  tier?: string | null;
  memo?: string | null;
}

export interface BossKillParticipantPayload {
  memberId: number;
  baseWeight?: string;
  attendance?: boolean;
}

export interface BossKillResponse {
  id: number;
  bossId: number;
  bossName: string;
  killedAt: string;
  notes?: string | null;
  participants: Array<{
    id: number;
    memberId: number;
    memberName: string;
    baseWeight: string;
    attendance: boolean;
  }>;
}

export interface ItemResponse {
  id: number;
  name: string;
  grade: ItemGrade;
  acquiredAt: string | null;
  sourceBossKillId: number | null;
  status: ItemStatus;
  note?: string | null;
  tags: string[];
}

export interface ItemDetailResponse extends ItemResponse {
  sourceBossKill?: BossKillResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutResponse {
  id: number;
  memberId: number;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  paidNote: string | null;
}

export interface PayoutDetailResponse {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  status: PayoutStatus;
  saleId: number;
  soldAt: string;
  saleMemo?: string | null;
  itemId: number;
  itemName: string;
  itemGrade: ItemGrade;
  bossKillId?: number | null;
  bossName?: string | null;
  bossKilledAt?: string | null;
  paidAt?: string | null;
  paidNote?: string | null;
  paidByMemberId?: number | null;
  paidByMemberName?: string | null;
}

export interface DistributionParticipantResponse {
  id: number;
  memberId: number;
  memberName: string;
  baseWeight: string;
  bonusMultiplier: string;
  finalWeight: string;
}

export interface DistributionRuleResponse {
  id: number;
  mode: DistributionMode;
  roundingMode: RoundingStrategy;
  remainderPolicy: RemainderPolicy;
  manualRemainderMemberId: number | null;
  participationBonusEnabled: boolean;
  bonusWindow: BonusWindow;
  bonusCurve: BonusCurveType;
  bonusBaseMultiplier: string;
  bonusCapMultiplier: string;
  penaltyFloorMultiplier: string;
  decayPolicy: DecayPolicy;
  decayHalfLifeDays: number | null;
  bonusLinearSlope?: string | null;
  bonusLinearIntercept?: string | null;
  bonusLogisticK?: string | null;
  bonusLogisticX0?: string | null;
  stepTiers: Array<{
    minParticipation: number;
    multiplier: string;
  }>;
  participants: DistributionParticipantResponse[];
}

export interface SaleResponse {
  id: number;
  itemId: number;
  itemName: string;
  soldAt: string;
  buyer?: string | null;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  netAmount: number;
  state: SaleState;
  memo?: string | null;
  distributionRule: DistributionRuleResponse | null;
  payouts: PayoutResponse[];
}

export interface ClanFundResponse {
  id: number;
  name: string;
  balance: number;
  transactions: ClanFundTxnResponse[];
}

export interface ClanFundTxnResponse {
  id: number;
  type: ClanFundTxnType;
  amount: number;
  title: string;
  memo?: string | null;
  occurredAt: string;
  relatedSaleId?: number | null;
  actorMemberId?: number | null;
}

export interface EssenceResponse {
  id: number;
  name: string;
  quantity: number;
  memo?: string | null;
  transactions: EssenceTxnResponse[];
}

export interface EssenceTxnResponse {
  id: number;
  deltaQty: number;
  reason: string;
  memo?: string | null;
  occurredAt: string;
}

export interface DailySettlementReport {
  rows: Array<{
    date: string;
    payouts: Array<{memberId: number; memberName: string; amount: number}>;
    rowTotal: number;
  }>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}

export interface ParticipationReport {
  window: BonusWindow;
  summaries: Array<{
    memberId: number;
    memberName: string;
    windowStart: string;
    windowEnd: string;
    participationCount: number;
    bonusMultiplier: string | null;
  }>;
}

export interface GlobalPolicyResponse {
  id: number;
  defaultRounding: RoundingStrategy;
  defaultRemainder: RemainderPolicy;
  defaultBonusWindow: BonusWindow;
  defaultBonusCurve: BonusCurveType;
  bonusBaseMultiplier: string;
  bonusCapMultiplier: string;
  penaltyFloorMultiplier: string;
  decayPolicy: DecayPolicy;
  decayHalfLifeDays: number | null;
  bonusLinearSlope: string;
  bonusLinearIntercept: string;
}

// Enumerations mirrored from backend. Keep in sync with backend enums.
export enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum MemberRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum ItemGrade {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
}

export enum ItemStatus {
  IN_STOCK = "IN_STOCK",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

export enum SaleState {
  DRAFT = "DRAFT",
  FINALIZED = "FINALIZED",
  CANCELED = "CANCELED",
}

export enum DistributionMode {
  EQUAL_SPLIT = "EQUAL_SPLIT",
  WEIGHTED = "WEIGHTED",
}

export enum RoundingStrategy {
  FLOOR = "FLOOR",
  ROUND = "ROUND",
  CEIL = "CEIL",
}

export enum RemainderPolicy {
  TO_CLAN_FUND = "TO_CLAN_FUND",
  HIGHEST_WEIGHT = "HIGHEST_WEIGHT",
  OLDEST_MEMBER = "OLDEST_MEMBER",
  MANUAL_MEMBER = "MANUAL_MEMBER",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  PAID = "PAID",
}

export enum BonusWindow {
  WEEK = "WEEK",
  TWO_WEEKS = "TWO_WEEKS",
  FOUR_WEEKS = "FOUR_WEEKS",
}

export enum BonusCurveType {
  STEP = "STEP",
  LINEAR = "LINEAR",
  LOGISTIC = "LOGISTIC",
}

export enum DecayPolicy {
  NONE = "NONE",
  EXP_DECAY = "EXP_DECAY",
}

export enum ClanFundTxnType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  ADJUST = "ADJUST",
}
