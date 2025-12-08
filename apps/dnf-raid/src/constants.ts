export const DNF_SERVERS = [
  {id: "cain", name: "카인"},
  {id: "diregie", name: "디레지에"},
  {id: "siroco", name: "시로코"},
  {id: "prey", name: "프레이"},
  {id: "casillas", name: "카시야스"},
  {id: "hilder", name: "힐더"},
  {id: "anton", name: "안톤"},
  {id: "bakal", name: "바칼"},
] as const;

export type DnfServerId = (typeof DNF_SERVERS)[number]["id"];

export const serverNameMap: Record<string, string> = DNF_SERVERS.reduce<Record<string, string>>(
  (acc, server) => {
    acc[server.id] = server.name;
    return acc;
  },
  {}
);

export function getServerName(serverId: string): string {
  return serverNameMap[serverId] ?? serverId;
}

export const DIREGIE_MIN_FAME = 63000;
export const HARD_NABEL_MIN_FAME = 47684;
export const INAE_TWILIGHT_MIN_FAME = 72688;

export type RaidModeId = "diregie" | "hard-nabel" | "inae-twilight";

export type RaidMode = {
  id: RaidModeId;
  name: string;
  badge: string;
  description: string;
  partyCount: number;
  slotsPerParty: number;
  minFame?: number;
  matchers: RegExp[];
};

export const RAID_MODES: RaidMode[] = [
  {
    id: "diregie",
    name: "디레지에 레이드",
    badge: "12인",
    description: "명성 63,257+ , 3파티 구성",
    partyCount: 3,
    slotsPerParty: 4,
    minFame: DIREGIE_MIN_FAME,
    matchers: [/디레지에/i, /diregie/i],
  },
  {
    id: "hard-nabel",
    name: "하드 나벨",
    badge: "12인",
    description: "명성 47,684+ , 3파티 구성",
    partyCount: 3,
    slotsPerParty: 4,
    minFame: HARD_NABEL_MIN_FAME,
    matchers: [/하드\s*나벨/i, /hard\s*nabel/i],
  },
  {
    id: "inae-twilight",
    name: "이내 황혼전",
    badge: "8인",
    description: "명성 72,688+ 권장, 2파티 구성",
    partyCount: 2,
    slotsPerParty: 4,
    minFame: INAE_TWILIGHT_MIN_FAME,
    matchers: [/이내\s*황혼전/i, /황혼전/i, /twilight/i],
  },
] as const;

export const DEFAULT_RAID_MODE = RAID_MODES[0];

export function getRaidModeById(id?: string | null): RaidMode {
  if (!id) return DEFAULT_RAID_MODE;
  return RAID_MODES.find((mode) => mode.id === id) ?? DEFAULT_RAID_MODE;
}

export function getRaidModeFromName(name?: string | null): RaidMode {
  if (!name) return DEFAULT_RAID_MODE;
  const match = RAID_MODES.find((mode) => mode.matchers.some((regex) => regex.test(name)));
  return match ?? DEFAULT_RAID_MODE;
}

export function isDiregieRaid(name?: string | null): boolean {
  return getRaidModeFromName(name).id === "diregie";
}
