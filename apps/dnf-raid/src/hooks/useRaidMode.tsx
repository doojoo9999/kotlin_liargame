import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";
import {DEFAULT_RAID_MODE, getRaidModeById, type RaidMode, type RaidModeId} from "../constants";

type RaidModeContextValue = {
  raidModeId: RaidModeId;
  raidMode: RaidMode;
  setRaidModeId: (id: RaidModeId) => void;
};

const STORAGE_KEY = "dnf-raid:mode-id";

const RaidModeContext = createContext<RaidModeContextValue | null>(null);

export function RaidModeProvider({children}: {children: ReactNode}) {
  const [raidModeId, setRaidModeIdState] = useState<RaidModeId>(() => {
    if (typeof window === "undefined") return DEFAULT_RAID_MODE.id;
    const saved = localStorage.getItem(STORAGE_KEY) as RaidModeId | null;
    return saved ?? DEFAULT_RAID_MODE.id;
  });

  const setRaidModeId = useCallback((id: RaidModeId) => {
    setRaidModeIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const value = useMemo<RaidModeContextValue>(
    () => ({
      raidModeId,
      raidMode: getRaidModeById(raidModeId),
      setRaidModeId,
    }),
    [raidModeId, setRaidModeId]
  );

  return <RaidModeContext.Provider value={value}>{children}</RaidModeContext.Provider>;
}

export function useRaidMode() {
  const ctx = useContext(RaidModeContext);
  if (!ctx) {
    throw new Error("useRaidMode must be used within RaidModeProvider");
  }
  return ctx;
}
