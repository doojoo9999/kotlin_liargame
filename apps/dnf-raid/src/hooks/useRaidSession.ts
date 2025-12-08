import {useCallback, useMemo, useState} from "react";
import type {DnfCharacter, UUID} from "../types";

const RAID_KEY = "dnf-raid:active-raid-id";
const MOTHER_RAID_KEY = "dnf-raid:mother-raid-id";
const LEADER_CHARACTER_KEY = "dnf-raid:leader-character";

const buildLeaderId = (character: DnfCharacter) =>
  [character.adventureName || character.characterName, character.serverId].filter(Boolean).join("|");

export function useRaidSession() {
  const [raidId, setRaidId] = useState<UUID | null>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(RAID_KEY) : null;
    return saved ?? null;
  });

  const [motherRaidId, setMotherRaidId] = useState<UUID | null>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(MOTHER_RAID_KEY) : null;
    return saved ?? null;
  });

  const [leaderCharacter, setLeaderCharacter] = useState<DnfCharacter | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(LEADER_CHARACTER_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as DnfCharacter;
    } catch {
      return null;
    }
  });

  const updateRaidId = useCallback((id: UUID | null) => {
    setRaidId(id);
    if (id) {
      localStorage.setItem(RAID_KEY, id);
    } else {
      localStorage.removeItem(RAID_KEY);
    }
  }, []);

  const updateMotherRaidId = useCallback((id: UUID | null) => {
    setMotherRaidId(id);
    if (id) {
      localStorage.setItem(MOTHER_RAID_KEY, id);
    } else {
      localStorage.removeItem(MOTHER_RAID_KEY);
    }
  }, []);

  const updateLeaderCharacter = useCallback((character: DnfCharacter | null) => {
    setLeaderCharacter(character);
    if (character) {
      localStorage.setItem(LEADER_CHARACTER_KEY, JSON.stringify(character));
    } else {
      localStorage.removeItem(LEADER_CHARACTER_KEY);
    }
  }, []);

  const leaderId = useMemo(
    () => (leaderCharacter ? buildLeaderId(leaderCharacter) : ""),
    [leaderCharacter]
  );

  return {
    raidId,
    motherRaidId,
    leaderId,
    leaderCharacter,
    setRaidId: updateRaidId,
    setMotherRaidId: updateMotherRaidId,
    setLeaderCharacter: updateLeaderCharacter,
  };
}

export {buildLeaderId};
