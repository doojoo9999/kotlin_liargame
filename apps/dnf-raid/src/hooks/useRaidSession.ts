import {useCallback, useState} from "react";
import type {UUID} from "../types";

const RAID_KEY = "dnf-raid:active-raid-id";
const USER_KEY = "dnf-raid:leader-user-id";

export function useRaidSession() {
  const [raidId, setRaidId] = useState<UUID | null>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(RAID_KEY) : null;
    return saved ?? null;
  });

  const [userId, setUserId] = useState<string>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    return saved ?? "";
  });

  const updateRaidId = useCallback((id: UUID | null) => {
    setRaidId(id);
    if (id) {
      localStorage.setItem(RAID_KEY, id);
    } else {
      localStorage.removeItem(RAID_KEY);
    }
  }, []);

  const updateUserId = useCallback((value: string) => {
    setUserId(value);
    if (value) {
      localStorage.setItem(USER_KEY, value);
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  return {raidId, userId, setRaidId: updateRaidId, setUserId: updateUserId};
}
