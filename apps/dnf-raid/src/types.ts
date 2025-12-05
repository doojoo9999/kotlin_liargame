export type UUID = string;

export type PartyNumber = 1 | 2 | 3 | null;
export type SlotIndex = 0 | 1 | 2 | 3 | null;

export interface DnfCharacter {
  characterId: string;
  serverId: string;
  characterName: string;
  jobName: string;
  jobGrowName: string;
  fame: number;
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
  parentRaidId?: UUID | null;
  createdAt?: string | null;
  participants: Participant[];
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
