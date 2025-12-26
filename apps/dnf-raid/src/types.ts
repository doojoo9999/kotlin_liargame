export type UUID = string;

export type PartyNumber = number | null;
export type SlotIndex = number | null;
export type CohortPreference = "FRONT" | "BACK";

export interface DnfCharacter {
  characterId: string;
  serverId: string;
  characterName: string;
  jobName: string;
  jobGrowName: string;
  jobId?: string | null;
  jobGrowId?: string | null;
  fame: number;
  damage?: number;
  buffPower?: number;
   calculatedDealer?: number | null;
   calculatedBuffer?: number | null;
  adventureName?: string | null;
  imageUrl: string;
}

export interface DealerSkillScore {
  name: string;
  level: number;
  coeff: number;
  baseCd: number;
  realCd: number;
  singleDamage: number;
  casts: number;
  score: number;
}

export interface DealerDamageDetail {
  totalScore: number;
  skills: DealerSkillScore[];
}

export interface DamageCalculationDetail {
  characterId: string;
  serverId: string;
  dealer?: DealerDamageDetail | null;
  bufferScore?: number | null;
  calculatedAt: string;
}

export interface Participant {
  id: UUID;
  raidId: UUID;
  damage: number;
  buffPower: number;
  partyNumber: PartyNumber;
  slotIndex: SlotIndex;
  cohortPreference: CohortPreference | null;
  character: DnfCharacter;
  createdAt?: string | null;
}

export interface RaidDetail {
  id: UUID;
  name: string;
  userId: string;
  isPublic: boolean;
  motherRaidId: UUID;
  createdAt?: string | null;
  participants: Participant[];
}

export interface RaidSummary {
  id: UUID;
  name: string;
  motherRaidId: UUID;
  isPublic: boolean;
  createdAt?: string | null;
  participantCount: number;
}

export interface RaidGroup {
  motherRaidId: UUID;
  name: string;
  isPublic: boolean;
  primaryRaid: RaidDetail;
  cohorts: RaidSummary[];
}

export interface AutoFillRaidResult {
  raidId: UUID;
  name: string;
  usedCount: number;
  duplicateAdventureCount: number;
  unplacedCount: number;
}

export interface AutoFillResponse {
  results: AutoFillRaidResult[];
  raids: RaidDetail[];
}

export interface UpdongAutoFillResponse {
  assignedCount: number;
  missingCount: number;
  raids: RaidDetail[];
}

export interface StatHistoryEntry {
  id: UUID;
  damage: number;
  buffPower: number;
  createdAt?: string | null;
}

export interface StatHistory {
  participantId: UUID;
  history: StatHistoryEntry[];
}
