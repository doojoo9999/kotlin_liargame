import {api} from "./api";
import type {
  DnfCharacter,
  Participant,
  RaidDetail,
  StatHistory,
  UUID,
} from "../types";

export async function searchCharacters(characterName: string) {
  const {data} = await api.get<DnfCharacter[]>("/characters/search", {
    params: {characterName, limit: 20},
  });
  return data;
}

export async function searchCharactersByAdventure(adventureName: string) {
  const {data} = await api.get<DnfCharacter[]>("/characters/search", {
    params: {adventureName, limit: 20},
  });
  return data;
}

export async function createRaid(payload: {name: string; userId: string; password?: string}) {
  const {data} = await api.post<RaidDetail>("/raids", payload);
  return data;
}

export async function getRaid(raidId: UUID) {
  const {data} = await api.get<RaidDetail>(`/raids/${raidId}`);
  return data;
}

export async function getLatestRaid(userId: string) {
  const {data} = await api.get<RaidDetail>("/raids/latest", {params: {userId}});
  return data;
}

export async function cloneRaid(raidId: UUID, name?: string) {
  const {data} = await api.post<RaidDetail>(`/raids/${raidId}/clone`, {name});
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
