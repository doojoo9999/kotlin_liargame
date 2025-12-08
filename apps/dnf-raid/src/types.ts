export type UUID = string;

export type PartyNumber = number | null;
export type SlotIndex = number | null;

export interface DnfCharacter {
  characterId: string;
  serverId: string;
  characterName: string;
  jobName: string;
  jobGrowName: string;
  fame: number;
  damage?: number;
  buffPower?: number;
  adventureName?: string | null;
  imageUrl: string;
}

export interface Participant {
  id: UUID;
  raidId: UUID;
  damage: number;
  buffPower: number;
  partyNumber: PartyNumber;
  slotIndex: SlotIndex;
  character: DnfCharacter;
  createdAt?: string | null;
}

export interface RaidDetail {
  id: UUID;
  name: string;
  userId: string;
  isPublic: boolean;
  parentRaidId?: UUID | null;
  createdAt?: string | null;
  participants: Participant[];
}

export interface RaidSummary {
  id: UUID;
  name: string;
  isPublic: boolean;
  createdAt?: string | null;
  participantCount: number;
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
