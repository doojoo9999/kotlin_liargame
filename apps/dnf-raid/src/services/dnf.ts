import {api} from "./api";
import type {
  DnfCharacter,
  Participant,
  RaidSummary,
  RaidDetail,
  StatHistory,
  UUID,
} from "../types";
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

export async function createRaid(payload: {name: string; userId: string; password?: string; isPublic?: boolean}) {
  const {data} = await api.post<RaidDetail>("/raids", payload);
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
  }
) {
  const {data} = await api.post<Participant>(`/raids/${raidId}/participants`, payload);
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
  }>
) {
  const {data} = await api.post<RaidDetail>(`/raids/${raidId}/participants/bulk`, {
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

export async function getStatHistory(raidId: UUID, participantId: UUID) {
  const {data} = await api.get<StatHistory>(
    `/raids/${raidId}/participants/${participantId}/history`
  );
  return data;
}
