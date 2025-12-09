import {api} from "./api";
import type {
  DnfCharacter,
  CohortPreference,
  Participant,
  RaidSummary,
  RaidDetail,
  RaidGroup,
  StatHistory,
  UUID,
  AutoFillResponse,
  UpdongAutoFillResponse,
} from "../types";
import type {PartyTargetConfig} from "../utils/autoAssign";
import type {DnfServerId} from "../constants";

export async function searchCharacters(characterName: string, serverId: DnfServerId) {
  const {data} = await api.get<DnfCharacter[]>("/characters/search", {
    params: {characterName, serverId, limit: 20},
  });
  return data;
}

export async function searchCharactersByAdventure(adventureName: string) {
  const {data} = await api.get<DnfCharacter[]>("/characters/search", {
    params: {adventureName, limit: 20},
  });
  return data;
}

export async function registerCharacter(payload: {
  serverId: string;
  characterId: string;
  damage?: number;
  buffPower?: number;
}) {
  const {data} = await api.post<DnfCharacter>("/characters/register", payload);
  return data;
}

export async function createRaid(payload: {
  name: string;
  userId: string;
  motherRaidId?: string | null;
  password?: string;
  isPublic?: boolean;
}) {
  const {data} = await api.post<RaidDetail>("/raids", payload);
  return data;
}

export async function getRaidGroup(motherRaidId: UUID) {
  const {data} = await api.get<RaidGroup>(`/raids/group/${motherRaidId}`);
  return data;
}

export async function getRaid(raidId: UUID) {
  const {data} = await api.get<RaidDetail>(`/raids/${raidId}`);
  return data;
}

export async function updateRaidVisibility(raidId: UUID, isPublic: boolean) {
  const {data} = await api.patch<RaidDetail>(`/raids/${raidId}/visibility`, {isPublic});
  return data;
}

export async function deleteParticipantsByAdventure(raidId: UUID, adventureName?: string | null) {
  const params: Record<string, string> = {};
  if (adventureName) {
    params.adventureName = adventureName;
  }
  const {data} = await api.delete<RaidDetail>(`/raids/${raidId}/participants/by-adventure`, {
    params,
  });
  return data;
}

export async function getLatestRaid(userId: string) {
  const {data} = await api.get<RaidDetail>("/raids/latest", {params: {userId}});
  return data;
}

export async function getRecentRaids(userId: string, limit = 4) {
  const {data} = await api.get<RaidSummary[]>("/raids/recent", {params: {userId, limit}});
  return data;
}

export async function searchRaidsByName(name: string, limit = 20) {
  const {data} = await api.get<RaidSummary[]>("/raids/search", {params: {name, limit}});
  return data;
}

export async function cloneRaid(
  raidId: UUID,
  payload?: {
    name?: string;
    isPublic?: boolean;
  }
) {
  const body: Record<string, unknown> = {};
  if (payload?.name) body.name = payload.name;
  if (typeof payload?.isPublic === "boolean") body.isPublic = payload.isPublic;
  const {data} = await api.post<RaidDetail>(`/raids/${raidId}/clone`, body);
  return data;
}

export async function addParticipant(
  raidId: UUID,
  payload: {
    serverId: string;
    characterId: string;
    damage?: number;
    buffPower?: number;
    partyNumber?: number | null;
    slotIndex?: number | null;
    cohortPreference?: CohortPreference | null;
  }
) {
  const {data} = await api.post<Participant>(`/raids/${raidId}/participants`, payload);
  return data;
}

export async function addParticipantByMother(
  motherRaidId: UUID,
  payload: {
    serverId: string;
    characterId: string;
    damage?: number;
    buffPower?: number;
    partyNumber?: number | null;
    slotIndex?: number | null;
    cohortPreference?: CohortPreference | null;
  }
) {
  const {data} = await api.post<Participant>(`/raids/group/${motherRaidId}/participants`, payload);
  return data;
}

export async function addParticipantsBulk(
  raidId: UUID,
  participants: Array<{
    serverId: string;
    characterId: string;
    damage?: number;
    buffPower?: number;
    partyNumber?: number | null;
    slotIndex?: number | null;
    cohortPreference?: CohortPreference | null;
  }>
) {
  const {data} = await api.post<RaidDetail>(`/raids/${raidId}/participants/bulk`, {
    participants,
  });
  return data;
}

export async function addParticipantsBulkByMother(
  motherRaidId: UUID,
  participants: Array<{
    serverId: string;
    characterId: string;
    damage?: number;
    buffPower?: number;
    partyNumber?: number | null;
    slotIndex?: number | null;
    cohortPreference?: CohortPreference | null;
  }>
) {
  const {data} = await api.post<RaidDetail>(`/raids/group/${motherRaidId}/participants/bulk`, {
    participants,
  });
  return data;
}

export async function updateParticipant(
  raidId: UUID,
  participantId: UUID,
  payload: Partial<{
    damage: number;
    buffPower: number;
    partyNumber: number | null;
    slotIndex: number | null;
  }>
) {
  const {data} = await api.patch<Participant>(
    `/raids/${raidId}/participants/${participantId}`,
    payload
  );
  return data;
}

export async function deleteParticipant(raidId: UUID, participantId: UUID) {
  await api.delete(`/raids/${raidId}/participants/${participantId}`);
}

export async function getStatHistory(raidId: UUID, participantId: UUID) {
  const {data} = await api.get<StatHistory>(
    `/raids/${raidId}/participants/${participantId}/history`
  );
  return data;
}

export async function autoFillRaids(payload: {
  raidIds: UUID[];
  partyCount: number;
  slotsPerParty: number;
  targets?: PartyTargetConfig[];
  keepPlaced?: boolean;
}) {
  const {raidIds, partyCount, slotsPerParty, targets, keepPlaced} = payload;
  const path = keepPlaced ? "/raids/auto-fill/keep-placed" : "/raids/auto-fill";
  const body: Record<string, unknown> = {
    raidIds,
    partyCount,
    slotsPerParty,
  };
  if (targets && targets.length > 0) {
    body.partyTargets = targets.map((target) => ({
      damageTarget: target.damageTarget,
      buffTarget: target.buffTarget,
    }));
  }
  const {data} = await api.post<AutoFillResponse>(path, body);
  return data;
}

export async function autoFillUpdong(payload: {
  raidIds: UUID[];
  partyCount: number;
  slotsPerParty: number;
}) {
  const {data} = await api.post<UpdongAutoFillResponse>("/raids/auto-fill/updong", payload);
  return data;
}
